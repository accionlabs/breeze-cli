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

export default async function generate_website_code(args) {
  // Implementation for generating website code
  let spin;
  try {
    // Check if only directory is provided (directory-only mode)
    const directory = args.directory;
    const websiteId = args.websiteId;
    if (!directory && !websiteId) {
      throw new Error("Either --directory or --websiteId must be provided.");
    }
    let proj_data = await fetchConfiguration();
    let semanticData = await getSemanticModel(proj_data);
    console.log("semanticData", semanticData);
    const websiteData = semanticData.design_specs?.websites?.find(
      (website) => website.id === websiteId
    );
    if(!websiteData?.screens?.length) {
      throw new Error("No screens found for the provided websiteId.");
    }
    const screensWithMockups = websiteData.screens.filter(
      (screen) => !!screen.mockupDocumentId
    );
    spin = ora().start();
    spin.color = "magenta";
    spin.prefixText = "Processing";
    spin.spinner = "simpleDots";
    let screensCount = 0
    const screenFolders = []
    for(const screenData of screensWithMockups) {
        console.log(chalk.blue(`\nProcessing screen: ${screenData.name}-- Count: ${++screensCount}/${screensWithMockups.length}`));
      spin.prefixText = `Downloading screen: ${screenData.name}`;
      const resourceDirectory = `${args.directory}/${screenData.name}`;
      const assetsDirectory = path.join(resourceDirectory, "assets");
      const outputTaskPath = path.join(resourceDirectory, `tasks.txt`);
      createDirectoryIfNotExists(resourceDirectory);
      createDirectoryIfNotExists(assetsDirectory);
      const { screenShotPath, htmlFilePath } = await handleMockup(screenData, resourceDirectory, proj_data);
      const resourceTypes = ["icon", "font"];
      await saveResource(
          { data: { resources: screenData.resources } },
          resourceDirectory,
          assetsDirectory,
          proj_data,
          resourceTypes
        );
        const nestedTasks = findNestedTasks(semanticData, screenData.tasks);
        fs.writeFileSync(
            outputTaskPath,
            JSON.stringify(nestedTasks, null, 2)
        );
        screenFolders.push(resourceDirectory);
    }
    spin.stop();
    const proceed = await confirm({
      message:
        `✅ Successfully downloaded ${screensCount} mockups and resources. Do you want to proceed with generating the website code?`,
    });
    if (!proceed) {
      console.log(chalk.red("❌ Generate process exited by user."));
      process.exit(0);
    }
    await runCluade(getPrompt("website", { screenFolders }), true);
  } catch (error) {
    if (spin) spin.stop();
    let message = error?.response?.data?.error
      ? error?.response?.data?.message
      : error.message;
    console.log(chalk.red("❌ Error ::: ", message));
    process.exit(0);
  }
}

const getSemanticModel = async (proj_data) => {
  let httpArgs = {
    url: `${config.ISOMETRIC_API_URL}/semantic-model/byUUID/${proj_data.project_key}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "api-key": `${proj_data.api_key}`,
    }
  };
  let response;
  try {
    response = await httpRequests(httpArgs);
    return response.data;
  } catch (error) {
    console.log(chalk.red('❌ Error while fetching semantic model ::: '));
    throw error;
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

function saveMockupHTML(html, resourceDirectory, name) {
  const outputPath = path.join(resourceDirectory, `${name}.html`);
  fs.writeFileSync(outputPath, html);
  return outputPath;
}

async function handleMockup(screenData, resourceDirectory, proj_data) {
  const mockupDocumentId = screenData?.mockupDocumentId;
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
  if (!Array.isArray(screenData?.tasks) || screenData.tasks.length === 0) {
    console.log(chalk.yellow("⚠️ Warning: No tasks found."));
  }
  const screenShotPath = await saveMockupScreenShot(mockupFileurl, resourceDirectory, proj_data);
  const htmlFilePath = saveMockupHTML(mockupHTML, resourceDirectory, mockupName);
  return { screenShotPath, htmlFilePath };
}

const findNestedTasks = (semanticData, tasks) => {
    const nestedTasks = [];
    for (const task of tasks) {
        for(let persona of semanticData?.qum_specs.unified_model || []){
            for(let personaOutcome of persona?.outcomes || []){
                if (personaOutcome.outcome === task) {
                    nestedTasks.push({
                        ...personaOutcome
                    });
                }
            }
        }
    }
    return nestedTasks;
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
