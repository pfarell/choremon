"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { rascalSpeak } from "@/lib/rascalSpeak";
import { getRandomLine } from "@/lib/rascalLines";
import { motion, AnimatePresence } from "framer-motion";

const XP_PER_ITEM = 10;

export default function TrashChore({ onXPEarned, onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState("camera");
  const [trashItems, setTrashItems] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const totalTrashCount = useRef(0);

  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };
    startCamera();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const scanTrash = useCallback(async () => {
    setPhase("scanning");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      alert("Camera feed not ready yet.");
      setPhase("camera");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    try {
      const res = await fetch("/api/detect-trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok || !data.items) {
        throw new Error(data.error || "Detection failed. Could not parse response.");
      }
      
      const { items } = data;

      const withStatus = items.map((item) => ({
        ...item,
        status: "pending", 
      }));

      totalTrashCount.current = items.filter((i) => i.isTrash).length;

      setTrashItems(withStatus);
      setPhase("list");

      if (totalTrashCount.current === 0) {
        console.log("No trash found!");
      } else {
        console.log("Trash found!");
      }
    } catch (err) {
      console.error(err);
      alert("Detection Error: " + err.message);
      setPhase("camera");
    }
  }, []);

  const markDone = (id) => {
    setTrashItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.isTrash) {
          const earned = totalXP + XP_PER_ITEM;
          setTotalXP(earned);
          onXPEarned?.(XP_PER_ITEM);
        }
        return { ...item, status: "done" };
      })
    );
  };

  const markNotTrash = (id) => {
    setTrashItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "not-trash" } : item
      )
    );
  };

  const handleFinishQuest = () => {
    const doneCount = trashItems.filter((i) => i.status === "done" && i.isTrash).length;
    onComplete?.({
      coinsCollected: doneCount,
      totalCoins: totalTrashCount.current,
      xpEarned: totalXP,
    });
  };

  const resetCamera = async () => {
    setTrashItems([]);
    setTotalXP(0);
    setPhase("camera");
  };

  const pending = trashItems.filter((i) => i.status === "pending");
  const done = trashItems.filter((i) => i.status === "done" || i.status === "not-trash");
  const allCleared = phase === "list" && pending.length === 0;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col z-50">
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div 
        className={`absolute inset-0 bg-black/40 z-[5] transition-opacity duration-500 pointer-events-none ${phase !== "camera" ? 'opacity-100' : 'opacity-0'}`} 
      />

      <div className="relative z-10 flex-none p-4 pb-2 shadow-sm bg-white/80 backdrop-blur-md rounded-b-2xl">
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-medium text-txt">Trash Detection</h2>
            <span className="text-gold font-bold text-lg">+{totalXP} XP</span>
         </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        {phase === "camera" && (
          <div className="h-full flex flex-col justify-end pb-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 text-center shadow-2xl mx-auto w-full max-w-sm animate-slide-up">
              <p className="text-sm font-semibold text-txt-light mb-4">
                Point your camera at a messy area on the floor to begin mapping trash.
              </p>
              <button
                onClick={scanTrash}
                className="w-full py-4 bg-green-500 text-white rounded-full font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg"
              >
                <span className="text-2xl">📸</span> Detect Trash
              </button>
            </div>
          </div>
        )}

        {phase === "scanning" && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl animate-fade-in max-w-sm w-full mx-auto">
              <div className="text-7xl mb-6 animate-bounce">🦝</div>
              <h3 className="text-2xl font-display text-txt mb-2">Analyzing scene...</h3>
              <p className="text-txt-light font-medium animate-pulse">Rascal is sniffing out the mess.</p>
            </div>
          </div>
        )}

        {phase === "list" && (
          <div className="space-y-4 pt-2">
            
            {pending.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence>
                  {pending.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, overflow: "hidden" }}
                      transition={{ duration: 0.3, type: "spring" }}
                      className="flex flex-col gap-3 p-4 bg-white/95 backdrop-blur-md shadow-lg rounded-2xl"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-txt text-lg capitalize mb-0.5">{item.label}</p>
                          <p className="text-sm font-semibold text-txt-light">
                            {item.isTrash ? `Trash • +${XP_PER_ITEM} XP` : "Not Trash • No XP"}
                          </p>
                        </div>
                        <span className="text-3xl drop-shadow-sm">{item.isTrash ? '🗑️' : '🛋️'}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => markDone(item.id)}
                          className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-md active:translate-y-1 transition-all"
                        >
                          ✓ Done
                        </button>
                        {item.isTrash && (
                          <button
                            onClick={() => markNotTrash(item.id)}
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-sm font-bold active:translate-y-1 transition-all"
                          >
                            × Ignore
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {done.length > 0 && pending.length > 0 && (
              <div className="mt-8">
                <h4 className="font-bold text-white uppercase text-xs mb-3 ml-2 drop-shadow-md">Completed</h4>
                <div className="space-y-2 opacity-80">
                  {done.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10"
                    >
                      <p className="capitalize font-medium text-white line-through">{item.label}</p>
                      <span className="text-green-400 font-bold">{item.status === 'not-trash' ? 'Ignored' : '✓'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allCleared && trashItems.length > 0 && (
              <div className="text-center py-10 space-y-4 animate-bounce-in bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mt-10">
                <p className="text-6xl drop-shadow-md">🎉</p>
                <div>
                  <h3 className="text-2xl font-display text-txt">Area Cleared!</h3>
                  <p className="font-medium text-txt-light">You earned {totalXP} XP from this area.</p>
                </div>
                <div className="flex flex-col gap-3 max-w-[200px] mx-auto mt-6">
                  <button
                    onClick={handleFinishQuest}
                    className="btn-3d btn-green w-full"
                  >
                    Finish Quest
                  </button>
                  <button
                    onClick={resetCamera}
                    className="py-3 px-6 bg-gray-100 text-txt-light font-bold rounded-2xl active:scale-95 transition-transform"
                  >
                    Scan Another Area
                  </button>
                </div>
              </div>
            )}

            {trashItems.length === 0 && (
              <div className="text-center py-10 space-y-4 animate-bounce-in bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mt-10">
                <p className="text-6xl drop-shadow-md">✨</p>
                <div>
                  <h3 className="text-2xl font-display text-txt">Looking clean!</h3>
                  <p className="text-txt-light font-medium">No trash detected. Rascal is impressed.</p>
                </div>
                <div className="flex flex-col gap-3 max-w-[200px] mx-auto mt-6">
                  <button
                    onClick={handleFinishQuest}
                    className="btn-3d btn-green w-full"
                  >
                    Finish Quest
                  </button>
                  <button
                    onClick={resetCamera}
                    className="py-3 px-6 bg-gray-100 text-txt-light font-bold rounded-2xl active:scale-95 transition-transform"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
