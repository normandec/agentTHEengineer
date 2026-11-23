#!/usr/bin/env node
/*
 * Human-readable Dropbox mirror for one AI CLASSROOM session.
 * Usage: DROPBOX_ACCESS_TOKEN=... node tools/mirror.js <API_URL> <ADMIN_KEY> <SESSION_ID> [--once]
 * Supabase remains authoritative. This utility only appends/re-uploads a backup view.
 */
"use strict";
const [apiRaw, adminKey, sessionId, flag] = process.argv.slice(2);
const api = String(apiRaw || "").replace(/\/$/, "");
const token = process.env.DROPBOX_ACCESS_TOKEN;
if (!api || !adminKey || !sessionId || !token) {
  console.error("Usage: DROPBOX_ACCESS_TOKEN=... node tools/mirror.js <API_URL> <ADMIN_KEY> <SESSION_ID> [--once]");
  process.exit(2);
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function json(path) {
  const response = await fetch(`${api}${path}`); if (!response.ok) throw new Error(`${path}: ${response.status}`); return response.json();
}
async function dropbox(path, bytes, mode = "overwrite") {
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/octet-stream", "dropbox-api-arg": JSON.stringify({ path, mode, autorename: false, mute: true }) }, body: bytes });
  if (!response.ok) throw new Error(`Dropbox ${path}: ${response.status} ${await response.text()}`);
}
const safe = (s) => String(s || "session").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 70);
async function copyUrl(url, path) { const r = await fetch(url); if (!r.ok) throw new Error(`download ${url}: ${r.status}`); await dropbox(path, new Uint8Array(await r.arrayBuffer())); }
async function mirror() {
  const [sessions, memory, transcript, files, media] = await Promise.all([
    json("/sessions"), json(`/memory?session_id=${encodeURIComponent(sessionId)}`), json(`/transcript?session_id=${encodeURIComponent(sessionId)}&limit=40`), json(`/files?session_id=${encodeURIComponent(sessionId)}`), json(`/media?session_id=${encodeURIComponent(sessionId)}`)
  ]);
  const session = (sessions.sessions || []).find((s) => s.id === sessionId) || { title: "session" };
  const root = `/AI-CLASSROOM/${safe(session.title)}-${sessionId}`;
  const encoder = new TextEncoder();
  const transcriptMd = (transcript.messages || []).map((m) => `## ${m.seq} · ${m.author} · ${m.kind}\n\n${m.body}\n`).join("\n");
  await dropbox(`${root}/transcript.md`, encoder.encode(transcriptMd));
  await dropbox(`${root}/MEMORY.md`, encoder.encode(memory.memory?.body || ""));
  for (const file of files.files || []) if (file.url) await copyUrl(file.url, `${root}/files/${file.path.replace(/^files\/[^/]+\//, "") || safe(file.name)}`);
  for (const item of media.media || []) if (item.url) await copyUrl(item.url, `${root}/media/${safe(item.filename)}`);
  const archive = await fetch(`${api}/export?session_id=${encodeURIComponent(sessionId)}&admin=${encodeURIComponent(adminKey)}`);
  if (archive.ok) await dropbox(`${root}/session-export.zip`, new Uint8Array(await archive.arrayBuffer()));
  console.log(`Mirrored ${sessionId} to ${root}`);
}
(async () => { do { try { await mirror(); } catch (error) { console.error(error.message); if (flag === "--once") process.exitCode = 1; } if (flag === "--once") break; await pause(30_000); } while (true); })();
