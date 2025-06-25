import ora from 'ora';
import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
const list = new Command('list').description('List tasks,scenarios and personas');
async function personas() {
    try {
        const spin = ora("Please wait for the personas to be listed here").start()
        spin.color = "magenta"
        spin.spinner = "circleHalves"
        if (!fs.existsSync("./.breeze")) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        if (!fs.existsSync("./.breeze/.config")) {
            console.log(chalk.red(`❌ Configuration missing. Please re-initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let project_config_details = fs.readFileSync('./.breeze/.config');
        let proj_data = JSON.parse(project_config_details);
        const fetchProjectDetails = await axios({
            url: `https://isometric-backend.accionbreeze.com/semantic-model/byUUID/${proj_data.project_key}`,
            headers: {
                "Content-Type": "application/json",
                "api-key": `${proj_data.api_key}`
            }
        });
        spin.stop();
        if (fetchProjectDetails.status == 200 && !fetchProjectDetails.data.error) {
            for (var i of fetchProjectDetails.data.qum_specs?.unified_model) {
                console.log(`👤 ${i.persona}`);
            }
        }
        else{
            console.log(chalk.red(`❌  ${fetchProjectDetails.data.message}`));
            process.exit(0);
        }
    } catch (error) {
        console.log(chalk.red('❌ Error ::: ', error.message));
        process.exit(0);
    }

}
async function personas_tasks(task) {
    try {
        const spin = ora("Please wait for the tasks to be listed here");
        spin.color = "magenta"
        spin.spinner = "circleHalves"
        if (!fs.existsSync("./.breeze")) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        if (!fs.existsSync("./.breeze/.config")) {
            console.log(chalk.red(`❌ Configuration missing. Please re initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let project_config_details = fs.readFileSync('./.breeze/.config');
        let proj_data = JSON.parse(project_config_details);
        const fetchProjectDetails = await axios({
            url: `https://isometric-backend.accionbreeze.com/semantic-model/byUUID/${proj_data.project_key}`,
            headers: {
                "Content-Type": "application/json",
                "api-key": `${proj_data.api_key}`
            }
        });
        spin.stop();
        if (fetchProjectDetails.status == 200) {
            for (var i of fetchProjectDetails.data.qum_specs?.unified_model) {
                if (i.persona == task.persona) {
                    for (var j of i.outcomes) {
                        console.log(`📌 ${j.outcome}`);
                    }
                }
            }
        }
    } catch (error) {
        console.log(chalk.red('❌ Error ::: ', error.message));
        process.exit(0);
    }

}

async function task_scenarios(task) {
    try {
        const spin = ora("Please wait for the scenarios to be listed here");
        spin.color = "magenta"
        spin.spinner = "circleHalves"
        if (!fs.existsSync("./.breeze")) {
            console.log(chalk.red(`❌ Project not initialized. please initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        if (!fs.existsSync("./.breeze/.config")) {
            console.log(chalk.red(`❌ Configuration missing. Please re initialize the project using this command "breeze init"`));
            process.exit(0);
        }
        let project_config_details = fs.readFileSync('./.breeze/.config');
        let proj_data = JSON.parse(project_config_details);
        const fetchProjectDetails = await axios({
            url: `https://isometric-backend.accionbreeze.com/semantic-model/byUUID/${proj_data.project_key}`,
            headers: {
                "Content-Type": "application/json",
                "api-key": `${proj_data.api_key}`
            }
        });
        spin.stop();
        if (fetchProjectDetails.status == 200) {
            for (var i of fetchProjectDetails.data.qum_specs?.unified_model) {
                for (var j of i.outcomes) {
                    if (j.outcome == task.task) {
                        for (var k of j.scenarios) {
                            console.log(`🔹${k.scenario}`);
                            for(var l of k.steps){
                                console.log(`\t ➤ ${l.step}`);
                                if(l.actions.length>0){
                                    for(var m of l.actions){
                                        console.log(`\t\t • ${m.action}`);
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.log(chalk.red('❌ Error ::: ', error.message));
        process.exit(0);
    }

}

list
    .command('personas')
    .description("list personas")
    .action(personas);


list
    .command('tasks')
    .description("list tasks")
    .option('--persona <string>')
    .action(personas_tasks);

list
    .command('scenarios')
    .description('list scenarios')
    .option('--task <string>')
    .action(task_scenarios);
export default list;
