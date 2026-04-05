"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes break
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes long break

type Mode = "work" | "break" | "longBreak";

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("work");
  const [totalSeconds, setTotalSeconds] = useState(WORK_DURATION);
  const [remaining, setRemaining] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advanceMode = useCallback(
    (skip: boolean) => {
      setIsRunning(false);
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

  // Handle session completion
  useEffect(() => {
    if (remaining === 0 && isRunning) {
      advanceMode(false);
    }
  }, [remaining, isRunning, advanceMode]);

  // Timer tick
  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalRef.current!);
    }
  }, [isRunning, remaining]);

  // Cleanup on unmount
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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center">
        {/* Title */}
        <h1 className="text-2xl font-light text-gray-500 tracking-wider uppercase mb-8">
          Pomodoro
        </h1>

        {/* Session dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < sessions % 4 ? "bg-rose-500" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Mode label */}
        <div className="text-sm text-gray-500 mb-4">{modeLabel}</div>

        {/* Timer display with progress bar */}
        <div className="relative mb-8">
          <div
            className="text-8xl font-extralight tabular-nums text-rose-500"
            aria-label={`${formatTime(remaining)} remaining`}
          >
            {formatTime(remaining)}
          </div>
          {/* Progress bar */}
          <div className="w-64 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={start}
            disabled={isRunning || remaining === 0}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-500 active:scale-95"
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
