#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const TEXT_EXTS = new Set([
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".json",
  ".js",
  ".mjs",
  ".ts",
  ".vue",
  ".css",
  ".scss",
  ".html",
]);

const DEFAULT_RESIDUAL_PATTERNS = [
  "{{PROJECT_",
  "{{BACKEND_DIR}}",
  "{{ADMIN_DIR}}",
  "{{MOBILE_DIR}}",
  "{{DOCS_DIR}}",
  "{{SKILLS_DIR}}",
  "/base/",
  "base/docs",
  "base/skills",
  "模板仓库",
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}
if (!args.config) {
  usage();
  process.exit(1);
}

const configPath = path.resolve(args.config);
const configText = fs.readFileSync(configPath, "utf8");
const config = parseSimpleYaml(configText);
const write = Boolean(args.write);
const baseRoot = path.resolve(path.dirname(configPath), get(config, "base.source", "."));
const targetRoot = path.resolve(path.dirname(configPath), get(config, "target.path", "."));
const include = get(config, "base.include", ["skills", "docs", "README.md", "AGENTS.md"]);
const placeholders = get(config, "placeholders", {});
const reportName = get(config, "migration.report", "migration-report.md");

const report = {
  mode: write ? "write" : "dry-run",
  config: configPath,
  baseRoot,
  targetRoot,
  copied: [],
  skipped: [],
  missingOptional: [],
  conflicts: [],
  replacements: [],
  residuals: [],
};

for (const item of include) {
  const source = path.join(baseRoot, item);
  const target = path.join(targetRoot, item);
  if (!fs.existsSync(source)) {
    report.missingOptional.push(item);
    continue;
  }
  copyEntry(source, target, item);
}

if (write) {
  replaceInTarget(targetRoot, placeholders);
  scanResiduals(targetRoot);
  writeReport();
} else {
  scanResidualsPreview(targetRoot);
}

printReport();

function copyEntry(source, target, rel) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(source)) {
      if (shouldSkip(child)) continue;
      copyEntry(path.join(source, child), path.join(target, child), path.join(rel, child));
    }
    return;
  }

  if (fs.existsSync(target)) {
    report.conflicts.push(rel);
    if (!get(config, "migration.overwrite", false)) {
      report.skipped.push(rel);
      return;
    }
    if (write && get(config, "migration.backup_existing", false)) {
      backupExisting(target);
    }
  }

  report.copied.push(rel);
  if (!write) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function replaceInTarget(root, values) {
  for (const file of walk(root)) {
    if (!isTextFile(file)) continue;
    let text = fs.readFileSync(file, "utf8");
    let changed = false;
    for (const [key, value] of Object.entries(values)) {
      const token = `{{${key}}}`;
      const next = text.split(token).join(String(value));
      if (next !== text) {
        changed = true;
        report.replacements.push({ file: path.relative(root, file), token });
        text = next;
      }
    }
    if (changed) fs.writeFileSync(file, text);
  }
}

function scanResiduals(root) {
  if (!fs.existsSync(root)) return;
  for (const file of walk(root)) {
    if (!isTextFile(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of DEFAULT_RESIDUAL_PATTERNS) {
        if (line.includes(pattern)) {
          report.residuals.push({
            file: path.relative(root, file),
            line: index + 1,
            pattern,
            text: line.trim(),
          });
        }
      }
    });
  }
}

function scanResidualsPreview(root) {
  if (fs.existsSync(root)) scanResiduals(root);
}

function writeReport() {
  const out = path.join(targetRoot, reportName);
  fs.writeFileSync(out, renderReport());
}

function printReport() {
  console.log(renderReport());
  if (!write) {
    console.log("\n当前是 dry-run，没有写入文件。确认后加 --write 执行。");
  }
}

function renderReport() {
  return [
    "# Base Migration Report",
    "",
    `- 模式：${report.mode}`,
    `- 配置：${report.config}`,
    `- base：${report.baseRoot}`,
    `- 目标：${report.targetRoot}`,
    "",
    "## 复制计划 / 结果",
    "",
    ...report.copied.map((x) => `- ${write ? "已复制" : "将复制"}：${x}`),
    ...report.skipped.map((x) => `- 已跳过：${x}`),
    ...report.missingOptional.map((x) => `- 缺失可选项：${x}`),
    "",
    "## 冲突",
    "",
    ...(report.conflicts.length ? report.conflicts.map((x) => `- ${x}`) : ["- 无"]),
    "",
    "## 占位符替换",
    "",
    ...(report.replacements.length
      ? report.replacements.map((x) => `- ${x.file}: ${x.token}`)
      : ["- 无或未执行"]),
    "",
    "## 残留扫描",
    "",
    ...(report.residuals.length
      ? report.residuals.map((x) => `- ${x.file}:${x.line} [${x.pattern}] ${x.text}`)
      : ["- 未发现残留风险词"]),
    "",
  ].join("\n");
}

function walk(root) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  for (const name of fs.readdirSync(root)) {
    if (shouldSkip(name)) continue;
    const file = path.join(root, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) result.push(...walk(file));
    else result.push(file);
  }
  return result;
}

function shouldSkip(name) {
  return [
    ".git",
    ".DS_Store",
    "node_modules",
    "dist",
    "build",
    ".cache",
    "coverage",
  ].includes(name);
}

function backupExisting(file) {
  if (!fs.existsSync(file)) return;
  const backup = `${file}.base-backup`;
  let candidate = backup;
  let index = 1;
  while (fs.existsSync(candidate)) {
    candidate = `${backup}.${index}`;
    index += 1;
  }
  fs.copyFileSync(file, candidate);
}

function isTextFile(file) {
  return TEXT_EXTS.has(path.extname(file).toLowerCase());
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config") out.config = argv[++i];
    else if (arg === "--write") out.write = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
  }
  return out;
}

function usage() {
  console.log("用法：node scripts/migrate-to-project.mjs --config /path/to/project.agent.yaml [--write]");
}

function get(obj, dotted, fallback) {
  const parts = dotted.split(".");
  let current = obj;
  for (const part of parts) {
    if (!current || !(part in current)) return fallback;
    current = current[part];
  }
  return current;
}

function parseSimpleYaml(text) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = text.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const raw = lines[lineIndex];
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (line.startsWith("- ")) {
      if (!Array.isArray(parent)) continue;
      parent.push(unquote(line.slice(2).trim()));
      continue;
    }

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const rawValue = line.slice(idx + 1).trim();

    if (!rawValue) {
      const nextLine = nextMeaningful(lines, lineIndex);
      const value = nextLine && nextLine.trim().startsWith("- ") ? [] : {};
      parent[key] = value;
      stack.push({ indent, value });
    } else {
      parent[key] = parseValue(rawValue);
    }
  }

  return root;
}

function nextMeaningful(lines, index) {
  for (let i = index + 1; i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].trim().startsWith("#")) return lines[i];
  }
  return null;
}

function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return unquote(value);
}

function unquote(value) {
  return value.replace(/^["']|["']$/g, "");
}
