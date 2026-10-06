/**
 * Quick connectivity check for every service Chorémon uses.
 * Reads keys from the environment — never hardcode them.
 *
 * Usage:
 *   GEMINI_API_KEY=... ELEVENLABS_API_KEY=... node tools/check-apis.mjs
 */

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push(`  ok    ${name} — ${detail}`);
  } catch (err) {
    results.push(`  FAIL  ${name} — ${err.message}`);
  }
}

await check("Gemini", async () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return `${data.models ? data.models.length : 0} models visible`;
});

await check("ElevenLabs", async () => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY not set");
  const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": key },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return `tier ${data.tier || "unknown"}, ${data.character_count ?? "?"}/${data.character_limit ?? "?"} chars used`;
});

await check("OpenRouter", async () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return "reachable";
});

console.log("Chorémon service check\n" + results.join("\n"));
