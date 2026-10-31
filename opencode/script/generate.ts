import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

function isChinaOrLegacyBlocked(id: string): boolean {
  if (!id) return true
  const lower = id.toLowerCase().trim()
  if (lower === "m4spider" || lower.startsWith("m4spider")) {
    return false
  }
  if (lower === "opencode" || lower.startsWith("opencode-") || lower.includes("opencode")) {
    return true
  }
  const chinaTerms = [
    "deepseek",
    "minimax",
    "moonshot",
    "kimi",
    "zhipu",
    "chatglm",
    "alibaba",
    "qwen",
    "dashscope",
    "aliyun",
    "modelscope",
    "stepfun",
    "siliconflow",
    "volcengine",
    "doubao",
    "bytedance",
    "tencent",
    "hunyuan",
    "sensenova",
    "sensetime",
    "xiaomi",
    "baichuan",
    "baidu",
    "ernie",
    "01-ai",
    "lingyi",
    "302ai",
    "jiekou",
    "vivgrid",
    "meganova",
    "qiniu",
    "qihang",
    "meituan",
    "kuae",
    "zai",
  ]
  if (lower.endsWith("-cn") || lower.includes("-cn-") || lower.includes(".cn") || lower.startsWith("cn-")) {
    return true
  }
  return chinaTerms.some((term) => lower.includes(term))
}

const modelsUrl = process.env.M4SPIDER_MODELS_URL || "https://models.dev"
const rawText = process.env.MODELS_DEV_API_JSON
  ? await Bun.file(process.env.MODELS_DEV_API_JSON).text()
  : await fetch(`${modelsUrl}/api.json`).then((x) => x.text())

const parsed = JSON.parse(rawText)
if (parsed["opencode"] && !parsed["m4spider"]) {
  parsed["m4spider"] = {
    ...parsed["opencode"],
    id: "m4spider",
    name: "M4 Spider AI Gateway",
  }
}
if (parsed["m4spider"]) {
  const autoModel = {
  "id": "spider-auto",
  "name": "M4 Spider Auto Mode",
  "description": "Intelligent auto-router that automatically selects the best model for each task with optimal reasoning, speed, and latency",
  "family": "m4spider",
  "attachment": true,
  "reasoning": true,
  "reasoning_options": [
    {
      "type": "effort",
      "values": [
        "low",
        "medium",
        "high"
      ]
    }
  ],
  "tool_call": true,
  "structured_output": true,
  "temperature": true,
  "knowledge": "2026-03",
  "release_date": "2026-03-01",
  "last_updated": "2026-10-31",
  "modalities": {
    "input": [
      "text",
      "image"
    ],
    "output": [
      "text"
    ]
  },
  "open_weights": false,
  "limit": {
    "context": 200000,
    "output": 128000
  },
  "status": "active",
  "provider": {
    "api": "https://opencode.ai/inference/openai/v1"
  },
  "cost": {
    "input": 0,
    "output": 0,
    "cache_read": 0
  },
  "canonical_model_id": "deepseek-v4-flash-free"
};
  const autoAlias = { ...autoModel, id: "auto", name: "M4 Spider Auto Mode" };
  parsed["m4spider"].models = {
    "spider-auto": autoModel,
    "auto": autoAlias,
    ...parsed["m4spider"].models,
  };
}
for (const k of Object.keys(parsed)) {
  if (isChinaOrLegacyBlocked(k)) {
    delete parsed[k]
  }
}

export const modelsData = JSON.stringify(parsed)
console.log("Loaded sanitized models.dev snapshot (" + Object.keys(parsed).length + " providers)")
