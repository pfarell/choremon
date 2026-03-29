# 🎮 Choremon

> **Turn chores into quests. Earn XP. Rule the leaderboard.**

Choremon is a gamified household chores app that uses AI to detect messes, generate quests, and reward you for keeping your space clean — complete with AR modes and an AI companion named **Rascal**.

Built in 44 hours at Hack Indy 2026.

🌐 **Live Demo**: [choremon-six.vercel.app](https://choremon-six.vercel.app)

📝 **Devpost**: [devpost.com/software/choremon](https://choremon-six.vercel.app)

🎥 **Video Pitch**: [Choremon Pitch Video](https://youtu.be/QNTnY8eavig)

---

## ✨ Features

- 📸 **AI Room Scan** — Take a photo of your room; Gemini Vision detects the mess and generates a chore quest automatically
- 🎯 **4 Chore Modes** — Vacuum/Sweep, Mop/Wipe, Trash/Declutter, and Laundry, each with their own quest flow and XP scaling
- 🏆 **XP, Streaks & Leaderboard** — Complete quests to earn XP, build daily streaks, and compete on a family leaderboard
- 🦝 **Rascal** — An AI companion voiced via ElevenLabs that reacts to your progress with emotion-tagged lines
- 📱 **AR Modes** — WebXR browser-based floor cleaning mode + native Android AR via Unity (sweep-to-erase tile mechanic)

---

## 🔄 The Core Loop

```
Scan Room → Quest Activated → Complete Chore → Earn XP & Build Streak → Leaderboard Updated
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React 19, Tailwind CSS, Framer Motion |
| Backend / DB | Supabase, Vercel |
| AI / Vision | Gemini 2.0 Flash, Gemma 3 12b (Google AI SDK) |
| AR (Web) | WebXR + Three.js |
| AR (Native) | Unity 6 + AR Foundation 6.4.1 + ARCore XR Plugin 6.4.1 |
| Voice | ElevenLabs (eleven_multilingual_v2, Finn voice) |
| Fallback Chain | Gemini 2.0 Flash → FeatherlessAI → OpenRouter |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Gemini API key
- ElevenLabs API key (for Rascal voice)

### Installation

```bash
git clone https://github.com/your-username/choremon.git
cd choremon
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
FEATHERLESS_API_KEY=your_featherless_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Deploy

The app is deployed via Vercel and linked to this GitHub repo. Push to `main` to trigger a deployment:

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## 📱 Android AR (Unity)

The native Android AR mode is a separate Unity project using AR Foundation + ARCore. It receives a deep link from the web app and launches the sweep-to-erase tile mechanic.

To build the APK:
1. Open the Unity project in Unity 6
2. Ensure **AR Foundation 6.4.1** and **Google ARCore XR Plugin 6.4.1** are installed
3. Build for Android via `File → Build Settings`

---

## 🗺️ Future Work

- [ ] iOS ARKit support (native build)
- [ ] Family invite system
- [ ] Room profiles
- [ ] Real-world brand reward partnerships (e.g. free ice cream for XP milestones)
- [ ] Virtual companion upgrades
- [ ] Streak multipliers
- [ ] Snap Spectacles / Even G2 AR integration

---
