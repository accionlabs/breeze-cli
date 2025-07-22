import * as fs from 'fs';

const figmaCodeGeneraionPropt = fs.readFileSync("./prompts/figma-code-generation.md", "utf8");

export function getPrompt(type = "figma", placeholders) {
    console.log("placeholder", placeholders)
    let prompt;
    if(type === "figma") prompt = figmaCodeGeneraionPropt;
    for (const key in placeholders) {
        prompt = prompt.replaceAll(`{${key}}`, placeholders[key]);
    }
    return prompt;
}