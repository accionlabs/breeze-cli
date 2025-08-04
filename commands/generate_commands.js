import chalk from "chalk";
import { Command } from "commander";
import { confirm, input } from "@inquirer/prompts";
import * as fs from "fs";
import path, { dirname } from "path";
import { query } from "@anthropic-ai/claude-code";
import { fileURLToPath } from "url";
import ora from "ora";
import { marked } from "marked"; // <-- add this
import TerminalRenderer from "marked-terminal";
marked.setOptions({
  renderer: new TerminalRenderer(),
});
import {
  downloadFile,
  fetchConfiguration,
  httpRequests,
  saveResource,
  validateFileExists,
} from "../utils/common_utils.js";
import config from "../config.js";
import { getPrompt } from "../prompts/index.js";
import generate_documentation from './generate_documentation.js';
import axios from "axios";

const generate = new Command("generate").description(
  "generate frontend and backend project code"
);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getScreenResourceFlags(response) {
  const resources = response.data?.resources || [];
  return {
    hasImage: resources.some((r) => r.type === "screenshot"),
    hasLayout: resources.some((r) => r.type === "layout_json"),
    hasHTML: resources.some((r) => r.type === "html"),
    hasCSS: resources.some((r) => r.type === "css"),
    hasTasks: Array.isArray(response.data?.tasks) && response.data.tasks.length > 0,
    mockupDocumentId: response.data?.mockupDocumentId,
    resources,
    tasks: response.data?.tasks || [],
    name: response.data?.name,
  };
}

function validateFromType(args, flags, response) {
  if (args.from === "figma") {
    if (!flags.hasLayout || !flags.hasImage) {
      console.log(chalk.red("❌ Error: For --from figma, both layout and screenshot are required."));
      process.exit(1);
    }
    if (!flags.hasTasks) {
      console.log(chalk.yellow("⚠️ Warning: No tasks found."));
    }
    return ["screenshot", "layout_json", "icon", "font"];
  }
  if (args.from === "html") {
    if (!flags.hasHTML) {
      console.log(chalk.red("❌ Error: code generation from HTML, HTML resource is required."));
      process.exit(1);
    }
    if (!flags.hasTasks) {
      console.log(chalk.yellow("⚠️ Warning: No tasks found."));
    }
    return ["screenshot", "html", "icon", "font", "css", "js", "png", "jpeg", "jpg"];
  }
  if (args.from === "mockup") {
    if (!flags.mockupDocumentId) {
      console.log(chalk.red("❌ Error: For code generation from mockup, mockup is required. It can be generated in Breeze"));
      process.exit(1);
    }
    return ["icon", "font"];
  }
  return [];
}

async function handleMockup(response, args, proj_data) {
  const mockupDocumentId = response.data?.mockupDocumentId;
  const mockupDocumentUrl = `${config.ISOMETRIC_API_URL}/documents/${mockupDocumentId}`;
  const mockupResponse = await axios.get(mockupDocumentUrl, {
    headers: {
      "Content-Type": "application/json",
      "api-key": `${proj_data.api_key}`,
    },
  });
  const mockupFileurl = mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.fileUrl;
  const mockupHTML = mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.html;
  const mockupName = mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.fileName;
  const mockupHasScreenshot = !!mockupFileurl;
  const mockupHasHTML = !!mockupHTML;
  if (!mockupHasScreenshot || !mockupHasHTML) {
    console.log(chalk.red("❌ Error: For --from mockup, both screenshot and HTML are required in the mockup document."));
    process.exit(1);
  }
  if (!Array.isArray(response.data?.tasks) || response.data.tasks.length === 0) {
    console.log(chalk.yellow("⚠️ Warning: No tasks found."));
  }
  const screenShotPath = await saveMockupScreenShot(mockupFileurl, args.directory, proj_data);
  const htmlFilePath = saveMockupHTML(mockupHTML, args.directory, mockupName);
  return { screenShotPath, htmlFilePath };
}

