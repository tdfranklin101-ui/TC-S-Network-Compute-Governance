"use client";
import { useEffect, useState } from "react";

type Props = { children: React.ReactNode };

function seededRandom(seed: number) {
  // simple LCG
  const m = 0x80000000;
  const a = 1103515245;
  const c = 12345;
  let state = seed % m;
  return () => {
    state = (a * state + c) % m;
    return state / m;
  };
}

export default function TCSSolarBackground({ children }: Props) {
  const [seed, setSeed] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let s = window.localStorage.getItem("tcsWaveSeed");
    if (!s) {
      s = String(Math.floor(Math.random() * 1000000));
      window.localStorage.setItem("tcsWaveSeed", s);
    }
    setSeed(Number(s));
  }, []);

  if (seed === null) {
    return <>{children}</>;
  }

  const rand = seededRandom(seed);
  const waveSpeed = 6 + Math.floor(rand() * 6); // 6–12s
  const rayRotation = Math.floor(rand() * 180); // 0–180deg
  const glow = 0.4 + rand() * 0.3; // 0.4–0.7

  const style: React.CSSProperties = {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000000",
    backgroundImage: `
      radial-gradient(circle at 0% 0%, rgba(0,242,255,${glow}) 0, transparent 55%),
      radial-gradient(circle at 100% 0%, rgba(17,255,227,${glow}) 0, transparent 55%),
      radial-gradient(circle at 50% 100%, rgba(0,169,166,${glow}) 0, transparent 60%)
    `,
  };

  return (
    <div style={style} className="tcs-solar-bg">
      <div
        className="tcs-wave-layer"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(135deg, rgba(0,201,213,0.18) 0%, rgba(0,141,146,0.05) 40%, transparent 70%)",
          backgroundSize: "200% 200%",
          mixBlendMode: "screen",
          animation: `tcs-wave-drift ${waveSpeed}s ease-in-out infinite alternate`,
        }}
      />
      <div
        className="tcs-ray-layer"
        style={{
          position: "absolute",
          inset: "-20%",
          background:
            "conic-gradient(from 0deg, rgba(0,242,255,0.2), transparent, rgba(17,255,227,0.15), transparent)",
          transform: `rotate(${rayRotation}deg)`,
          mixBlendMode: "screen",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
