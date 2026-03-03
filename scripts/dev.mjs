#!/usr/bin/env node

import { spawn } from "node:child_process"
import path from "node:path"

const isWindows = process.platform === "win32"
const electronViteBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  isWindows ? "electron-vite.cmd" : "electron-vite",
)

const children = []
let stopping = false
let remaining = 0
let exitCode = 0

function launch(name, command, args) {
  const child = spawn(command, args, { stdio: "inherit" })
  children.push({ name, child })
  remaining += 1

  child.on("exit", (code, signal) => {
    remaining -= 1

    if (!stopping) {
      if (code !== 0 || signal) {
        const detail = code !== null ? `code ${code}` : `signal ${signal}`
        console.error(`[dev] ${name} exited unexpectedly (${detail})`)
        exitCode = code ?? 1
      }
      shutdown("SIGTERM")
    }

    if (remaining === 0) {
      process.exit(exitCode)
    }
  })
}

function shutdown(signal = "SIGTERM") {
  if (stopping) return
  stopping = true

  for (const { child } of children) {
    if (!child.killed) {
      child.kill(signal)
    }
  }
}

process.on("SIGINT", () => {
  exitCode = 0
  shutdown("SIGINT")
})

process.on("SIGTERM", () => {
  exitCode = 0
  shutdown("SIGTERM")
})

launch("dev-auth-server", process.execPath, ["scripts/dev-auth-server.mjs"])
launch("electron-vite", electronViteBin, ["dev"])
