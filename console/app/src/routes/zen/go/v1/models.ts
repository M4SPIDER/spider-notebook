import type { APIEvent } from "@solidjs/start/server"
import { ZenData } from "@opencode-ai/console-core/model.js"
import { buildModelsResponse, buildOptionsResponse } from "../../util/modelsHandler"

export async function OPTIONS(_input: APIEvent) {
  return buildOptionsResponse()
}

export async function GET(_input: APIEvent) {
  const zenData = ZenData.list("lite")
  const models = Object.keys(zenData.models)
  return buildModelsResponse(models)
}
