async function main() {
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/vBKc2FfBKJfcZNyEt1n6/stream', {
    method: 'POST',
    headers: {
      'xi-api-key': 'REDACTED_ELEVENLABS_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: 'Hello world',
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.35, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true }
    })
  });
  console.log(res.status);
  const data = await res.text();
  console.log(data);
}
main();
