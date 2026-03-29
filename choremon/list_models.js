const key = "REDACTED_GEMINI_KEY";
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log(data.models.map(m => m.name).join("\n"));
    } else {
      console.log("No models found or error:", data);
    }
  })
  .catch(console.error);
