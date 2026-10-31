import { addons, types } from "storybook/manager-api"
import { ThemeTool } from "./theme-tool"

addons.register("m4spider/theme-toggle", () => {
  addons.add("m4spider/theme-toggle/tool", {
    type: types.TOOL,
    title: "Theme",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: ThemeTool,
  })
})
