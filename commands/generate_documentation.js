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
import { execSync } from 'child_process';

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
  let tempDir = null;
  let originalWorkingDir = null;
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

  // Handle git URL cloning if provided
  if (args.gitUrl) {
    try {
      console.log(chalk.cyan(`🔄 Cloning repository from: ${args.gitUrl}`));

      // Create temporary directory
      tempDir = await fs.mkdtemp(path.join(breezeDir, 'temp-git-repo-'));
      console.log(chalk.cyan(`📁 Created temp directory: ${tempDir}`));

      // Store original working directory
      originalWorkingDir = process.cwd();

      // Clone the repository
      execSync(`git clone "${args.gitUrl}" "${tempDir}"`, { stdio: 'inherit' });

      // Change to the cloned directory
      process.chdir(tempDir);
      console.log(chalk.green(`✅ Successfully cloned and switched to: ${tempDir}`));

    } catch (err) {
      console.error(chalk.red(`❌ Failed to clone repository: ${err.message}`));
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.warn(chalk.yellow(`⚠️  Failed to cleanup temp directory: ${cleanupErr.message}`));
        }
      }
      process.exit(1);
    }
  }




  try {
    //= for testing commenting line to push content in doc collection//

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
      uuid: proj_data.project_key,
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
  } finally {
    // Cleanup: restore original working directory and remove temp directory
    if (args.gitUrl && originalWorkingDir && tempDir) {
      try {
        console.log(chalk.cyan('🧹 Cleaning up temporary files...'));

        // Restore original working directory
        process.chdir(originalWorkingDir);
        console.log(chalk.cyan(`📁 Restored working directory to: ${originalWorkingDir}`));

        // Remove temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(chalk.green(`✅ Cleaned up temp directory: ${tempDir}`));

      } catch (cleanupErr) {
        console.warn(chalk.yellow(`⚠️  Warning: Failed to cleanup temp directory: ${cleanupErr.message}`));
      }
    }
  }
}

export default generate_documentation;