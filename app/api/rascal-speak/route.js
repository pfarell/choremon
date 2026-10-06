import { ElevenLabsClient } from "elevenlabs";

const ELEVENLABS_VOICE_ID = "vBKc2FfBKJfcZNyEt1n6";

export async function POST(req) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY is not set" }), { status: 500 });
  }

  try {
    const { text } = await req.json();
    const client = new ElevenLabsClient({ apiKey });

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
