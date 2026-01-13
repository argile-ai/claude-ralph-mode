/**
 * Build script to embed markdown templates as TypeScript modules.
 * Run before build: tsx scripts/embed-templates.ts
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");
const OUTPUT_DIR = path.join(ROOT_DIR, "src", "templates", "embedded");

const TEMPLATES = {
  "plan.template.md": "PLAN_TEMPLATE",
  "prompt.md": "PROMPT_TEMPLATE",
  "skills/ralph.md": "RALPH_SKILL",
  "skills/prd.md": "PRD_SKILL",
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toFileName(key: string): string {
  return key
    .replace(/\//g, "-")
    .replace(".md", "")
    .replace(/\./g, "-") + ".ts";
}

function main() {
  console.log("Embedding templates...");
  ensureDir(OUTPUT_DIR);

  const exports: string[] = [];

  for (const [templatePath, varName] of Object.entries(TEMPLATES)) {
    const fullPath = path.join(TEMPLATES_DIR, templatePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: Template not found: ${fullPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    const outputFile = toFileName(templatePath);
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    const code = `// Auto-generated - DO NOT EDIT
// Source: templates/${templatePath}

export const ${varName} = ${JSON.stringify(content)};
`;

    fs.writeFileSync(outputPath, code);
    console.log(`  ✓ ${templatePath} -> ${outputFile}`);

    exports.push(
      `export { ${varName} } from "./${outputFile.replace(".ts", ".js")}";`
    );
  }

  // Generate index file
  const indexContent = `// Auto-generated - DO NOT EDIT
${exports.join("\n")}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexContent);
  console.log("  ✓ Generated index.ts");

  console.log("Done!");
}

main();
