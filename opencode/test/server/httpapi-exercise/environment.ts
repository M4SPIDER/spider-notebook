import { Flag } from "@m4spider/core/flag/flag"
import { Effect } from "effect"
import path from "path"

const preserveExerciseGlobalRoot = !!process.env.M4SPIDER_HTTPAPI_EXERCISE_GLOBAL
export const exerciseGlobalRoot =
  process.env.M4SPIDER_HTTPAPI_EXERCISE_GLOBAL ??
  path.join(process.env.TMPDIR ?? "/tmp", `m4spider-httpapi-global-${process.pid}`)
process.env.XDG_DATA_HOME = path.join(exerciseGlobalRoot, "data")
process.env.XDG_CONFIG_HOME = path.join(exerciseGlobalRoot, "config")
process.env.XDG_STATE_HOME = path.join(exerciseGlobalRoot, "state")
process.env.XDG_CACHE_HOME = path.join(exerciseGlobalRoot, "cache")
process.env.M4SPIDER_DISABLE_SHARE = "true"
export const exerciseConfigDirectory = path.join(exerciseGlobalRoot, "config", "m4spider")
export const exerciseDataDirectory = path.join(exerciseGlobalRoot, "data", "m4spider")

const preserveExerciseDatabase = !!process.env.M4SPIDER_HTTPAPI_EXERCISE_DB
export const exerciseDatabasePath =
  process.env.M4SPIDER_HTTPAPI_EXERCISE_DB ??
  path.join(process.env.TMPDIR ?? "/tmp", `m4spider-httpapi-exercise-${process.pid}.db`)
process.env.M4SPIDER_DB = exerciseDatabasePath
Flag.M4SPIDER_DB = exerciseDatabasePath

export const original = {
  M4SPIDER_SERVER_PASSWORD: Flag.M4SPIDER_SERVER_PASSWORD,
  M4SPIDER_SERVER_USERNAME: Flag.M4SPIDER_SERVER_USERNAME,
}

export const cleanupExercisePaths = Effect.promise(async () => {
  const fs = await import("fs/promises")
  if (!preserveExerciseDatabase) {
    await Promise.all(
      [exerciseDatabasePath, `${exerciseDatabasePath}-wal`, `${exerciseDatabasePath}-shm`].map((file) =>
        fs.rm(file, { force: true }).catch(() => undefined),
      ),
    )
  }
  if (!preserveExerciseGlobalRoot)
    await fs.rm(exerciseGlobalRoot, { recursive: true, force: true }).catch(() => undefined)
})
