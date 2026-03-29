const LINES = {
  greeting: [
    "[annoyed] Oh great, you're back. The trash cans won't clean themselves.",
    "[deadpan] Another day, another pile of dishes. Let's get to it.",
    "[dramatic] I have been waiting here... in silence... judging everything.",
    "[whispers] Between you and me? This place is a biohazard.",
  ],
  general: [
    "[annoyed] Still going? I give it five more minutes.",
    "[sarcastic] Wow. You picked up ONE thing. Medal incoming.",
    "[exasperated] I've been watching this for twenty minutes. TWENTY.",
    "[impressed, reluctantly] Okay. That was... not terrible. Don't let it go to your head.",
  ],
  trash: [
    "[disgusted] I count multiple items on the floor. We have a trash can. It's RIGHT THERE.",
    "[sighs heavily] Plastic bottles. On the floor. This is not a landfill.",
    "[deadpan] This is either a chore or a crime scene. I'm not sure which.",
    "[sarcastic] Oh look, a wrapper. And another one. Collecting them, are we?",
    "[annoyed] The trash can is literally right there. LITERALLY.",
  ],
  dishes: [
    "[disgusted] Those dishes have been sitting there since Tuesday. I counted. I gagged.",
    "[sighs heavily] You missed a spot. The OTHER one. Unbelievable.",
    "[sarcastic] Oh yes, just leave the pot to soak. That's totally what that means.",
  ],
  laundry: [
    "[suspicious] Is that the same load from last week? ...It is, isn't it.",
    "[deadpan] The dryer finished three days ago. The clothes folded themselves? No.",
  ],
  sweeping: [
    "[nervous] Under the couch. Go on. I'll be here. Emotionally preparing.",
    "[taunting] A raccoon with a broom. The universe has a sense of humor.",
  ],
  idle: [
    "[suspicious] You stopped moving. I'm watching you. I'm ALWAYS watching.",
    "[passive aggressive] Oh no no, take a break. The chores will wait. They always do.",
    "[bored] Still here. Still judging. No pressure.",
  ],
};

const used = {};

export function getRandomLine(category = "general") {
  const pool = [...(LINES[category] || []), ...LINES.general];
  if (!used[category]) used[category] = new Set();
  if (used[category].size >= pool.length) used[category].clear();
  const unused = pool.filter((_, i) => !used[category].has(i));
  const idx = Math.floor(Math.random() * unused.length);
  used[category].add(pool.indexOf(unused[idx]));
  return unused[idx];
}
