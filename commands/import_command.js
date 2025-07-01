import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import path from 'path';
import axios from 'axios';

const importBreeze = async (args) => {
        try {
            let project_config_details = fs.readFileSync('./.breeze/.config');
            let proj_data = JSON.parse(project_config_details);
            const url = `https://isometric-backend.accionbreeze.com/semantic-model/get-screen?projectuuid=${proj_data.project_key}&websiteId=${args.websiteId}&screenId=${args.screenId}`;
            console.log(chalk.blue(`🔗 Fetching data from: ${url}`));
            const response = await axios.get(url, {
                headers: {
                    "Content-Type": "application/json",
                    "api-key": `${proj_data.api_key}`
                }
            });
            // if (!fs.existsSync(args.directory)) {
            //     fs.mkdirSync(args.directory, { recursive: true });
            // }
            // const outputPath = path.join(args.directory, `${args.screenId}.json`);
            // fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
            for(let resource of response.data?.resources)  {
                const resourceDirectory = `${args.directory}/resources`
                if(resource?.type === 'screenshot' || resource?.type === 'layout_json' ) {
                    if(!fs.existsSync(resourceDirectory)) {
                        fs.mkdirSync(resourceDirectory, { recursive: true });
                    }
                    const filekey = `${resource?.s3Url.split('amazonaws.com')?.[1]?.replace(/^\/+/, '')}`
                    console.log(chalk.blue(`🔗 File Key ${filekey}`));
                    const signedUrlAPI = `https://isometric-backend.accionbreeze.com/documents/get-signed-url/${encodeURIComponent(filekey)}`;
                    const signedUrlResponse = await axios.get(signedUrlAPI, {
                        headers: {
                            "Content-Type": "application/json",
                            "api-key": `${proj_data.api_key}`
                        }
                    });
                    
                    const outputPath = path.join(resourceDirectory, resource?.fileName);
                    console.log(chalk.blue(`🔗 Downloading file from: ${signedUrlResponse.data}`));
                    await downloadFile(signedUrlResponse.data, outputPath);
                    console.log(chalk.green(`✅ Response saved to ${outputPath}`));
                }
            }
            
        } catch (error) {
            console.log(chalk.red('❌ Error ::: ', error));
            process.exit(1);
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
        console.log(`File downloaded to ${outputLocationPath}`);
        resolve();
      });
      writer.on('error', reject);
    });

  } catch (error) {
    console.error(`Failed to download file: ${error.message}`);
  }
}



const importCmd = new Command('import')
    .description('Import screen data from API and save to directory')
    .requiredOption('--screenId <string>', 'Screen ID')
    .requiredOption('--websiteId <string>', 'Website ID')
    .requiredOption('--directory <string>', 'Directory to save response')
    .action(importBreeze);

export default importCmd;
