import { query } from '@anthropic-ai/claude-code';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import ora from 'ora';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import axios from 'axios';
import { fetchConfiguration } from "../utils/common_utils.js";
import { log } from '@clack/prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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
  log.info(chalk.cyan('📄 Generating documentation using Claude AI...'));

  // Initialize breezeDir in home directory
  const breezeDir = path.join(homedir(), '.breeze');
  console.log(chalk.cyan(`Using .breeze directory at: ${breezeDir}`));
  
  // Ensure .breeze directory exists in home directory
  try {
    await fs.mkdir(breezeDir, { recursive: true });
  } catch (err) {
    console.error(chalk.red(`❌ Failed to create .breeze directory: ${err.message}`));
    process.exit(1);
  }

  const fileName = args.output || 'output.md';
  const outputPath = path.join(breezeDir, fileName);


  try {
  //=//for testing commenting line to push content in doc collection

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

    //---//
    // Fetch project config
    const proj_data = await fetchConfiguration();
    console.log(chalk.yellow('\nℹ️  Project configuration:'), proj_data);

    // Read content from generated documentation
    let content = '';
    try {
      content = await fs.readFile(outputPath, 'utf-8');
    } catch (err) {
      console.error(chalk.red(`❌ Could not read documentation file at ${outputPath}`));
      throw err;
    }

    // Get git repository information

    let repoUrl = '';
    let repoName = '';

    try {
      // Dynamically import child_process for ES module compatibility
      const { execSync } = await import('child_process');
      // Get git remote URL
      repoUrl = execSync('git config --get remote.origin.url', { 
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();

      // Get repository name from the current directory
      repoName = path.basename(process.cwd());

      console.log(chalk.cyan(`\n📦 Repository URL: ${repoUrl}`));

    } catch (err) {
      console.warn(chalk.yellow('⚠️  Not a git repository or git not installed'));
      repoUrl = '';
      repoName = path.basename(process.cwd());
    }

    
    const fileMetaData = {
      name: repoName || "project_documentation",
      type: 'git',
      mimeType: 'application/text',
      git_url: repoUrl || proj_data.repository_url || '',
    };

    const requestBody = {
      // uuid: proj_data.project_key || "d1c28f53-b591-4cf5-b908-afa6ed71fa81",
      uuid: "175584c4-e3b4-4bff-a475-0e3791ed1779",
      content,
      fileMetaData,
    };

    console.log(chalk.cyan('📤 Uploading documentation to the document collection...', requestBody));
    
    const apiUrl = 'https://n8n.accionbreeze.com/webhook/document/store';
    const response = await axios.post(apiUrl, requestBody);

    // const response = await axios.post(apiUrl, requestBody, { headers });

    console.log(chalk.green(`✅ Uploaded to document collection. Response:`, JSON.stringify(response.data, null, 2)));

  } catch (error) {
    if (spin) spin.stop();
    const message = error?.response?.data?.message || error.message;
    console.log(chalk.red('❌ Error :::', message));
    process.exit(1);
  }
}

export default generate_documentation;