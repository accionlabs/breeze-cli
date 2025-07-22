import * as fs from 'fs';

const figmaCodeGeneraionPropt = fs.readFileSync("./prompts/figma-code-generation.md", "utf8");
const htmlCodeGeneraionPropt = fs.readFileSync("./prompts/html-code-generation.md", "utf8");
const mockupCodeGenerationPrompt = fs.readFileSync("./prompts/mockup-code-generation.md", "utf8");

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