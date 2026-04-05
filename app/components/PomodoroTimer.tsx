"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

type Mode = "work" | "break" | "longBreak";

function playCountdownBeep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

function playEndSound() {
  const ctx = new AudioContext();
  [0, 0.25, 0.5].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1047 + i * 131;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.5);
  });
  setTimeout(() => {
    const ctx2 = new AudioContext();
    const osc = ctx2.createOscillator();
    const gain = ctx2.createGain();
    osc.connect(gain);
    gain.connect(ctx2.destination);
    osc.type = "triangle";
    osc.frequency.value = 1318;
    gain.gain.setValueAtTime(0.5, ctx2.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 1.2);
    osc.start(ctx2.currentTime);
    osc.stop(ctx2.currentTime + 1.2);
  }, 800);
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("work");
  const [totalSeconds, setTotalSeconds] = useState(WORK_DURATION);
  const [remaining, setRemaining] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownPlayedRef = useRef<Set<number>>(new Set());

  const advanceMode = useCallback(
    (skip: boolean) => {
      setIsRunning(false);
      countdownPlayedRef.current.clear();
      if (mode === "work") {
        const newSessions = skip ? sessions : sessions + 1;
        setSessions(newSessions);
        if (newSessions % 4 === 0) {
          setMode("longBreak");
          setTotalSeconds(LONG_BREAK_DURATION);
          setRemaining(LONG_BREAK_DURATION);
        } else {
          setMode("break");
          setTotalSeconds(BREAK_DURATION);
          setRemaining(BREAK_DURATION);
        }
      } else {
        setMode("work");
        setTotalSeconds(WORK_DURATION);
        setRemaining(WORK_DURATION);
      }
    },
    [mode, sessions]
  );

  useEffect(() => {
    if (remaining === 0 && isRunning) {
      playEndSound();
      advanceMode(false);
    }
  }, [remaining, isRunning, advanceMode]);

  useEffect(() => {
    if (isRunning && remaining > 0 && remaining <= 5) {
      const key = remaining;
      if (!countdownPlayedRef.current.has(key)) {
        countdownPlayedRef.current.add(key);
        playCountdownBeep();
      }
    }
  }, [remaining, isRunning]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalRef.current!);
    }
  }, [isRunning, remaining]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const start = () => {
    if (remaining > 0 && !isRunning) {
      countdownPlayedRef.current.clear();
      setIsRunning(true);
    }
  };

  const pause = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setIsRunning(false);
    countdownPlayedRef.current.clear();
    setMode("work");
    setTotalSeconds(WORK_DURATION);
    setRemaining(WORK_DURATION);
    setSessions(0);
  };

  const skip = () => {
    advanceMode(true);
  };

  const modeLabel = mode === "work" ? "Focus Time" : mode === "break" ? "Short Break" : "Long Break";
  const progress = totalSeconds === 0 ? 0 : ((totalSeconds - remaining) / totalSeconds) * 100;
  const isCountdown = remaining > 0 && remaining <= 5;
  const p = progress / 100;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-light text-gray-500 tracking-wider uppercase mb-8">
          Pomodoro
        </h1>

        {/* Timer on top */}
        <div className="mb-1">
          <div
            className={`text-4xl font-extralight tabular-nums transition-colors ${
              isCountdown
                ? "text-amber-400 animate-pulse"
                : "text-amber-100/90"
            }`}
          >
            {formatTime(remaining)}
          </div>
          {isCountdown && (
            <div className="text-xs text-amber-500 mt-1 animate-pulse">
              {remaining}...
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < sessions % 4 ? "bg-amber-400" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-6">{modeLabel}</div>

        {/* Hourglass */}
        <div className="relative mb-4 flex items-center justify-center">
          <svg
            viewBox="0 0 200 280"
            className="w-48 h-64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Sand color with subtle gradient */}
              <linearGradient id="topSand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#e8a020" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="bottomSand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8a020" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
              </linearGradient>
              {/* Glass clip path for sand */}
              <clipPath id="glassClip">
                {/* Top bulb */}
                <path
                  d="M 40 20 Q 40 80 90 135 L 90 140 L 110 140 L 110 135 Q 160 80 160 20 L 40 20 Z"
                />
                {/* Bottom bulb */}
                <path
                  d="M 40 260 Q 40 200 90 145 L 90 140 L 110 140 L 110 145 Q 160 200 160 260 L 40 260 Z"
                />
              </clipPath>
            </defs>

            {/* Glass outline - top bulb */}
            <path
              d="M 40 20 L 160 20 Q 160 80 110 135 L 110 140"
              fill="none"
              stroke="rgba(251,191,36,0.18)"
              strokeWidth="2"
            />
            <path
              d="M 160 20 L 40 20 Q 40 80 90 135 L 90 140"
              fill="none"
              stroke="rgba(251,191,36,0.18)"
              strokeWidth="2"
            />

            {/* Glass outline - bottom bulb */}
            <path
              d="M 110 140 L 110 145 Q 160 200 160 260 L 40 260"
              fill="none"
              stroke="rgba(251,191,36,0.18)"
              strokeWidth="2"
            />
            <path
              d="M 90 140 L 90 145 Q 40 200 40 260 L 160 260"
              fill="none"
              stroke="rgba(251,191,36,0.18)"
              strokeWidth="2"
            />

            {/* Glass interior fill */}
            <path
              d="M 40 20 L 160 20 Q 160 80 110 135 L 110 140 L 110 145 Q 160 200 160 260 L 40 260 Q 40 200 90 145 L 90 140 Q 90 135 40 80 Z"
              fill="rgba(251,191,36,0.02)"
            />

            {/* Inner sand shapes clipped to glass bounds */}
            <g clipPath="url(#glassClip)">
              {/* Top sand: rectangle whose bottom edge descends as time goes on */}
              {/* At p=0: sand fills from y=20 down to y=135 (full) */}
              {/* At p=1: sand is gone (bottom edge at y=20) */}
              {p < 0.98 && (
                <rect
                  x="20"
                  y={20 + p * 115}
                  width="160"
                  height={Math.max(0, 135 - p * 115)}
                  fill="url(#topSand)"
                />
              )}

              {/* Bottom sand: rectangle whose top edge descends as time goes on */}
              {/* At p=0: sand is empty (top at y=260) */}
              {/* At p=1: sand fills from y=135 to y=260 (full) */}
              {p > 0.02 && (
                <rect
                  x="20"
                  y={260 - p * 125}
                  width="160"
                  height={Math.max(0, p * 125)}
                  fill="url(#bottomSand)"
                />
              )}
            </g>

            {/* Sand drops — particles that fall every second */}
            {isRunning && remaining > 0 && p < 0.98 && (
              <g>
                {[0, 0.2, 0.4, 0.6].map((offset, i) => (
                  <circle key={i} r="1.5" fill="#fbbf24">
                    <animateMotion
                      path="M 100 140 L 100 210"
                      dur="0.8s"
                      begin={`${offset}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.85;0"
                      dur="0.8s"
                      begin={`${offset}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}

                {/* Micro-splash on impact */}
                {[-2, 0, 2].map((dx, i) => (
                  <circle key={`sp-${i}`} r="0.7" fill="#fbbf24">
                    <animateMotion
                      path={`M 100 210 L ${100 + dx * 2.5} ${197 - Math.abs(dx)} L ${100 + dx * 1.5} 188`}
                      dur="0.45s"
                      begin={`${0.12 * i + 0.2}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.45;0"
                      dur="0.45s"
                      begin={`${0.12 * i + 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>
            )}

            {/* Top wooden frame */}
            <rect x="28" y="14" width="144" height="8" rx="3" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.2)" strokeWidth="1" />
            {/* Bottom wooden frame */}
            <rect x="28" y="258" width="144" height="8" rx="3" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.2)" strokeWidth="1" />

            {/* Glass shine */}
            <line x1="48" y1="35" x2="48" y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="4" strokeLinecap="round" />
            <line x1="152" y1="170" x2="152" y2="245" stroke="rgba(255,255,255,0.04)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <div className="w-48 h-0.5 bg-gray-800 rounded-full mx-auto mb-8 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isCountdown ? "bg-amber-400" : "bg-amber-500/60"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={start}
            disabled={isRunning || remaining === 0}
            className="px-6 py-3 bg-amber-500 text-gray-950 rounded-lg font-medium hover:bg-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500 active:scale-95"
          >
            Start
          </button>
          <button
            onClick={pause}
            disabled={!isRunning}
            className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg font-medium border border-gray-700 hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            Pause
          </button>
          <button
            onClick={skip}
            disabled={!isRunning && remaining === totalSeconds}
            className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg font-medium border border-gray-700 hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            Skip
          </button>
          <button
            onClick={reset}
            className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg font-medium border border-gray-700 hover:bg-gray-700 transition active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
