#!/usr/bin/env node

import { createServer } from "node:http"
import { randomUUID } from "node:crypto"

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || "127.0.0.1"

const tokens = new Map()
const refreshTokens = new Map()

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  })
  res.end(body)
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error("Invalid JSON body"))
      }
    })
    req.on("error", reject)
  })
}

function normalizeUser(payload) {
  return {
    id: `dev-user-${randomUUID()}`,
    email: String(payload.email || "").trim().toLowerCase(),
    name: String(payload.name || "").trim() || null,
    about: String(payload.about || "").trim() || null,
    personality: String(payload.personality || "").trim() || null,
    imageUrl: null,
    username: null,
  }
}

function issueSession(user) {
  const token = `dev-token-${randomUUID()}`
  const refreshToken = `dev-refresh-${randomUUID()}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const session = { token, refreshToken, expiresAt, user }
  tokens.set(token, session)
  refreshTokens.set(refreshToken, session)
  return session
}

function getBearerToken(req) {
  return req.headers["x-desktop-token"] || null
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`)

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "dev-auth-server" })
  }

  if (req.method === "POST" && url.pathname === "/api/auth/desktop/onboard") {
    try {
      const body = await parseBody(req)
      const name = String(body.name || "").trim()
      const email = String(body.email || "").trim().toLowerCase()
      const about = String(body.about || "").trim()
      const personality = String(body.personality || "").trim()

      if (name.length < 2 || name.length > 80) {
        return sendJson(res, 400, { error: "Please enter a valid name (2-80 characters)." })
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: "Please enter a valid email address." })
      }
      if (about.length < 8 || about.length > 1000) {
        return sendJson(res, 400, { error: "Please add a short intro about yourself (8-1000 characters)." })
      }
      if (personality.length < 4 || personality.length > 500) {
        return sendJson(res, 400, { error: "Please describe your preferred agent personality (4-500 characters)." })
      }

      const user = normalizeUser({ name, email, about, personality })
      const session = issueSession(user)
      return sendJson(res, 200, session)
    } catch (error) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : "Invalid request" })
    }
  }

  if (req.method === "POST" && url.pathname === "/api/auth/desktop/refresh") {
    try {
      const body = await parseBody(req)
      const refreshToken = String(body.refreshToken || "")
      const existing = refreshTokens.get(refreshToken)
      if (!existing) {
        return sendJson(res, 401, { error: "Invalid refresh token" })
      }

      const nextSession = issueSession(existing.user)
      return sendJson(res, 200, nextSession)
    } catch (error) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : "Invalid request" })
    }
  }

  if (req.method === "GET" && url.pathname === "/api/desktop/user/plan") {
    const token = getBearerToken(req)
    const session = token ? tokens.get(String(token)) : null
    if (!session) {
      return sendJson(res, 401, { error: "Unauthorized" })
    }
    return sendJson(res, 200, {
      email: session.user.email,
      plan: "dev",
      status: "active",
    })
  }

  if (req.method === "PATCH" && url.pathname === "/api/user/profile") {
    try {
      const token = getBearerToken(req)
      const session = token ? tokens.get(String(token)) : null
      if (!session) {
        return sendJson(res, 401, { error: "Unauthorized" })
      }
      const body = await parseBody(req)
      const nextName = String(body.display_name || "").trim()
      const nextAboutRaw = body.about ?? body.bio ?? ""
      const nextPersonalityRaw = body.personality ?? body.agent_personality ?? ""
      const nextAbout = typeof nextAboutRaw === "string" ? nextAboutRaw.trim() : ""
      const nextPersonality =
        typeof nextPersonalityRaw === "string"
          ? nextPersonalityRaw.trim()
          : ""

      session.user = {
        ...session.user,
        ...(body.display_name !== undefined ? { name: nextName || null } : {}),
        ...(body.about !== undefined || body.bio !== undefined
          ? { about: nextAbout || null }
          : {}),
        ...(body.personality !== undefined || body.agent_personality !== undefined
          ? { personality: nextPersonality || null }
          : {}),
      }
      tokens.set(session.token, session)
      refreshTokens.set(session.refreshToken, session)
      return sendJson(res, 200, { ok: true, user: session.user })
    } catch (error) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : "Invalid request" })
    }
  }

  sendJson(res, 404, { error: "Not found" })
})

server.listen(PORT, HOST, () => {
  console.log(`[dev-auth-server] listening on http://${HOST}:${PORT}`)
  console.log("[dev-auth-server] endpoints:")
  console.log("  POST /api/auth/desktop/onboard")
  console.log("  POST /api/auth/desktop/refresh")
  console.log("  GET  /api/desktop/user/plan")
  console.log("  PATCH /api/user/profile")
})
