async function main() {
  const apiKey = 'REDACTED_ELEVENLABS_KEY';
  const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
    headers: { 'xi-api-key': apiKey }
  });
  console.log('Status:', res.status);
  console.log(await res.json());
}
main();
