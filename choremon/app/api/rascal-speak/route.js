import { ElevenLabsClient } from "elevenlabs";

const ELEVENLABS_API_KEY = "REDACTED_ELEVENLABS_KEY";
const ELEVENLABS_VOICE_ID = "vBKc2FfBKJfcZNyEt1n6";

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

export async function POST(req) {
  try {
    const { text } = await req.json();

    const audioStream = await client.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.75,
        style: 0.6,
        use_speaker_boost: true,
      },
    });

    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[rascal-speak]", err);
    return new Response(JSON.stringify({ error: "TTS failed" }), { status: 500 });
  }
}
