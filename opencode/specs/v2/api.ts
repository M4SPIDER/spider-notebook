// @ts-nocheck

import { M4 Spider } from "@m4spider/core"
import { ReadTool } from "@m4spider/core/tools"

const m4spider = M4 Spider.make({})

m4spider.tool.add(ReadTool)

m4spider.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

m4spider.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

m4spider.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await m4spider.session.create({
  agent: "build",
})

m4spider.subscribe((event) => {
  console.log(event)
})

await m4spider.session.prompt({
  sessionID,
  text: "hey what is up",
})

await m4spider.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await m4spider.session.wait()

console.log(await m4spider.session.messages(sessionID))
