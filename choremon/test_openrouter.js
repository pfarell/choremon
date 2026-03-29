const fs = require('fs');
const key = "REDACTED_OPENROUTER_KEY";
const dummyImg = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function run() {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemma-3-12b-it:free",
      messages: [ { role: "user", content: [ { type: "text", text: "what" }, { type: "image_url", image_url: { url: `data:image/png;base64,${dummyImg}` } } ] } ]
    })
  });
  const data = await res.json();
  fs.writeFileSync("output.json", JSON.stringify(data, null, 2));
}

run();
