import axios from 'axios';
import chalk from 'chalk';
import { password } from '@inquirer/prompts'
import * as fs from 'fs';
import ora from 'ora';
import { homedir } from 'os';
import path from 'path';
import { httpRequests } from '../utils/common_utils.js';
export default async function init() {
    let spin;
    try {
        console.log(chalk.cyan('🚀 Welcome to Breeze CLI tool'));
        console.log(chalk.cyan('Please configure your project'));
        const api_key = await password({
            message: 'Enter your API Key',
            mask: true,
            validate: (value) => {
                if (value.length === 0) return "Api key is required";
                return true;
            },
        });
        const project_key = await password({
            message: 'Enter your Project Key',
            mask: true,
            placeholder: 'uuid',
            validate: (value) => {
                if (value.length === 0) return "Project key is required";
                return true;
            },
        });
        spin = ora("Validating your project configuration..").start()
        spin.color = "yellow"
        spin.spinner = "circleHalves"
        let project_name;
        let args = {
            url: `https://isometric-backend.accionbreeze.com/projects`,
            headers: {
                "Content-Type": "application/json",
                "api-key": `${api_key}`
            },
            method: "GET"
        }
        const validate_setup = await httpRequests(args)
        let is_valid_configuration = false
        if (validate_setup.status == 200) {
            for (var i of validate_setup.data.data) {
                if (i.uuid == project_key) {
                    is_valid_configuration = true;
                    project_name = i.name
                    break;
                }
            }
            if (!is_valid_configuration) {
                spin.stop();
                console.log(chalk.red('❌ Not a valid project key'));
                process.exit(0);
            }
        }

        if (!fs.existsSync(path.join(homedir(), ".breeze"))) {
            fs.mkdirSync(path.join(homedir(), ".breeze"))
        }
        fs.writeFileSync(path.join(homedir(), ".breeze/.config"), JSON.stringify({
            api_key,
            project_key
        }))
        spin.stop();
        console.log(chalk.green(`✅ Setting configuration successful for ${project_name}...`))
    } catch (error) {
        if (spin) spin.stop();
        console.log(chalk.red('❌ Error during project configuration :error:::', error.message));
        process.exit(0);
    }

}
