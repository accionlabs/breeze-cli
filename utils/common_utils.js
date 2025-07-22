import path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import config from '../config.js';
import { homedir } from 'os';
import chalk from 'chalk';


export async function validateFileExists(filename) {
    let claudepath = path.join(process.cwd(), filename)
    if (!fs.existsSync(claudepath)) {
        console.log(chalk.red(`❌ ${filename} file does not exist`));
        return false;
    }
    return true;
}

export async function fetchConfiguration() {
    let project_config_details = fs.readFileSync(path.join(homedir(), '.breeze/.config'));
    let proj_data = JSON.parse(project_config_details);
    return proj_data;
}

export async function downloadFile(fileUrl, outputLocationPath) {
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
        throw error;
    }
}

export async function httpRequests(args) {
    try {
        let resp = await axios({
            url: args.url,
            method: args.method,
            headers: args.headers,
            params: args.params,
            data: args.data
        })
        return resp;
    } catch (error) {
        throw error;
    }
}

export async function killChildProcess(child) {
    if (!child.killed) {
        child.kill("SIGTERM");
    }
}
export async function saveResource(response, resourceDirectory, assetsDirectory, proj_data, resourceTypes) {
    const resourcePaths = {};
    for(let resourceType of resourceTypes) {
        const resources = response.data?.resources?.filter(resource => resource?.type === resourceType);
        for(let resource of resources) {
        const filekey = `${resource?.s3Url.split('amazonaws.com')?.[1]?.replace(/^\/+/, '')}`
        console.log(chalk.blue(`🔗 File Key ${filekey}`));
        const signedUrlAPI = `${config.ISOMETRIC_API_URL}/documents/get-signed-url/${encodeURIComponent(filekey)}`;
            let args = {
                url: signedUrlAPI,
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": `${proj_data.api_key}`
                }

            }
            const signedUrlResponse = await httpRequests(args)
            
            let outDirectory = resourceDirectory
            if (resource?.type === 'icon' || resource?.type === 'font') {
                outDirectory = assetsDirectory
            }
            const outputPath = path.join(outDirectory, resource?.fileName);
            await downloadFile(signedUrlResponse.data, outputPath);
            // Collect paths by resource type
            if (!resourcePaths[resource.type]) {
                resourcePaths[resource.type] = [];
            }
            resourcePaths[resource.type].push(outputPath);
        }
    }
    return resourcePaths;
}


