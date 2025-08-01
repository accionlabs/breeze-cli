import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import path from 'path';
import axios from 'axios';
import config from '../config.js';
import { confirm } from '@inquirer/prompts';
import { query } from '@anthropic-ai/claude-code';
import ora from 'ora';
import { fetchConfiguration } from '../utils/common_utils.js';
const importBreeze = async (args) => {
    try {
        let proj_data = await fetchConfiguration();
        const url = `${config.ISOMETRIC_API_URL}/semantic-model/get-screen?projectuuid=${proj_data.project_key}&websiteId=${args.websiteId}&screenId=${args.screenId}`;
        const response = await axios.get(url, {
            headers: {
                "Content-Type": "application/json",
                "api-key": `${proj_data.api_key}`
            }
        });

        // --- Validation logic start ---
        // Check for CLAUDE.md in the root of the current working directory
        const claudePath = path.join(process.cwd(), 'CLAUDE.md');
        if (!fs.existsSync(claudePath)) {
            console.log(chalk.red('❌ Error: CLAUDE.md file does not exist in the root directory.'));
            process.exit(1);
        }

        const resources = response.data?.resources || [];
        const tasks = response.data?.tasks || [];
        const hasImage = resources.some(r => r.type === 'screenshot');
        const hasLayout = resources.some(r => r.type === 'layout_json');
        const hasAssets = resources.some(r => r.type === 'icon' || r.type === 'asset');
        const hasTasks = Array.isArray(tasks) && tasks.length > 0;

        if (!hasImage && !hasTasks && !hasLayout) {
            console.log(chalk.red('❌ Error: Screen does not have any resources or tasks.'));
            process.exit(1);
        }

        if (hasImage) {
            console.log(chalk.green('✅ Screen Screenshot found.'));
        } else {
            console.log(chalk.yellow('⚠️ Warning: No screenshot found.'));
        }

        if (hasLayout) {
            console.log(chalk.green('✅ Screen Layout json found.'));
        } else {
            console.log(chalk.yellow('⚠️ Warning: No layout json found.'));
        }

        if (hasAssets) {
            console.log(chalk.green('✅ Screen Assets found.'));
        } else {
            console.log(chalk.yellow('⚠️ Warning: No assets found.'));
        }

        if (hasTasks) {
            console.log(chalk.green('✅ Screen Tasks found.'));
        } else {
            console.log(chalk.yellow('⚠️ Warning: No tasks found.'));
        }

        const mockupDocumentId = response.data?.mockupDocumentId;
        if(mockupDocumentId) {
            console.log(chalk.green('✅ Mockup found.'));
            const mockupDocumentUrl = `${config.ISOMETRIC_API_URL}/documents/${mockupDocumentId}`;
            const mockupResponse = await axios.get(mockupDocumentUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "api-key": `${proj_data.api_key}`
                }
            });
            const mockupFileurl = mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.fileUrl;
            const mockupHTML = mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.html;
            const mockupName = mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.fileName;
            await saveMockupScreenShot(mockupFileurl, args.directory, proj_data);
            saveMockupHTML(mockupHTML, args.directory, mockupName);
        }
        
        // --- Validation logic end ---

        // Ask user if they want to proceed
        const proceed = await confirm({ message: "Do you want to proceed? Note: It will generate better result if you provide screenshot, layout json and tasks" });
        if (!proceed) {
            console.log(chalk.red('❌ Import process exited by user.'));
            process.exit(0);
        }


        const resourceDirectory = `${args.directory}/${response.data?.name}`
        if (!fs.existsSync(resourceDirectory)) {
            fs.mkdirSync(resourceDirectory, { recursive: true });
        }
        const assetsDirectory = path.join(resourceDirectory, 'assets');
        if (!fs.existsSync(assetsDirectory)) {
            fs.mkdirSync(assetsDirectory, { recursive: true });
        }

        // saving resources and assets in directory
        await saveResource(response, resourceDirectory, assetsDirectory, proj_data);

        // saving tasks in the directory
        const outputTaskPath = path.join(resourceDirectory, `tasks.text`);
        fs.writeFileSync(outputTaskPath, JSON.stringify(response.data?.tasks, null, 2));
        let prompt = `Generate a ${response.data?.type} screen named "${response.data?.name}" using layouts (JSON) and screenshots (images) from "${resourceDirectory}", and assets from "${assetsDirectory}". The screen should accomplish the tasks defined in "${outputTaskPath}".`;
        if (response.data?.metadata?.route) {
            prompt += ` Use the route "${response.data.metadata.route}".`;
        }
        console.log(chalk.greenBright(`\n📝 Generated Prompt:\n${prompt}\n`));
        let proceedWithClaudecode = await confirm({ message: "Do you want to continue to execute Claude code with above prompt?" })
        if (proceedWithClaudecode) {
            const spin = ora().start()
            spin.color = "magenta"
            spin.prefixText = "Processing"
            spin.spinner = "simpleDots"
            let messages = []
            for await (const sdkmessage of query({
                prompt: prompt,
                abortController: new AbortController(),
                options: {
                    allowedTools: ["Read", "Write", "Bash", "Edit", "LS", "TodoWrite", "TodoRead"]
                },
            })) {
                if (sdkmessage.type == "assistant" && sdkmessage.message.content[0].type == "text") {
                    spin.stop()
                    console.log(chalk.cyan(sdkmessage.message.content[0].text));
                    spin.start()
                }
            }
            spin.stop()
        }
    } catch (error) {
        console.log(chalk.red('❌ Error ::: ', error.message));
        process.exit(1);
    }
}

