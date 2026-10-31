import { run as runTui, type TuiInput } from "@m4spider/tui"
import { Global } from "@m4spider/core/global"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(Global.defaultLayer))
}