async function generate_frontend_code(args) {
  let spin;
  let prompt_type = "figma"
  try {
    // Check CLAUDE.md file exists
    let claudeFileValidation = await validateFileExists("CLAUDE.md");
    if (!claudeFileValidation) process.exit(0);

    // Check if only directory is provided (directory-only mode)
    const isDirectoryOnlyMode = args.directory && !args.screenId && !args.websiteId;

    let flags, resourceTypes, resourceDirectory, assetsDirectory;
    let resourcePath = {};
    let outputTaskPath;
    let placeholders;

    if (isDirectoryOnlyMode) {
      // Directory-only mode: read existing resources from directory
      console.log(chalk.blue("📁 Directory-only mode: Reading resources from", args.directory));

      const directoryResources = await readDirectoryResources(args.directory);

      // Validate that we have minimum required resources
      if (!directoryResources.hasImage && !directoryResources.hasHTML) {
        console.log(chalk.red("❌ Error: Directory must contain at least one screenshot or HTML file."));
        process.exit(1);
      }

      resourceDirectory = args.directory;
      assetsDirectory = directoryResources.assetsFolder || path.join(resourceDirectory, "assets");

      // Build placeholders from directory contents
      placeholders = {};

      if (directoryResources.screenshots.length > 0) {
        placeholders.screenshotFilePath = JSON.stringify(directoryResources.screenshots);
      }

      if (directoryResources.layouts.length > 0) {
        placeholders.layoutJSONFilePath = JSON.stringify(directoryResources.layouts);
      }

      if (directoryResources.htmlFiles.length > 0) {
        placeholders.htmlFilePath = JSON.stringify(directoryResources.htmlFiles);
      }

      if (directoryResources.taskFiles.length > 0) {
        placeholders.taskFilePath = JSON.stringify(directoryResources.taskFiles);
      }

      placeholders.assetFolder = JSON.stringify(assetsDirectory);

      console.log(chalk.green("✅ Found resources:"));
      if (directoryResources.screenshots.length > 0) {
        console.log(chalk.cyan(`  📸 Screenshots: ${directoryResources.screenshots.length} files`));
      }
      if (directoryResources.layouts.length > 0) {
        console.log(chalk.cyan(`  📋 Layout JSONs: ${directoryResources.layouts.length} files`));
      }
      if (directoryResources.htmlFiles.length > 0) {
        console.log(chalk.cyan(`  🌐 HTML files: ${directoryResources.htmlFiles.length} files`));
      }
      if (directoryResources.taskFiles.length > 0) {
        console.log(chalk.cyan(`  📝 Task files: ${directoryResources.taskFiles.length} files`));
      }
      if (!directoryResources.hasLayout && directoryResources.hasHTML && directoryResources.hasCSS) {
        prompt_type = "html"
      }
    } else {
      // Original API-based mode
      let proj_data = await fetchConfiguration();
      let httpArgs = {
        url: `${config.ISOMETRIC_API_URL}/semantic-model/get-screen`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "api-key": `${proj_data.api_key}`,
        },
        params: {
          projectuuid: `${proj_data.project_key}`,
          websiteId: `${args.websiteId}`,
          screenId: `${args.screenId}`,
        },
      };
      let response
      try {
        response = await httpRequests(httpArgs);
      } catch (error) {
        console.log(chalk.red('❌ Error while fetching screen data ::: '));
        throw error;
      }

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      flags = getScreenResourceFlags(response);
      resourceTypes = validateFromType(args, flags, response);

      // Only create directories after validation
      resourceDirectory = `${args.directory}/${flags.name}`;
      assetsDirectory = path.join(resourceDirectory, "assets");
      outputTaskPath = path.join(resourceDirectory, `tasks.txt`);

      if (args.from === "figma" || args.from === "html") {
        createDirectoryIfNotExists(resourceDirectory);
        createDirectoryIfNotExists(assetsDirectory);
        resourcePath = await saveResource(
          response,
          resourceDirectory,
          assetsDirectory,
          proj_data,
          resourceTypes
        );
        fs.writeFileSync(
          outputTaskPath,
          JSON.stringify(flags.tasks, null, 2)
        );
        if (args.from === "figma") {
          placeholders = {
            screenshotFilePath: JSON.stringify(resourcePath["screenshot"]),
            layoutJSONFilePath: JSON.stringify(resourcePath["layout_json"]),
            taskFilePath: JSON.stringify([outputTaskPath]),
            assetFolder: JSON.stringify(assetsDirectory),
          }

        } else {
          placeholders = {
            screenshotFilePath: JSON.stringify(resourcePath["screenshot"]),
            htmlFilePath: JSON.stringify(resourcePath["html"]),
            taskFilePath: JSON.stringify([outputTaskPath]),
            assetFolder: JSON.stringify(assetsDirectory),
          }
        }
      } else if (args.from === "mockup") {
        const { screenShotPath, htmlFilePath } = await handleMockup(response, args, proj_data);
        createDirectoryIfNotExists(resourceDirectory);
        createDirectoryIfNotExists(assetsDirectory);
        await saveResource(
          response,
          resourceDirectory,
          assetsDirectory,
          proj_data,
          resourceTypes
        );
        fs.writeFileSync(
          outputTaskPath,
          JSON.stringify(flags.tasks, null, 2)
        );
        placeholders = {
          screenshotFilePath: JSON.stringify([screenShotPath]),
          htmlFilePath: JSON.stringify([htmlFilePath]),
          taskFilePath: JSON.stringify([outputTaskPath]),
          assetFolder: JSON.stringify(assetsDirectory),
        }
      }
    }
    if (placeholders.htmlFilePath?.length > 1) {
      prompt_type = "html"
    }
    const customUserInput = await input({
      message: "Provide any additional instructions or context for code generation (optional):",
    });

    const prompt = getPrompt(prompt_type, { ...placeholders, customInstruction: customUserInput });


    // Ask user if they want to proceed
    const proceed = await confirm({
      message:
        "Do you want to proceed? Note: It will generate better result if you provide all the required files and tasks.",
    });
    if (!proceed) {
      console.log(chalk.red("❌ Generate process exited by user."));
      process.exit(0);
    }
    await runCluade(prompt)
    while (1) {
      const customUserInput = await input({
        message: "Provide Input!",
      });
      if (customUserInput) {
        await runCluade(customUserInput, true)
      }
    }

  } catch (error) {
    if (spin) spin.stop();
    console.log(error);
    let message = error?.response?.data?.error
      ? error?.response?.data?.message
      : error.message;
    console.log(chalk.red("❌ Error ::: ", message));
    process.exit(0);
  }
}


