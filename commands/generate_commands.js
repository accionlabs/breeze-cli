import chalk from "chalk";
import { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import * as fs from "fs";
import path, { dirname } from "path";
import { query } from "@anthropic-ai/claude-code";
import { fileURLToPath } from "url";
import ora from "ora";
import {
  fetchConfiguration,
  httpRequests,
  saveResource,
  validateFileExists,
} from "../utils/common_utils.js";
import config from "../config.js";
import { get } from "http";
import { getPrompt } from "../prompts/index.js";

const generate = new Command("generate").description(
  "generate frontend and backend project code"
);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate_frontend_code(args) {
  let spin;
  try {
    //check claude.md file exists
    let claudeFileValidation = await validateFileExists("CLAUDE.md");
    if (!claudeFileValidation) process.exit(0);
    let proj_data = await fetchConfiguration();
    let prompt;
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
    const response = await httpRequests(httpArgs);
    if (response.data.error) {
      throw new Error(response.data.message);
    }
    const resources = response.data?.resources || [];
    const tasks = response.data?.tasks || [];
    const hasImage = resources.some((r) => r.type === "screenshot");
    const hasLayout = resources.some((r) => r.type === "layout_json");
    const hasTasks = Array.isArray(tasks) && tasks.length > 0;
    const hasHTML = resources.some((r) => r.type === "html");
    const mockupDocumentId = response.data?.mockupDocumentId;
    const resourceDirectory = `${args.directory}/${response.data?.name}`;
    // --- Validation logic based on --from ---
    if (args.from === "figma") {
      if (!hasLayout || !hasImage) {
        console.log(
          chalk.red(
            "❌ Error: For --from figma, both layout and screenshot are required."
          )
        );
        process.exit(1);
      }
      if (!hasTasks) {
        console.log(chalk.yellow("⚠️ Warning: No tasks found."));
      }
      createDirectoryIfNotExists(resourceDirectory);
      const assetsDirectory = path.join(resourceDirectory, "assets");
      createDirectoryIfNotExists(assetsDirectory);
      const resourcePath = await saveResource(
        response,
        resourceDirectory,
        assetsDirectory,
        proj_data,
        ["screenshot", "layout_json", "icon", "font"]
      );
      const outputTaskPath = path.join(resourceDirectory, `tasks.txt`);
      fs.writeFileSync(
        outputTaskPath,
        JSON.stringify(response.data?.tasks, null, 2)
      );
      prompt = getPrompt("figma", {
        screenshotFilePath: JSON.stringify(resourcePath["screenshot"]),
        layoutJSONFilePath: JSON.stringify(resourcePath["layout_json"]),
        taskFilePath: JSON.stringify([outputTaskPath]),
        assetFolder: JSON.stringify(assetsDirectory),
        // customInstruction: response.data?.metadata?.customInstruction || ""
      });
    } else if (args.from === "html") {
      if (!hasHTML) {
        console.log(
          chalk.red("❌ Error: For --from html, HTML resource is required.")
        );
        process.exit(1);
      }
      if (!hasTasks) {
        console.log(chalk.yellow("⚠️ Warning: No tasks found."));
      }
      createDirectoryIfNotExists(resourceDirectory);
      const assetsDirectory = path.join(resourceDirectory, "assets");
      createDirectoryIfNotExists(assetsDirectory);
      const resourcePath = await saveResource(
        response,
        resourceDirectory,
        assetsDirectory,
        proj_data,
        ["screenshot", "html", "icon", "font"]
      );
      const outputTaskPath = path.join(resourceDirectory, `tasks.txt`);
      fs.writeFileSync(
        outputTaskPath,
        JSON.stringify(response.data?.tasks, null, 2)
      );
      prompt = getPrompt("html", {
        screenshotFilePath: JSON.stringify(resourcePath["screenshot"]),
        htmlFilePath: JSON.stringify(resourcePath["html"]),
        taskFilePath: JSON.stringify([outputTaskPath]),
        assetFolder: JSON.stringify(assetsDirectory),
        // customInstruction: response.data?.metadata?.customInstruction || ""
      });
    } else if (args.from === "mockup") {
      if (!mockupDocumentId) {
        console.log(
          chalk.red(
            "❌ Error: For --from mockup, mockupDocumentId is required."
          )
        );
        process.exit(1);
      }
       // Fetch mockup details
      const mockupDocumentUrl = `${config.ISOMETRIC_API_URL}/documents/${mockupDocumentId}`;
      const mockupResponse = await axios.get(mockupDocumentUrl, {
        headers: {
          "Content-Type": "application/json",
          "api-key": `${proj_data.api_key}`,
        },
      });
      const mockupFileurl =
        mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.fileUrl;
      const mockupHTML =
        mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.html;
      const mockupName =
        mockupResponse.data?.data?.metadata?.htmlContent?.[0]?.fileName;
      const mockupHasScreenshot = !!mockupFileurl;
      const mockupHasHTML = !!mockupHTML;
      if (!mockupHasScreenshot || !mockupHasHTML) {
        console.log(
          chalk.red(
            "❌ Error: For --from mockup, both screenshot and HTML are required in the mockup document."
          )
        );
        process.exit(1);
      }
      if (!hasTasks) {
        console.log(chalk.yellow("⚠️ Warning: No tasks found."));
      }
      // Save mockup screenshot and HTML
      const screenShotPath = await saveMockupScreenShot(mockupFileurl, args.directory, proj_data);
      const htmlFilePath = saveMockupHTML(mockupHTML, args.directory, mockupName);
      createDirectoryIfNotExists(resourceDirectory);
      const assetsDirectory = path.join(resourceDirectory, "assets");
      createDirectoryIfNotExists(assetsDirectory);
      await saveResource(
        response,
        resourceDirectory,
        assetsDirectory,
        proj_data,
        ["icon", "font"]
      );
      const outputTaskPath = path.join(resourceDirectory, `tasks.txt`);
      fs.writeFileSync(
        outputTaskPath,
        JSON.stringify(response.data?.tasks, null, 2)
      );
      prompt = getPrompt("mockup", {
        screenshotFilePath: JSON.stringify([screenShotPath]),
        htmlFilePath: JSON.stringify([htmlFilePath]),
        taskFilePath: JSON.stringify([outputTaskPath]),
        assetFolder: JSON.stringify(assetsDirectory),
        // customInstruction: response.data?.metadata?.customInstruction || ""
      });
    }
    // --- End validation logic ---

    // Ask user if they want to proceed
    const proceed = await confirm({
      message:
        "Do you want to proceed? Note: It will generate better result if you provide screenshot, layout json and tasks",
    });
    if (!proceed) {
      console.log(chalk.red("❌ Generate process exited by user."));
      process.exit(0);
    }
    //import files if required

    console.log(chalk.greenBright(`${prompt}`));
    let proceedWithClaudecode = await confirm({ message: "Do you want to continue to execute Claude code with above prompt?" })
    if (proceedWithClaudecode) {
        spin = ora().start()
        spin.color = "magenta"
        spin.prefixText = "Processing"
        spin.spinner = "simpleDots"
        for await (const sdkmessage of query({
            prompt: prompt,
            abortController: new AbortController(),
            options: {
                allowedTools: ["Read", "Write", "Bash", "Edit", "LS", "TodoWrite", "TodoRead"]
            },
        })) {
            if (sdkmessage.type == "assistant" && sdkmessage.message.content[0].type == "text") {
                spin.stop()
                console.log(chalk.cyan(sdkmessage.message.content[0].text));
                spin.start()
            }
        }
        spin.stop()
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
  console.log(chalk.blue(`🔗 File Key ${filekey}`));
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
export default generate;
