"use client";

import { useEffect, useRef, useState } from "react";

type Pig = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotate: number;
  tone: string;
  name: string;
  golden: boolean;
};

const pigNames = ["花卷", "肉松", "豆包", "旺财", "桃桃", "阿福", "小欧", "滚滚"];
const pigTones = ["#f7a6ac", "#f28c98", "#ffc0c4", "#eaa0a9", "#f8b2a2"];

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [pigs, setPigs] = useState<Pig[]>([]);
  const [night, setNight] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [bubble, setBubble] = useState<{ x: number; y: number; id: number } | null>(null);
  const farmRef = useRef<HTMLElement>(null);
  const pigCounter = useRef(0);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function speak() {
    if (!soundOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance("欧桑");
    voice.lang = "zh-CN";
    voice.rate = 0.8;
    voice.pitch = 1.12;
    window.speechSynthesis.speak(voice);
  }

  function addPig(event: React.PointerEvent<HTMLElement>) {
    if (!entered) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    const rect = farmRef.current?.getBoundingClientRect();
    if (!rect) return;

    pigCounter.current += 1;
    const count = pigCounter.current;
    const golden = count % 10 === 0;
    const x = Math.max(6, Math.min(94, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(43, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100));
    const pig: Pig = {
      id: Date.now() + count,
      x,
      y,
      size: 62 + Math.round(Math.random() * 32),
      rotate: -7 + Math.random() * 14,
      tone: golden ? "#f2bf3f" : pigTones[count % pigTones.length],
      name: golden ? "金欧桑" : pigNames[count % pigNames.length],
      golden,
    };
    setPigs((current) => [...current.slice(-39), pig]);
    setBubble({ x, y, id: pig.id });
    window.setTimeout(() => setBubble((current) => (current?.id === pig.id ? null : current)), 900);
    speak();
  }

  function enterFarm() {
    setEntered(true);
    window.setTimeout(speak, 250);
  }

  return (
    <main className={`site ${entered ? "is-entered" : ""} ${night ? "is-night" : ""}`}>
      <section
        className="farm"
        ref={farmRef}
        onPointerDown={addPig}
        aria-label="欧记趣味养猪场，点击空地召唤小猪"
      >
        <div className="sky">
          <div className="sun" />
          <div className="cloud cloud-one" />
          <div className="cloud cloud-two" />
          <div className="hills hills-back" />
          <div className="hills hills-front" />
        </div>

        <div className="barn" aria-hidden="true">
          <div className="barn-roof" />
          <div className="barn-body">
            <span className="barn-mark">欧</span>
            <div className="barn-door" />
          </div>
        </div>

        <div className="windmill" aria-hidden="true">
          <div className="windmill-wheel"><i /><i /><i /><i /></div>
          <div className="windmill-post" />
        </div>

        <div className="fence fence-left" aria-hidden="true" />
        <div className="fence fence-right" aria-hidden="true" />

        <header className="farm-topbar">
          <div className="mini-brand"><span>欧</span> 欧记猪肉牧场</div>
          <div className="controls">
            <div className="pig-count" aria-live="polite">猪猪 {pigs.length}</div>
            <button type="button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭声音" : "开启声音"}>
              {soundOn ? "声" : "静"}
            </button>
            <button type="button" onClick={() => setNight((value) => !value)} aria-label={night ? "切换白天" : "切换夜晚"}>
              {night ? "日" : "月"}
            </button>
          </div>
        </header>

        <div className="instruction">
          <span>轻点牧场任意位置</span>
          <strong>召唤一头欧桑小猪</strong>
          <small>每第 10 头会有惊喜</small>
        </div>

        <div className="pig-layer" aria-live="polite">
          {pigs.map((pig) => (
            <div
              key={pig.id}
              className={`pig ${pig.golden ? "golden" : ""}`}
              style={{
                left: `${pig.x}%`,
                top: `${pig.y}%`,
                width: pig.size,
                height: pig.size * 0.72,
                transform: `translate(-50%, -50%) rotate(${pig.rotate}deg)`,
                "--pig": pig.tone,
              } as React.CSSProperties}
              title={pig.name}
            >
              <div className="pig-body">
                <span className="pig-spot" />
                <span className="pig-tail" />
                <span className="pig-leg leg-one" />
                <span className="pig-leg leg-two" />
              </div>
              <div className="pig-head">
                <span className="pig-ear ear-one" />
                <span className="pig-ear ear-two" />
                <span className="pig-eye eye-one" />
                <span className="pig-eye eye-two" />
                <span className="pig-snout"><i /><i /></span>
              </div>
              <span className="pig-name">{pig.name}</span>
            </div>
          ))}
          {bubble && <div className="o-sang" style={{ left: `${bubble.x}%`, top: `${bubble.y - 10}%` }}>欧桑！</div>}
        </div>

        <footer>今日牧场心情：<b>{night ? "晚风正好" : pigs.length ? "猪气满满" : "等你开张"}</b></footer>
      </section>

      <section className="welcome" aria-hidden={entered}>
        <div className="paper-noise" />
        <p className="welcome-kicker">始于一九八八 · 新鲜好味道</p>
        <button className="logo-sign" type="button" onClick={enterFarm} aria-label="进入欧记猪肉养猪场">
          <span className="seal">欧</span>
          <span className="logo-copy">
            <small>OU KEE PORK CO.</small>
            <strong>欧记猪肉</strong>
            <em>用心养 · 放心吃</em>
          </span>
          <span className="logo-pig" aria-hidden="true">豬</span>
        </button>
        <p className="tap-hint"><span /> 点击招牌 · 入场赶猪 <span /></p>
        <div className="welcome-stamp">每日<br />新鲜</div>
      </section>
    </main>
  );
}
