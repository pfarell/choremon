let isSpeaking = false;

export async function rascalSpeak(text) {
  if (isSpeaking) return;
  isSpeaking = true;

  try {
    const res = await fetch("/api/rascal-speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    await new Promise((resolve, reject) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  } catch (err) {
    console.error("[rascalSpeak]", err);
  } finally {
    isSpeaking = false;
  }
}
