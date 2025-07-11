import chalk from 'chalk';
import { Command } from 'commander';
import { confirm } from '@inquirer/prompts'
import * as fs from 'fs';
import path, { dirname } from 'path';
import { query } from '@anthropic-ai/claude-code';
import { fileURLToPath } from 'url';
import ora from 'ora';
import { fetchConfiguration, httpRequests, saveResource, validateFileExists } from '../utils/common_utils.js'
import config from '../config.js';


const generate = new Command('generate').description('generate frontend and backend project code');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate_frontend_code(args) {
    let spin;
    try {
        //check claude.md file exists
        let claudeFileValidation = await validateFileExists('CLAUDE.md');
        if (!claudeFileValidation) process.exit(0);
        let proj_data = await fetchConfiguration();
        let prompt;
        if (args.screenId) {
            let httpArgs = {
                url: `${config.ISOMETRIC_API_URL}/semantic-model/get-screen`,
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": `${proj_data.api_key}`
                },
                params: {
                    projectuuid: `${proj_data.project_key}`,
                    websiteId: `${args.websiteId}`,
                    screenId: `${args.screenId}`
                }
            }
            const response = await httpRequests(httpArgs);
            if (response.data.error) {
                throw new Error(response.data.message)
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
            prompt = `Generate a ${response.data?.type} screen named "${response.data?.name}" using layouts (JSON) and screenshots (images) from "${resourceDirectory}", and assets from "${assetsDirectory}". The screen should accomplish the tasks defined in "${outputTaskPath}".`;
            if (response.data?.metadata?.route) {
                prompt += ` Use the route "${response.data.metadata.route}".`;
            }
        }
        //import files if required
        else if (args.directory) {
            let files = fs.readdirSync(path.join(args.directory), { recursive: true });
            let jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
            if (jsonFiles.length == 0) {
                console.log(chalk.yellowBright('⚠️ No Json files are found.'));
                let confirmContinue = await confirm({ message: "Do you want to continue?" })
                if (!confirmContinue) {
                    console.log(chalk.red('Frontend code generation process exited'));
                    process.exit(0);
                }
            }
            let directoryPathPrompt = args.directory ? `Use any image files from provided ${args.directory} folder as overall layout and styling references. Use any JSON files (e.g., 'header.json', 'main.json') as structured Figma exports to guide the generation of individual UI components.` : "";
            prompt = `${args.requirement}. ${directoryPathPrompt}`
        }


        console.log(chalk.greenBright(`${prompt}`))
        let proceedWithClaudecode = await confirm({ message: "Do you want to continue to execute Claude code with above prompt?" })
        if (proceedWithClaudecode) {
            spin = ora().start()
            spin.color = "magenta"
            spin.prefixText = "Processing"
            spin.spinner = "simpleDots"
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

        //process.exit(0);
    } catch (error) {
        if (spin) spin.stop();
        console.log(error)
        let message = (error?.response?.data?.error) ? error?.response?.data?.message : error.message;
        console.log(chalk.red('❌ Error ::: ', message));
        process.exit(0);
    }
}

generate
    .command('frontend')
    .description("Generate frontend code")
    .option("--requirement <string>", "user requirement")
    .option('--directory <string>', "Absolute path for claude to load files")
    .option("--screenId <string>", "Screen Id")
    .option('--websiteId <string>', "Website Id")
    .action(generate_frontend_code);
export default generate;