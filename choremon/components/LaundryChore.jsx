"use client";
import { useState } from "react";
import { rascalSpeak } from "@/lib/rascalSpeak";
import { useRascalChatter } from "@/hooks/useRascalChatter";

const STEPS = [
  { id: 1, label: "Sort clothes",       xp: 5,  hint: "Darks, lights, delicates" },
  { id: 2, label: "Load the washer",    xp: 10, hint: "Don't overstuff it" },
  { id: 3, label: "Add detergent",      xp: 5,  hint: "Measure it properly for once" },
  { id: 4, label: "Run the wash cycle", xp: 15, hint: "Come back in ~30 mins" },
  { id: 5, label: "Move to dryer",      xp: 10, hint: "Don't leave it sitting wet" },
  { id: 6, label: "Run the dry cycle",  xp: 15, hint: "Come back in ~40 mins" },
  { id: 7, label: "Fold clothes",       xp: 20, hint: "Actually fold them" },
  { id: 8, label: "Put clothes away",   xp: 20, hint: "Not the chair. The drawer." },
];

const RASCAL_STEP_QUIPS = {
  1: "[sarcastic] Oh wow, sorting. Groundbreaking.",
  2: "[deadpan] Don't overstuff it. I know you're going to overstuff it.",
  4: "[impressed, reluctantly] You started the washer. I had doubts.",
  5: "[suspicious] Moving it right away? Who are you and what did you do with the real you.",
  7: "[exasperated] FOLD them. Not stuff them. FOLD.",
  8: "[genuinely shocked] You actually put them away. I need to sit down.",
};

export default function LaundryChore({ onXPEarned, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [totalXP, setTotalXP] = useState(0);

  // useRascalChatter only active once you start doing steps (size > 0), 
  // but wait... `useRascalChatter` is an existing hook in the project to periodically speak
  // The prompt asked to import it, so we'll do it exactly as instructed.
  useRascalChatter({ choreType: "laundry", isActive: completedSteps.size > 0 });

  const completeStep = (step) => {
    if (completedSteps.has(step.id)) return;
    setCompletedSteps((prev) => new Set([...prev, step.id]));
    setTotalXP((prev) => prev + step.xp);
    onXPEarned?.(step.xp);
    if (RASCAL_STEP_QUIPS[step.id]) rascalSpeak(RASCAL_STEP_QUIPS[step.id]);
  };

  const allDone = completedSteps.size === STEPS.length;

  const finishQuest = () => {
    onComplete?.({
      coinsCollected: completedSteps.size,
      totalCoins: STEPS.length,
      xpEarned: totalXP,
    });
  };

  return (
    <div className="fixed inset-0 bg-bg overflow-y-auto no-scrollbar pb-24 z-50">
      <div className="flex-none p-4 pb-2 border-b border-white/10 shadow-sm bg-white/50 backdrop-blur-md sticky top-0 z-10">
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-medium text-txt">Laundry Checklist</h2>
            <span className="text-gold font-bold text-lg">+{totalXP} XP</span>
         </div>
      </div>

      <div className="p-4 space-y-4 pt-4 max-w-lg mx-auto">
        <div className="space-y-3">
          {STEPS.map((step) => {
            const done = completedSteps.has(step.id);
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)]
                  ${done ? "bg-gray-50 opacity-50 border-gray-100" : "bg-white border-transparent"}`}
              >
                <div>
                  <p className={`font-bold text-txt text-lg capitalize mb-0.5 ${done ? "line-through text-txt-light" : ""}`}>{step.label}</p>
                  {!done && <p className="text-sm font-semibold text-txt-light">{step.hint}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${done ? "text-gray-400" : "text-txt-light"}`}>+{step.xp}</span>
                  {!done ? (
                    <button
                      onClick={() => completeStep(step)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 active:scale-95 transition-transform text-white rounded-xl text-sm font-bold shadow-md"
                    >
                      Done
                    </button>
                  ) : (
                    <span className="text-green-500 font-bold text-xl px-2">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="text-center py-10 space-y-4 animate-bounce-in">
            <p className="text-5xl">👕</p>
            <div>
              <h3 className="text-2xl font-display text-txt">Laundry Complete!</h3>
              <p className="font-medium text-txt-light">You earned {totalXP} XP from laundry.</p>
            </div>
            <div className="flex flex-col gap-3 max-w-[200px] mx-auto mt-6">
              <button
                onClick={finishQuest}
                className="btn-3d btn-green"
              >
                Finish Quest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
