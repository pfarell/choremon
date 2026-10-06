# Chorémon — engineering record

Everything below happened during a 44-hour build at Hack Indy 2026 by
[Praditya Farell](https://github.com/pfarell) and [Winner R. Rasendriya](https://github.com/winnrras).
It is written down because the trade-offs were the hard part.

## 1. Stack at a glance

| Layer | Choice |
|---|---|
| Web app | Next.js 14 (App Router), React 19, Tailwind CSS, Framer Motion |
| Web AR | WebXR Hit-Test API + Three.js r162 |
| Native AR | Unity (C#) + AR Foundation + ARCore — Android APK |
| Primary AI | Google Gemini API (photo → quest JSON) |
| Fallback AI | Featherless AI (fine-tuned Gemma) → OpenRouter → NVIDIA Nemotron VL |
| On-device AI | TensorFlow.js + COCO-SSD (client-side object detection) |
| Voice | ElevenLabs `eleven_multilingual_v2` (Finn) |
| Data | Firebase Realtime (XP, streaks, leaderboard) |
| Hosting | Vercel (web) + sideloaded APK (AR) |

## 2. The AI vision pipeline

Camera frames are base64-encoded client-side and sent to the `scan` / `detect-trash` routes.
The model contract is strict JSON — ids, labels, locations, XP values, a roast line — and the
response parser strips markdown fences before `JSON.parse`, because models occasionally wrap
JSON in prose no matter how the prompt forbids it.

Failure is treated as a first-class state:

```text
Gemini (primary)
  └─► Featherless AI — fine-tuned Gemma 3 12B / 4B
        └─► OpenRouter — same Gemma models, routed
              └─► NVIDIA nemotron-nano-12b-v2-vl + llama-nemotron-embed-vl-1b-v2
                    └─► mock data, so the demo flow always completes
```

Why so many: during the hackathon one provider rate-limited, another had a cold model, and the
ElevenLabs quota was shared. The fallback chain was the difference between a dead demo and an
award. Trash detection additionally refuses to call a trash bin "trash" — the prompt and the
`isTrash` flag were both tuned against that specific failure.

## 3. AR Mode 1 — Coin Mode (WebXR + Three.js)

- A floor hit-test anchors real 3D coins to the detected floor plane — they stay put while you
  move, which is exactly what makes collecting them feel physical.
- Collecting every coin triggers a quest-complete fanfare (Web Audio, synthesized).
- Runs in any AR-capable Android browser. On iOS it needs Mozilla's XRViewer, because Safari
  has no WebXR and the team had no MacBook for an ARKit build.

## 4. AR Mode 2 — Tile Mode (Unity + ARCore)

The longest single piece of the build. The flow crosses three runtimes:

1. The web app fires `window.location.href = "choremon://ar?mode=tile"`.
2. Android opens the pre-installed Unity APK; Unity reads `Application.absoluteURL` for the mode.
3. ARCore detects the horizontal floor plane, renders it as an overlay mesh, and the user taps
   to confirm it.
4. Unity computes the real surface area in m² from the plane boundary vertices and sets it as
   the cleaning target.
5. The floor is divided into a virtual tile grid, all tiles start "dirty". Each frame the device
   position is projected onto the floor plane; tiles within a radius flip to clean, the highlight
   disappears in real time, and coverage % = cleaned ÷ total is recomputed live.

On completion the APK hands coverage back to the web app so XP is awarded where the quest started.

## 5. Rascal — voice and behaviour

- **Voice settings:** `eleven_multilingual_v2`, Finn (`vBKc2FfBKJfcZNyEt1n6`), stability 0.35,
  similarity 0.75, style 0.6, speaker boost on. These were tuned by ear over many takes —
  lower stability made him manic, higher flattened the sarcasm.
- **Emotion tags:** `[annoyed]`, `[sarcastic]`, `[sighs heavily]`, `[passive aggressive]` live
  inline in the script strings and are passed raw to the voice model.
- **No repeats:** every line belongs to a category (greeting, general, dishes, laundry, sweeping,
  trash, idle) and is tracked in a set until that category is exhausted.
- **Chatter cadence:** first line 8–15 s after a chore starts, then random 25–60 s via chained
  `setTimeout`.
- **Idle detection:** `devicemotion` `accelerationIncludingGravity` magnitude < 1.5 for 12 s
  means he calls you out.
- **SFX:** Web Audio API sine-wave oscillator — coin plinks and quest fanfares at zero latency.

## 6. XP, streaks and the leaderboard

Laundry is the purest example of the XP design (max 100 XP per quest):

| Step | XP |
|---|---|
| Sort clothes | +5 |
| Load the washer | +10 |
| Add detergent | +5 |
| Run the wash cycle | +15 |
| Move to dryer | +10 |
| Run the dry cycle | +15 |
| Fold clothes | +20 |
| Put clothes away | +20 |

Streaks multiply rewards, and everything syncs to a Firebase-backed family leaderboard. Rascal
fires commentary at steps 1, 2, 4, 5, 7 and 8 to keep momentum.

## 7. AR platform evaluation (what we rejected and why)

WebXR, AR.js, MindAR, 8th Wall, Unity, Kivicube, and React Native + ViroAR were all on the table.
Each traded device support against integration time. The split that survived: **WebXR for the
instant-scan mode** (no install, works on Android browsers) and **Unity/ARCore for the
precision mode** (real plane geometry, real surface area, real tile math).

## 8. Honest limits

- iOS needs XRViewer for web AR; there is no ARKit build (no MacBook in the team).
- Tile Mode is Android-only and ships as a sideloaded APK — it cannot run in the browser.
- The hosted demo runs on the authors' API keys; when quotas exhaust, the fallback chain serves
  mock data by design rather than failing.
- The failure surface of five chained models is large; the fallback chain is what keeps the
  experience whole, but it also means some frames are classified by weaker models.
