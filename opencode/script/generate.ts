import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const modelsUrl = process.env.M4SPIDER_MODELS_URL || "https://models.dev"
export const modelsData = process.env.MODELS_DEV_API_JSON
  ? await Bun.file(process.env.MODELS_DEV_API_JSON).text()
  : await fetch(`${modelsUrl}/api.json`).then((x) => x.text())
console.log("Loaded models.dev snapshot")
