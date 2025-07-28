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
  fetchConfiguration,
  httpRequests,
  saveResource,
  validateFileExists,
} from "../utils/common_utils.js";
import config from "../config.js";
import { getPrompt } from "../prompts/index.js";
import generate_documentation from './generate_documentation.js';

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
    return ["screenshot", "html", "icon", "font"];
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
  try {
    // Check CLAUDE.md file exists
    let claudeFileValidation = await validateFileExists("CLAUDE.md");
    if (!claudeFileValidation) process.exit(0);

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

    const flags = getScreenResourceFlags(response);
    const resourceTypes = validateFromType(args, flags, response);

    // Only create directories after validation
    const resourceDirectory = `${args.directory}/${flags.name}`;
    const assetsDirectory = path.join(resourceDirectory, "assets");

    let resourcePath = {};
    let outputTaskPath = path.join(resourceDirectory, `tasks.txt`);
    let placeholders;

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

    const customUserInput = await input({
        message: "Provide any additional instructions or context for code generation (optional):",
    });

    const prompt = getPrompt("figma", { ...placeholders, customInstruction: customUserInput });

    // Ask user if they want to proceed
    const proceed = await confirm({
      message:
        "Do you want to proceed? Note: It will generate better result if you provide all the required files and tasks.",
    });
    if (!proceed) {
      console.log(chalk.red("❌ Generate process exited by user."));
      process.exit(0);
    }

    console.log(chalk.greenBright(`${prompt}`));
    let proceedWithClaudecode = await confirm({
      message:
        "Do you want to continue to execute Claude code with above prompt?",
    });
    if (proceedWithClaudecode) {
      spin = ora().start();
      spin.color = "magenta";
      spin.prefixText = "Processing";
      spin.spinner = "simpleDots";
      for await (const sdkmessage of query({
        prompt: prompt,
        abortController: new AbortController(),
        options: {
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
          sdkmessage.type == "assistant" &&
          sdkmessage.message.content[0].type == "text"
        ) {
          spin.stop();
          console.log(marked(sdkmessage.message.content[0].text));
          spin.start();
        }
      }
      spin.stop();
    }

    process.exit(0);
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
  const signedUrlAPI = `${
    config.ISOMETRIC_API_URL
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

generate
  .command("frontend")
  .description("Generate frontend code")
  // .option("--requirement <string>", "user requirement")
  .option("--directory <string>", "Absolute path for claude to load files")
  .option("--screenId <string>", "Screen Id")
  .option("--websiteId <string>", "Website Id")
  .option(
    "--from <string>",
    "Source type: figma | html | mockup",
    /^(figma|html|mockup)$/i
  )
  .action(generate_frontend_code);

generate
  .command('document')
  .description('Generate documentation')
  .option('-o, --output <path>', 'Output file path')
  .action(generate_documentation);

export default generate;