async function runCluade(prompt, continueClaude = false) {
  let spin;
  try {
    spin = ora().start();
    spin.color = "magenta";
    spin.prefixText = "Processing";
    spin.spinner = "simpleDots";
    for await (const sdkmessage of query({
      prompt: prompt,
      abortController: new AbortController(),
      options: {
        continue: continueClaude,
        allowedTools: [
          "Read",
          "Write",
          "Bash",
          "Edit",
          "LS",
          "TodoWrite",
          "TodoRead",
        ],
      },
    })) {
      if (
        sdkmessage?.message?.content?.[0]?.type == "text"
      ) {
        spin.stop();
        console.log(marked(sdkmessage.message.content[0].text));
        spin.start();
      }
    }
    spin.stop();
  } catch (error) {
    if (spin) spin.stop();
    console.log(error);
    let message = error?.response?.data?.error
      ? error?.response?.data?.message
      : error.message;
    console.log(chalk.red("❌ Error ::: ", message));
    process.exit(0);
  }

}

async function createDirectoryIfNotExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function saveMockupScreenShot(fileUrl, resourceDirectory, proj_data) {
  const filekey = `${fileUrl.split("amazonaws.com")?.[1]?.replace(/^\/+/, "")}`;
  const signedUrlAPI = `${config.ISOMETRIC_API_URL
    }/documents/get-signed-url/${encodeURIComponent(filekey)}`;
  const signedUrlResponse = await axios.get(signedUrlAPI, {
    headers: {
      "Content-Type": "application/json",
      "api-key": `${proj_data.api_key}`,
    },
  });
  const outputPath = path.join(resourceDirectory, filekey.split("/").pop());
  await downloadFile(signedUrlResponse.data, outputPath);
  return outputPath;
}

async function saveMockupHTML(html, resourceDirectory, name) {
  const outputPath = path.join(resourceDirectory, `${name}.html`);
  fs.writeFileSync(outputPath, html);
  return outputPath;
}

async function readDirectoryResources(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory ${directory} does not exist`);
  }

  const files = fs.readdirSync(directory, { withFileTypes: true });
  const resources = {
    screenshots: [],
    layouts: [],
    htmlFiles: [],
    cssFiles: [],
    taskFiles: [],
    assetsFolder: null,
    hasImage: false,
    hasLayout: false,
    hasHTML: false,
    hasCSS: false,
    hasTasks: false
  };

  // Check for assets directory
  const assetsDir = path.join(directory, 'assets');
  if (fs.existsSync(assetsDir)) {
    resources.assetsFolder = assetsDir;
  }

  files.forEach(file => {
    const filePath = path.join(directory, file.name);
    const ext = path.extname(file.name).toLowerCase();

    if (file.isFile()) {
      // Screenshots (images)
      if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext)) {
        resources.screenshots.push(filePath);
        resources.hasImage = true;
      }
      // Layout JSON files
      else if (ext === '.json' && (file.name.includes('layout') || file.name.includes('json'))) {
        resources.layouts.push(filePath);
        resources.hasLayout = true;
      }
      // HTML files
      else if (ext === '.html' || ext === '.js') {
        resources.htmlFiles.push(filePath);
        resources.hasHTML = true;
      }
      // CSS files
      else if (ext === '.css') {
        resources.cssFiles.push(filePath);
        resources.hasCSS = true;
      }
      // Task files
      else if (file.name.includes('task') && (ext === '.txt' || ext === '.json')) {
        resources.taskFiles.push(filePath);
        resources.hasTasks = true;
      }
    }
  });

  return resources;
}

generate
  .command("frontend")
  .description("Generate frontend code from API (screenId + websiteId) or from directory resources")
  // .option("--requirement <string>", "user requirement")
  .option("--directory <string>", "Absolute path for claude to load files. If only directory is provided (no screenId/websiteId), will read existing resources from directory")
  .option("--screenId <string>", "Screen Id (optional if using directory-only mode)")
  .option("--websiteId <string>", "Website Id (optional if using directory-only mode)")
  .option(
    "--from <string>",
    "Source type: figma | html | mockup (not required for directory-only mode)",
    /^(figma|html|mockup)$/i
  )
  .action(generate_frontend_code);

generate
  .command('document')
  .description('Generate documentation')
  .option('-o, --output <path>', 'Output file path')
  .option('--git-url <url>', 'Git repository URL to clone into temp folder')
  .action(generate_documentation);

export default generate;
