import path from "path";
import { promises as fs } from "fs";

/**
 * Email templates live in `src/templetes` and are copied to `dist/templetes` by the build.
 * ts-node runs this file from `src/utils`, the build runs it from `dist/src/utils`, so the
 * folder sits one level up in development and two in production - hence the candidate list
 * rather than a single hard-coded hop. Getting this wrong fails silently: the dispatcher
 * catches the error, so every templated email just quietly stops arriving.
 */
const CANDIDATE_DIRS = [
  path.join(__dirname, "..", "templetes"),
  path.join(__dirname, "..", "..", "templetes"),
];

let resolvedDir: string | null = null;

async function templatesDir(): Promise<string> {
  if (resolvedDir) return resolvedDir;

  for (const dir of CANDIDATE_DIRS) {
    try {
      await fs.access(dir);
      resolvedDir = dir;
      return dir;
    } catch {
      // Try the next layout.
    }
  }

  throw new Error(`Email templates folder not found. Looked in: ${CANDIDATE_DIRS.join(", ")}`);
}

export async function renderTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<string> {
  const baseDir = await templatesDir();
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
