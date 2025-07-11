import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import path from 'path';
import { homedir } from 'os';
import { httpRequests } from '../utils/common_utils.js';

const config = new Command('config')
    .description('Update the configuration setttings');

config
    .command("update")
    .option('--set-api-key <string>')
    .option('--set-project-key <string>')
    .description('update your api key')
    .action(config_update_api);

config
    .command('delete')
    .description('Delete existing configuration')
    .action(config_delete);

config
    .command('get')
    .description('Fetch existing Configuration')
    .action(fetchExistingConfiguration);

async function config_update_api(args) {
    try {

        console.log(chalk.cyan('🚀 Update your project settings '));
        const spin = ora(chalk.cyan('Reading existing configuration ')).start()
        spin.color = "yellow"
        spin.spinner = "circleHalves"

        if (!fs.existsSync(path.join(homedir(), ".breeze"))) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let project_config_details = fs.readFileSync(path.join(homedir(), ".breeze/.config"));
        let proj_data = JSON.parse(project_config_details);
        spin.stop();
        if (args?.setApiKey) proj_data.api_key = args.setApiKey;
        if (args?.setProjectKey) proj_data.project_key = args.setProjectKey;

        fs.writeFileSync(path.join(homedir(), ".breeze/.config"), JSON.stringify(proj_data))
        const proceed = await confirm({
            message: `Do you want to validate your configuration`,
        });
        if (proceed) {
            spin.start(chalk.cyan('Validating your configuration '));
            let args = {
                url: `https://isometric-backend.accionbreeze.com/projects`,
                headers: {
                    "Content-Type": "application/json",
                    "api-key": `${proj_data.api_key}`
                },
                method: "GET"
            }
            const validate_setup = await httpRequests(args)
            spin.stop();
            let is_valid_configuration = false
            if (validate_setup.status == 200) {
                for (var i of validate_setup.data.data) {
                    if (i.uuid == proj_data.project_key) {
                        is_valid_configuration = true;
                        break;
                    }
                }
                if (!is_valid_configuration) {
                    console.log(chalk.red('❌ Not a valid configuration'));
                    process.exit(0);
                }
            }
        }

        await new Promise((res) => setTimeout(res, 1000));
        console.log(chalk.green(`\n✅ Updating configuration successful...`));
    } catch (error) {
        console.log(chalk.red('❌ Error :::', error.message));
        process.exit(0);
    }

}

async function config_delete() {
    let spin;
    try {
        spin = ora(chalk.cyan('🚀 Deleting your project config settings')).start()
        spin.color = "yellow"
        spin.spinner = "circleHalves"
        if (!fs.existsSync(path.join(homedir(), ".breeze"))) {

            console.log(chalk.red(`❌ Project not initialized. Can not delete any configuration`));
            process.exit(0);
        }
        fs.unlinkSync(path.join(homedir(), ".breeze/.config"));

        spin.stop();

        await new Promise((res) => setTimeout(res, 1000));
        // Simulate setup (replace with real logic)
        console.log(chalk.green(`\n✅ Configuration has been deleted`));
    } catch (error) {
        if (spin) spin.stop();
        console.log(chalk.red('❌ Error :::', error.message));
        process.exit(0);
    }
}


async function fetchExistingConfiguration() {
    try {
        if (!fs.existsSync(path.join(homedir(), ".breeze"))) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        if (!fs.existsSync(path.join(homedir(), ".breeze/.config"))) {
            console.log(chalk.red(`❌ Configuration missing. Please re-initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let proj_data = fs.readFileSync(path.join(homedir(), ".breeze/.config"))
        console.log(proj_data.toString())
    } catch (error) {
        console.log(chalk.red('❌ Error :::', error.message));
        process.exit(0);
    }
}

export default config;
