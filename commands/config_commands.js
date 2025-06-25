import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';

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
        
        if (!fs.existsSync("./.breeze")) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let project_config_details = fs.readFileSync('./.breeze/.config');
        let proj_data = JSON.parse(project_config_details);
        spin.stop();
        if (args?.setApiKey) proj_data.api_key = args.setApiKey;
        if (args?.setProjectKey) proj_data.project_key = args.setProjectKey;

        fs.writeFileSync('./.breeze/.config', JSON.stringify(proj_data))
        const proceed = await confirm({
            message: `Do you want to validate your configuration`,
        });
        if (proceed) {
            spin.start(chalk.cyan('Validating your configuration '));
            const validate_setup = await axios({
                url: `https://isometric-backend.accionbreeze.com/projects`,
                headers: {
                    "Content-Type": "application/json",
                    "api-key": `${proj_data.api_key}`
                }
            });
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
    try {
        const spin = ora(chalk.cyan('🚀 Deleting your project config settings')).start()
                        spin.color = "yellow"
                        spin.spinner = "circleHalves"
        if (!fs.existsSync("./.breeze")) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        fs.unlinkSync('./.breeze/.config');

        spin.stop();

        await new Promise((res) => setTimeout(res, 1000));
        // Simulate setup (replace with real logic)
        console.log(chalk.green(`\n✅ Configuration has been deleted`)); JMN
    } catch (error) {
        console.log(chalk.red('❌ Error :::', error.message));
        process.exit(0);
    }
}


async function fetchExistingConfiguration() {
    try {
        if (!fs.existsSync("./.breeze")) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        if (!fs.existsSync("./.breeze/.config")) {
            console.log(chalk.red(`❌ Configuration missing. Please re-initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let proj_data = fs.readFileSync('./.breeze/.config')
        console.log(proj_data.toString())
    } catch (error) {
        console.log(chalk.red('❌ Error :::', error.message));
        process.exit(0);
    }
}

export default config;