async function saveMockupScreenShot(fileUrl, resourceDirectory, proj_data) {
    const filekey = `${fileUrl.split('amazonaws.com')?.[1]?.replace(/^\/+/, '')}`
    console.log(chalk.blue(`🔗 File Key ${filekey}`));
    const signedUrlAPI = `${config.ISOMETRIC_API_URL}/documents/get-signed-url/${encodeURIComponent(filekey)}`;
        const signedUrlResponse = await axios.get(signedUrlAPI, {
            headers: {
                "Content-Type": "application/json",
                "api-key": `${proj_data.api_key}`
            }
        });
        const outputPath = path.join(resourceDirectory, filekey.split('/').pop());
        await downloadFile(signedUrlResponse.data, outputPath);
}

async function saveMockupHTML(html, resourceDirectory, name) {
    const outputPath = path.join(resourceDirectory, `${name}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(chalk.green(`✅ Mockup HTML saved to ${outputPath}`));
}   

async function saveResource(response, resourceDirectory, assetsDirectory, proj_data) {
    for (let resource of response.data?.resources) {
        const filekey = `${resource?.s3Url.split('amazonaws.com')?.[1]?.replace(/^\/+/, '')}`
        console.log(chalk.blue(`🔗 File Key ${filekey}`));
        const signedUrlAPI = `${config.ISOMETRIC_API_URL}/documents/get-signed-url/${encodeURIComponent(filekey)}`;
        const signedUrlResponse = await axios.get(signedUrlAPI, {
            headers: {
                "Content-Type": "application/json",
                "api-key": `${proj_data.api_key}`
            }
        });
        let outDirectory = resourceDirectory
        if (resource?.type === 'icon') {
            outDirectory = assetsDirectory
        }
        const outputPath = path.join(outDirectory, resource?.fileName);
        await downloadFile(signedUrlResponse.data, outputPath);
    }
}


async function downloadFile(fileUrl, outputLocationPath) {
    try {
        const writer = fs.createWriteStream(outputLocationPath);

        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
        });

        // Pipe the response data to the file
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve();
            });
            writer.on('error', reject);
        });

    } catch (error) {
        console.log(chalk.red('❌ Error while downloading file ::: ', error));
        process.exit(1);
    }
}



const importCmd = new Command('import')
    .description('Import screen data from API and save to directory')
    .requiredOption('--screenId <string>', 'Screen ID')
    .requiredOption('--websiteId <string>', 'Website ID')
    .requiredOption('--directory <string>', 'Directory to save response')
    .action(importBreeze);

export default importCmd;
