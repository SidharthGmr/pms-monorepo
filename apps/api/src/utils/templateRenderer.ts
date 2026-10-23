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

const LAYOUT = "_layout";
const DIRECTIVE = /<!--\s*(preheader|footer)\s*:\s*([\s\S]*?)-->\s*/gi;

const fill = (html: string, variables: Record<string, string>): string => {
  for (const [key, value] of Object.entries(variables)) {
    const re = new RegExp(`{{\\s*${escapeRegex(key)}\\s*}}`, "g");
    html = html.replace(re, value ?? "");
  }
  return html;
};

/**
 * A content template is the inside of the card; `_layout.html` supplies the chrome around it,
 * so the brand header, dark-mode palette and footer are written once. A template opting out
 * (a name starting with `_`, or one with its own <html> root) is returned as it stands.
 *
 * Content declares its own preview line and footer sentence with directives the layout reads:
 *   <!--preheader: Your one-time code is {{OTP_CODE}}.-->
 *   <!--footer: You received this because a sign-in code was requested.-->
 */
export async function renderTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<string> {
  const baseDir = await templatesDir();
  const content = await fs.readFile(path.join(baseDir, `${templateName}.html`), "utf-8");

  const standalone = templateName.startsWith("_") || /<html[\s>]/i.test(content);
  let html: string;

  if (standalone) {
    html = fill(content, variables);
  } else {
    const directives: Record<string, string> = {};
    const body = content.replace(DIRECTIVE, (_match, key: string, value: string) => {
      directives[key.toLowerCase() === "footer" ? "footerNote" : "preheader"] = value.trim();
      return "";
    });

    const filledBody = fill(body, variables);
    const layout = await fs.readFile(path.join(baseDir, `${LAYOUT}.html`), "utf-8");
    html = fill(layout, {
      preheader: "",
      footerNote: "",
      ...fillDirectives(directives, variables),
      ...variables,
      content: filledBody,
    });
  }

  // Clean up any unreplaced placeholders
  html = html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, "");

  return html;
}

/** Directives carry placeholders of their own, so they are filled before reaching the layout. */
function fillDirectives(directives: Record<string, string>, variables: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(directives).map(([key, value]) => [key, fill(value, variables)]));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
