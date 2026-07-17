import path from "path";
import { promises as fs } from "fs";

export async function renderTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<string> {
  const baseDir = path.join(__dirname, "..", "templetes");
  const filePath = path.join(baseDir, `${templateName}.html`);

  let html = await fs.readFile(filePath, "utf-8");

  // Replace {{key}} with value for all variables provided
  for (const [key, value] of Object.entries(variables)) {
    const re = new RegExp(`{{\\s*${escapeRegex(key)}\\s*}}`, "g");
    html = html.replace(re, value ?? "");
  }

  // Clean up any unreplaced placeholders
  html = html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, "");

  return html;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
