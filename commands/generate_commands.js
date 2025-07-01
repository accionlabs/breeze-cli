import chalk from 'chalk';
import { Command } from 'commander';
import { confirm } from '@inquirer/prompts'
import * as fs from 'fs';
import path, { dirname } from 'path';
import { query } from '@anthropic-ai/claude-code';
import { fileURLToPath } from 'url';
import { v4 } from 'uuid';


const generate = new Command('generate').description('generate frontend and backend project code');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate_frontend_code(args) {
    try {
        //check claude.md file exists
        
        let claudepath = path.join(__dirname, "../CLAUDE.md")
        if (!fs.existsSync(claudepath)) {
            console.log(chalk.red('❌ CLAUDE.md file does not exist'));
            process.exit(0);
        }
        if (args.design) {
            let files = fs.readdirSync(path.join(args.design), { recursive: true });
            console.log(files);
            let jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
            if (jsonFiles.length == 0) {
                console.log(chalk.yellowBright('⚠️ No Json files are found.'));
                let confirmContinue = await confirm({ message: "Do you want to continue?" })
                if (!confirmContinue) {
                    console.log(chalk.red('Frontend code generation process exited'));
                    process.exit(0);
                }
            }
        }
        let designPathPrompt = args.design ? `Use any image files from provided ${args.design} folder as overall layout and styling references. Use any JSON files (e.g., 'header.json', 'main.json') as structured Figma exports to guide the generation of individual UI components.` : "";
        let outputpath = args.output || path.join(process.cwd(), "../output-" + v4());
        let outputPrompt = `${designPathPrompt}\nwrite the files to given absolute folder path ${outputpath}`;
        let modifiedPrompt = `${args.requirement}. ${outputPrompt}`
        console.log(chalk.greenBright(`${modifiedPrompt}`))
        let proceedWithClaudecode = await confirm({ message: "Do you want to continue to execute Claude code with above prompt?" })
        if (proceedWithClaudecode) {
            let messages = []
            for await (const message of query({
                prompt: modifiedPrompt,
                abortController: new AbortController(),
                options: {
                    allowedTools:["Read", "Write", "Bash","Edit","LS","TodoWrite","TodoRead"]
                },
            })) {
               messages.push(message)
            }
        }

        //process.exit(0);
    } catch (error) {
        console.log(error)
        console.log(chalk.red('❌ Error ::: ', error.message));
        process.exit(0);
    }
}

generate
    .command('frontend')
    .description("Generate frontend code")
    .requiredOption('--requirement <string>', "requirement or prompt")
    .option("--design <string>", "absolute path for design files to read about requirment")
    .option("--screen <string>", "name the screen")
    .option("--output <string>", "absolute path for generated output")
    .action(generate_frontend_code);
export default generate;