import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const figmaCodeGeneraionPropt = fs.readFileSync(
  path.join(__dirname, "figma-code-generation.md"),
  "utf8"
);
const htmlCodeGeneraionPropt = fs.readFileSync(
  path.join(__dirname, "html-code-generation.md"),
  "utf8"
);
const mockupCodeGenerationPrompt = fs.readFileSync(
  path.join(__dirname, "mockup-code-generation.md"),
  "utf8"
);

export function getPrompt(type = "figma", placeholders) {
    let prompt;
    if(type === "figma") prompt = figmaCodeGeneraionPropt;
    else if(type === "html") prompt = htmlCodeGeneraionPropt;
    else if(type === "mockup") prompt = mockupCodeGenerationPrompt;
    else throw new Error("Invalid type provided. Use 'figma', 'html', or 'mockup'.");   
    for (const key in placeholders) {
        prompt = prompt.replaceAll(`{${key}}`, placeholders[key]);
    }
    return prompt;
}