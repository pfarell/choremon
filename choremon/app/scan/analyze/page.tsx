'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Rascal from '@/components/Rascal';
import { CHORE_TYPES } from '@/lib/constants';
import { ChoreType, AnalyzeResponse } from '@/lib/types';
import { playScanStart } from '@/lib/sounds';
import { isRelevantObject, getChoreLabel } from '@/lib/chore-objects';

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
  label: string;
  color: string;
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const choreType = (searchParams.get('type') as ChoreType) || 'vacuum';
  const choreInfo = CHORE_TYPES.find(c => c.id === choreType);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<unknown>(null);
  const animFrameRef = useRef<number>(0);

  const [analyzing, setAnalyzing] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [statusText, setStatusText] = useState('Initializing camera...');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatusText('Loading AI model...');
    } catch {
      setCameraError('Camera access denied. Please allow camera access and try again.');
    }
  }, []);

  const loadModel = useCallback(async () => {
    try {
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      await import('@tensorflow/tfjs');
      const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      modelRef.current = model;
      setStatusText('Scanning...');
      return model;
    } catch (e) {
      console.error('Failed to load TF.js model:', e);
      setStatusText('Analyzing...');
      return null;
    }
  }, []);

  const detectLoop = useCallback(async (model: { detect: (video: HTMLVideoElement) => Promise<Array<{ bbox: [number, number, number, number]; class: string; score: number }>> }) => {
    if (!videoRef.current || videoRef.current.paused) return;

    try {
      const predictions = await model.detect(videoRef.current);
      const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF4B4B'];
      
      const mapped: Detection[] = predictions
        .filter(p => p.score > 0.4)
        .slice(0, 8)
        .map((p, i) => ({
          bbox: p.bbox,
          class: p.class,
          score: p.score,
          label: isRelevantObject(p.class, choreType)
            ? getChoreLabel(p.class, choreType)
            : `${p.class}`,
          color: colors[i % colors.length],
        }));

      setDetections(mapped);
    } catch {
      // Ignore detection errors
    }

    animFrameRef.current = requestAnimationFrame(() => detectLoop(model));
  }, [choreType]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);
    setStatusText('Rascal is scanning...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, choreType }),
      });

      const data: AnalyzeResponse = await response.json();

      // Stop camera & detection
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(animFrameRef.current);

      // Store result in sessionStorage and navigate
      sessionStorage.setItem('choremon-scan-result', JSON.stringify(data));
      sessionStorage.setItem('choremon-scan-choretype', choreType);
      router.push('/scan/result');
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback with generic spots
      const fallback: AnalyzeResponse = {
        spots: [
          { label: 'Dirty corner', xp: 30, position: 'bottom-left', difficulty: 'easy' },
          { label: 'Dusty surface', xp: 40, position: 'center', difficulty: 'medium' },
          { label: 'Messy area', xp: 50, position: 'top-right', difficulty: 'hard' },
        ],
        totalSpots: 3,
        overallCleanliness: 5,
        roast: "I tried to analyze your room but even my AI brain short-circuited from the mess! 💀",
        encouragement: "Let's clean up anyway — every spot counts!",
      };
      sessionStorage.setItem('choremon-scan-result', JSON.stringify(fallback));
      sessionStorage.setItem('choremon-scan-choretype', choreType);
      router.push('/scan/result');
    }
  }, [choreType, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const init = async () => {
      playScanStart();
      await startCamera();
      const model = await loadModel();

      if (model) {
        detectLoop(model as { detect: (video: HTMLVideoElement) => Promise<Array<{ bbox: [number, number, number, number]; class: string; score: number }>> });
      }

      // Auto-capture after 3 seconds
      timer = setTimeout(() => {
        captureAndAnalyze();
      }, 3000);
    };

    init();

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (cameraError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg">
        <Rascal size="lg" className="mb-4" />
        <h2 className="font-display text-xl text-txt text-center mb-2">Camera Access Needed</h2>
        <p className="text-sm text-txt-light text-center font-semibold mb-6">{cameraError}</p>
        <button onClick={() => router.back()} className="btn-3d btn-green">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scan Line */}
      {analyzing && <div className="scan-line" />}

      {/* Detection Boxes */}
      {detections.map((det, i) => {
        const video = videoRef.current;
        if (!video) return null;
        const scaleX = window.innerWidth / (video.videoWidth || 1);
        const scaleY = window.innerHeight / (video.videoHeight || 1);
        return (
          <div key={i}>
            <div
              className="detection-box"
              style={{
                left: det.bbox[0] * scaleX,
                top: det.bbox[1] * scaleY,
                width: det.bbox[2] * scaleX,
                height: det.bbox[3] * scaleY,
                borderColor: det.color,
              }}
            >
              <div className="detection-label" style={{ background: det.color }}>
                {det.label}
              </div>
            </div>
          </div>
        );
      })}

      {/* Top Status Pill */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
        <div className="frosted rounded-full px-5 py-2.5 flex items-center gap-3 shadow-lg">
          <div className="animate-spin-slow w-5 h-5 rounded-full border-2 border-green-primary border-t-transparent" />
          <span className="text-sm font-bold text-txt">{statusText}</span>
          <span className="text-lg">{choreInfo?.emoji}</span>
        </div>
      </div>

      {/* Rascal Corner */}
      <div className="absolute bottom-20 right-4 z-30">
        <Rascal size="md" />
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="frosted rounded-full px-4 py-2 shadow-lg">
          <p className="text-xs font-semibold text-txt-light">Point at the area to clean</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="animate-spin-slow text-4xl">🦝</div>
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
