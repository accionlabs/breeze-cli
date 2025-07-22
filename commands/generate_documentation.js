import { query } from '@anthropic-ai/claude-code';
import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import ora from 'ora';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utility to read the prompt from markdown file
async function loadPromptMarkdown() {
  const promptPath = path.join(__dirname, '../claude_documentation.md');
  console.log('Prompt Path:', promptPath);

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

  // Ask for output path if not passed via CLI
  let outputPath = args.output;
  if (!outputPath) {
    outputPath = await input({
      message: 'Enter output file path (e.g., ./docs/output.md):',
      default: './output.md',
    });
  }
  outputPath = path.resolve(outputPath);

  try {
    const proceed = await confirm({
      message:
        'Do you want to continue to execute Claude code with the loaded prompt?',
    });

    if (!proceed) return;

    // Start spinner
    spin = ora({ text: 'Processing...', color: 'magenta' }).start();

    for await (const sdkmessage of query({
      prompt: rawPrompt,
      abortController: new AbortController(),
      options: {
        allowedTools: [
          'Read',
          'Write',
          'Bash',
          'Edit',
          'LS',
          'TodoWrite',
          'TodoRead',
        ],
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

    // Ensure the output directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    // Write to file
    await fs.writeFile(outputPath, outputText, 'utf-8');
    console.log(chalk.green(`\n✅ Documentation saved to ${outputPath}`));
  } catch (error) {
    if (spin) spin.stop();
    const message = error?.response?.data?.message || error.message;
    console.log(chalk.red('❌ Error :::', message));
    process.exit(1);
  }
}

export default generate_documentation;
