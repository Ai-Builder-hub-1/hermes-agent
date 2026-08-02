import fs from "node:fs";
import path from "node:path";

const args =
  parseArgs(process.argv.slice(2));
const files =
  expandInputs(args._);
const findings =
  [];

for (const filePath of files) {
  const text =
    fs.readFileSync(filePath, "utf8");
  validateFile(filePath, text);
}

const summary =
  {
    checked:
      files.length,
    status:
      findings.some((finding) => finding.severity === "error") ? "fail" : findings.length ? "warn" : "pass",
    findings
  };

console.log(JSON.stringify(summary, null, 2));

if (summary.status === "fail") {
  process.exit(1);
}

function validateFile(filePath, text) {
  if (filePath.endsWith(path.join("src", "validate-surface.js"))) {
    return;
  }
  const normalizedPath =
    filePath.split(path.sep).join("/");
  if (/packages\/hermes-dashboard-kit\/src\/.+\.(ts|tsx)$/.test(normalizedPath)) {
    return;
  }

  const isDashboard =
    /dashboard|cockpit|command|market|operations|planner|calendar|review/i.test(filePath) ||
    /data-experience-tier|data-hdk-component|data-review-id|dashboard-kit/i.test(text);
  if (!isDashboard) {
    return;
  }

  const hasKit =
    /dashboard-kit\.css|@hermes\/dashboard-kit|data-hdk-component|hdk-/.test(text);
  const claimsTier3 =
    /data-experience-tier=["'](?:tier-3|3)|Tier 3|product-grade cockpit/i.test(text);
  const hasChartLanguage =
    /chart|sparkline|timeline|heatmap|donut|bar|line|area|axis|trend/i.test(text);
  const hasApprovedChart =
    /data-hdk-component=["'](?:LineChart|AreaChart|BarChart|DonutChart|Heatmap)|hdk-chart|hdk-donut|hdk-heatmap/.test(text);

  if (claimsTier3 && !hasKit) {
    add("error", filePath, "tier3_without_dashboard_kit", "Tier 3 surfaces must use @hermes/dashboard-kit components or CSS.");
  }

  if (hasChartLanguage && !hasApprovedChart) {
    add("error", filePath, "chart_without_approved_component", "Chart-like surfaces must use approved dashboard-kit chart components.");
  }

  if (/prototype preview/i.test(text)) {
    add("error", filePath, "prototype_preview_in_surface", "Production/review surfaces must not show prototype-preview behavior for real data.");
  }

  if (/visual-selection-bridge\.js/.test(text) && !/dev-only|development only|NODE_ENV/.test(text)) {
    add("error", filePath, "visual_selector_not_dev_gated", "Visual selection bridge must be gated to development-only routes.");
  }

  if (/<svg[\s\S]{0,900}<path[\s\S]{0,900}<\/svg>/i.test(text) && !/hdk-chart|data-hdk-component/.test(text)) {
    add("warn", filePath, "raw_svg_chart_candidate", "Raw SVG chart candidate found. Use dashboard-kit chart components unless this is a non-chart icon.");
  }

  if (/height:\s*(?:40|48|56|64|72)px[\s\S]{0,400}(?:chart|sparkline)/i.test(text) && !/axis|hdk-sparkline/.test(text)) {
    add("warn", filePath, "axisless_micro_chart", "Micro charts are allowed only as secondary sparklines; primary charts require axes and labels.");
  }

  if (/display:\s*grid[\s\S]{0,500}grid-template-columns:\s*repeat\([^)]*,\s*1fr\)[\s\S]{0,900}<table/i.test(text) && !/hdk-table-wrap|tablist|tabs/i.test(text)) {
    add("warn", filePath, "crowded_table_layout", "Multiple tables should use tabs or full-width stacked layouts instead of cramped side-by-side cards.");
  }
}

function add(severity, filePath, rule, message) {
  findings.push({
    severity,
    file:
      path.relative(process.cwd(), filePath),
    rule,
    message
  });
}

function expandInputs(inputs) {
  const selected =
    inputs.length ? inputs : ["."];
  const output =
    [];
  for (const input of selected) {
    const resolved =
      path.resolve(input);
    if (!fs.existsSync(resolved)) {
      continue;
    }
    const stat =
      fs.statSync(resolved);
    if (stat.isDirectory()) {
      walk(resolved, output);
    } else if (isSurfaceFile(resolved)) {
      output.push(resolved);
    }
  }
  return output;
}

function walk(dir, output) {
  for (const entry of fs.readdirSync(dir, {
    withFileTypes:
      true
  })) {
    if (["node_modules", ".git", "dist", "build"].includes(entry.name)) {
      continue;
    }
    const fullPath =
      path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
    } else if (isSurfaceFile(fullPath)) {
      output.push(fullPath);
    }
  }
}

function isSurfaceFile(filePath) {
  return /\.(html|tsx|jsx|js|ts|css)$/.test(filePath);
}

function parseArgs(argv) {
  const parsed =
    {
      _:
        []
    };
  for (let index = 0; index < argv.length; index += 1) {
    const arg =
      argv[index];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const key =
      arg.slice(2);
    const next =
      argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] =
        true;
      continue;
    }
    parsed[key] =
      next;
    index += 1;
  }
  return parsed;
}
