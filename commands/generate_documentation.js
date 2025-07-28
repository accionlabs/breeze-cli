import { query } from '@anthropic-ai/claude-code';
import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import ora from 'ora';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import {
  fetchConfiguration,
} from "../utils/common_utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // root of repo

// Load Claude prompt from file
async function loadPromptMarkdown() {
  const promptPath = path.join(projectRoot, 'claude_documentation.md');
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch (err) {
    console.error(chalk.red(`❌ Failed to load prompt file at ${promptPath}`));
    process.exit(1);
  }
}

async function generate_documentation(args) {
  let spin;
  const outputChunks = [];
  const rawPrompt = await loadPromptMarkdown();

  const breezeDir = path.join(projectRoot, '.breeze');
  const fileName = args.output || 'output.md';
  const outputPath = path.join(breezeDir, fileName);

  try {
    // Ensure .breeze directory exists
    await fs.mkdir(breezeDir, { recursive: true });

    const proceed = await confirm({
      message: 'Do you want to continue to execute Claude code with the loaded prompt?',
    });

    if (!proceed) return;

    spin = ora({ text: 'Generating documentation...', color: 'magenta' }).start();

    for await (const sdkmessage of query({
      prompt: rawPrompt,
      abortController: new AbortController(),
      options: {
        allowedTools: ['Read', 'Write', 'Bash', 'Edit', 'LS', 'TodoWrite', 'TodoRead'],
      },
    })) {
      if (
        sdkmessage.type === 'assistant' &&
        sdkmessage.message.content[0].type === 'text'
      ) {
        const text = sdkmessage.message.content[0].text;
        outputChunks.push(text);
        spin.stop();
        console.log(chalk.cyan(text));
        spin.start();
      }
    }

    spin.stop();

    const outputText = outputChunks.join('\n');

    await fs.writeFile(outputPath, outputText, 'utf-8');
    console.log(chalk.green(`\n✅ Documentation saved to ${outputPath}`));

    // Fetch project config
    const proj_data = await fetchConfiguration();

    console.log(chalk.yellow('\nℹ️  Project configuration:'), proj_data);

    // Call API to save in document collection
    // const apiUrl = 'https://your.api.endpoint/documents'; // Replace with your real endpoint
    // const response = await axios.post(apiUrl, {
    //   content: outputText,
    //   project: proj_data,
    // });

    // console.log(chalk.green(`✅ Uploaded to document collection. ID: ${response.data?.id || 'N/A'}`));


     // Read content from .breeze/output.md
    const breezeDir = path.join(projectRoot, '.breeze');
    const outputPath = path.join(breezeDir, 'output.md');
    let content = '';
    console.log('Reading from:', outputPath);
    try {
      content = await fs.readFile(outputPath, 'utf-8');
      console.log(content);
      const requestBody = {
        uuid: proj_data.project_key,
        content,
    };
    //  Call API to save in document collection
    const apiUrl = 'https://n8n.accionbreeze.com/webhook/document/store';
    const response = await axios.post(apiUrl, requestBody);
    console.log("reee", JSON.stringify(response.data, null, 2));
    
    console.log(chalk.green(`✅ Uploaded to document collection. ID: ${JSON.stringify(response.data, null, 2)}`));
    } catch (err) {
      console.error('Error reading file:', err.message);
    }

  } catch (error) {
    if (spin) spin.stop();
    const message = error?.response?.data?.message || error.message;
    console.log(chalk.red('❌ Error :::', message));
    process.exit(1);
  }
}

export default generate_documentation;
