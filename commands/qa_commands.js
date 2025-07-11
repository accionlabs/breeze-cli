import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import { spawn } from "child_process";
import { Command } from "commander";
import * as fs from 'fs';
import ora from "ora";
import { homedir } from "os";
import path from "path";
import { killChildProcess } from "../utils/common_utils.js";

const qa = new Command('qa').description('Quality Analysis Automation tool')

async function config_qa() {
    try {
        if (!fs.existsSync(path.join(homedir(), '.breeze'))) {
            fs.mkdirSync(path.join(homedir(), '.breeze'));
        }
        let qa_config_exists = fs.existsSync(path.join(homedir(), '.breeze/.config-qa'))
        console.log(chalk.cyan('🛠️ Please configure your QA settings'));
        const LLM_MODEL_PROVIDER = await input({
            message: 'Enter llm platform provider',
            placeholder: 'gemini',
            validate: (value) => {
                if (value.length === 0) return "Llm plaftform provide is required";
                return true;
            },
        });
        const LLM_MODEL = await input({
            message: 'Enter your llm model',
            validate: (value) => {
                if (value.length === 0) return "llm model is required";
                return true;
            },
        });
        const GOOGLE_API_KEY = await input({
            message: 'Enter Gemini API Key',
            placeholder: 'gemini api key',
            validate: (value) => {
                if (value.length === 0) return "Gemini API key is required";
                return true;
            },
        });
        const TESTCASES_GIT_PLATFORM = await input({
            message: 'Git Repo platform',
            placeholder: 'github',
            validate: (value) => {
                if (value.length === 0) return "Git repo provider is required";
                return true;
            },
        });
        const TESTCASES_REPO_OWNER = await input({
            message: 'git username',
            placeholder: 'username',
            validate: (value) => {
                if (value.length === 0) return "Git Username is required";
                return true;
            },
        });
        const TESTCASES_REPO_GIT_TOKEN = await input({
            message: 'Enter git repo token',
            placeholder: 'git token',
            validate: (value) => {
                if (value.length === 0) return "Git repo token is required";
                return true;
            },
        });
        const TESTCASES_REPO_NAME = await input({
            message: 'Git Repo name',
            placeholder: 'test cases git repo name',
            validate: (value) => {
                if (value.length === 0) return "Test cases git repo name is required";
                return true;
            },
        });
        const PLAYWRIGHT_GIT_PLATFORM = await input({
            message: 'playwright Git Repo Provider',
            placeholder: 'github',
            validate: (value) => {
                if (value.length === 0) return "playwright Git repo provider is required";
                return true;
            },
        });
        const PLAYWRIGHT_REPO_OWNER = await input({
            message: 'playwright Git Repo username',
            placeholder: 'playwright git repo username',
            validate: (value) => {
                if (value.length === 0) return "playwright git repo username is required";
                return true;
            },
        });
        const PLAYWRIGHT_REPO_GIT_TOKEN = await input({
            message: 'Enter playwright git repo token',
            placeholder: 'git token',
            validate: (value) => {
                if (value.length === 0) return "playwright git repo token is required";
                return true;
            },
        });
        const PLAYWRIGHT_REPO_NAME = await input({
            message: 'playwright Git Repo name',
            placeholder: 'git repo name',
            validate: (value) => {
                if (value.length === 0) return "playwright Git repo name is required";
                return true;
            },
        });

        const PLAYWRIGHT_REPO_BRANCH_NAME = "main";
        const PLAYWRIGHT_OUTPUT_DIR = path.join(homedir(), 'qa_output');
        const PLAYWRIGHT_BRANCH_TO_PUSH = await input({
            message: 'enter the target branch',
            placeholder: 'target branch',
            validate: (value) => {
                if (value.length === 0) return "Target branch to push playwright scripts is required";
                return true;
            },
        });
        const spin = ora().start()
        spin.color = "yellow"
        spin.spinner = "circleHalves";
        spin.text = "Please wait while saving the configuration"
        //write configuration to a config file
        let data = {
            LLM_MODEL_PROVIDER,
            LLM_MODEL,
            GOOGLE_API_KEY,
            TESTCASES_GIT_PLATFORM,
            TESTCASES_REPO_GIT_TOKEN,
            TESTCASES_REPO_NAME,
            TESTCASES_REPO_OWNER,
            PLAYWRIGHT_BRANCH_TO_PUSH,
            PLAYWRIGHT_GIT_PLATFORM,
            PLAYWRIGHT_OUTPUT_DIR,
            PLAYWRIGHT_REPO_BRANCH_NAME,
            PLAYWRIGHT_REPO_GIT_TOKEN,
            PLAYWRIGHT_REPO_NAME,
            PLAYWRIGHT_REPO_OWNER
        }
        if (!fs.existsSync(path.join(homedir(), ".breeze"))) {
            fs.mkdirSync(path.join(homedir(), ".breeze"))
        }
        fs.writeFileSync(path.join(homedir(), '.breeze/.config-qa'), JSON.stringify(data))

        spin.stop();
        console.log(chalk.green('QA Automation Configuration completed'))

    } catch (error) {
        console.log(chalk.red('❌ Error::: ', error.message))
        process.exit(0)
    }
}

async function execute_test_cases() {
    let runShellScript;
    try {
        //setting env 
        const spin = ora().start()
        spin.color = "yellow"
        spin.spinner = "simpleDots";
        spin.prefixText = "Please wait, we are setting up your envrionment"

        console.log(chalk.cyan('Prerequisites: pip,python should be installed. python3.12-venv should be installed on your machine'))
        spin.stop();
        const proceedToExecuteTestCases = await confirm({
            message: "Ensure Prerequisites are met. Do you want to proceed?"
        })

        if (proceedToExecuteTestCases) {
            let scriptFilePath = path.join(path.resolve('./executables'), 'qa.sh');
            let rootPath = path.resolve('.');
            console.log(rootPath)
            console.log("scriptFilePath", scriptFilePath)
            runShellScript = spawn('sh', [scriptFilePath], {
                stdio: 'inherit', // This will pipe output directly to your terminal
                env: {
                    ...process.env,
                    ROOT_PATH: rootPath
                }
            });
            runShellScript.on('message', function (message) {
                console.log(">>>", Date.now(), message);
            })
            runShellScript.on('close', function (code) {
                console.log(`process exited with code ${code}`);
                killChildProcess(runShellScript)
                process.exit(0)
            })
            runShellScript.on('exit', function (code) {
                console.log(`process exited with code ${code}`);
            })
        }
    } catch (error) {
        console.log(chalk.red('❌ Error::: ', error.message))
        killChildProcess(runShellScript)
        process.exit(0)
    }
}

qa.command('config')
    .description('Configure the settings for QA Automation')
    .action(config_qa)

qa.command('generate')
    .description('Generate test scripts')
    .action(execute_test_cases)

export default qa;