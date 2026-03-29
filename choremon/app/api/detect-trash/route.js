const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "REDACTED_OPENROUTER_KEY";
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || "REDACTED_FEATHERLESS_KEY";

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();

    const openRouterModels = [
      "google/gemma-3-12b-it:free",
      "google/gemma-3-4b-it:free",
      "nvidia/nemotron-nano-12b-v2-vl:free",
      "nvidia/llama-nemotron-embed-vl-1b-v2:free"
    ];

    const featherlessModels = [
      "google/gemma-3-12b-it",
      "google/gemma-3-4b-it",
      "v1v1d1/nayana-gemma3-4b-stage1"
    ];

    const payloadMessages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a trash detection system for a chore app.

Look at this image and identify every piece of trash or litter visible on the floor or surfaces.

Respond ONLY with a valid JSON array. No explanation, no markdown, no backticks. Raw JSON only.

NOTE: A trash bin, garbage can, or wastebasket itself is NOT considered trash. Do not list it as a trash item.

Each item must have:
- "id": unique string (e.g. "trash_1")
- "label": short name (e.g. "plastic bottle", "food wrapper", "tissue")
- "isTrash": true or false (false if it's a normal object like furniture, shoes, bags, or a garbage can)
- "confidence": "high", "medium", or "low"

Example:
[
  { "id": "trash_1", "label": "plastic bottle", "isTrash": true, "confidence": "high" },
  { "id": "trash_2", "label": "food wrapper", "isTrash": true, "confidence": "high" },
  { "id": "trash_3", "label": "backpack", "isTrash": false, "confidence": "high" },
  { "id": "trash_4", "label": "trash can", "isTrash": false, "confidence": "high" }
]

If no trash is detected, return an empty array: []`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ];

    const tryProvider = async (models, endpoint, apiKey) => {
      let lastProviderError = null;
      for (const model of models) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: payloadMessages
            })
          });

          const resData = await response.json();

          if (response.ok) {
            return resData; // Success!
          } else {
            const metadataStr = resData.error?.metadata?.raw ? ` (${resData.error.metadata.raw})` : "";
            lastProviderError = new Error(`[${model}] ` + (resData.error?.message || "API failed") + metadataStr);
            console.warn("[detect-trash fallback]", lastProviderError.message);
          }
        } catch (err) {
          lastProviderError = new Error(`[${model}] Network error: ${err.message}`);
          console.warn("[detect-trash fallback]", lastProviderError.message);
        }
      }
      return { error: lastProviderError }; // Return the last error if all failed
    };

    let result = await tryProvider(openRouterModels, "https://openrouter.ai/api/v1/chat/completions", OPENROUTER_API_KEY);
    
    // If OpenRouter exhausted all models and returned an error object, fallback to Featherless
    if (result && result.error) {
      console.warn("OpenRouter exhausted. Failing over to Featherless.ai...");
      const featherlessResult = await tryProvider(featherlessModels, "https://api.featherless.ai/v1/chat/completions", FEATHERLESS_API_KEY);
      
      // If Featherless also failed, throw the final error
      if (featherlessResult && featherlessResult.error) {
        throw new Error("Both OpenRouter and Featherless providers failed. Last error: " + featherlessResult.error.message);
      } else if (featherlessResult) {
        result = featherlessResult;
      }
    }

    if (!result || result.error) {
       throw new Error("Providers failed.");
    }

    const text = result.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const items = JSON.parse(cleaned);

    return new Response(JSON.stringify({ items }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[detect-trash]", err);
    return new Response(JSON.stringify({ error: err.message || "Detection failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
