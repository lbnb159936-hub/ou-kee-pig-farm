"use client";

import { useEffect, useRef, useState } from "react";

type PigColor = { key: string; tone: string; label: string };

type Pig = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotate: number;
  color: PigColor;
  name: string;
  golden: boolean;
  walkX: number;
  walkY: number;
  walkTime: number;
  grouping?: boolean;
  groupX?: number;
  groupY?: number;
  flyX?: number;
};

const pigNames = ["花卷", "肉松", "豆包", "旺财", "桃桃", "阿福", "小欧", "滚滚", "煤球", "奶盖"];
const pigColors: PigColor[] = [
  { key: "peach", tone: "#f7a6ac", label: "蜜桃粉" },
  { key: "orange", tone: "#f2a15f", label: "蜜橘橙" },
  { key: "lavender", tone: "#ba9de8", label: "香芋紫" },
  { key: "mint", tone: "#83cbb0", label: "薄荷绿" },
  { key: "blue", tone: "#76b9dd", label: "晴空蓝" },
  { key: "cocoa", tone: "#a8755e", label: "可可棕" },
];

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [pigs, setPigs] = useState<Pig[]>([]);
  const [night, setNight] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [bubble, setBubble] = useState<{ x: number; y: number; id: number; text: string } | null>(null);
  const farmRef = useRef<HTMLElement>(null);
  const pigsRef = useRef<Pig[]>([]);
  const pigCounter = useRef(0);
  const speechToken = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      audioContext.current?.close();
    };
  }, []);

  function updatePigs(next: Pig[]) {
    pigsRef.current = next;
    setPigs(next);
  }

  function speakOusang() {
    if (!soundOn || !("speechSynthesis" in window)) return;
    const token = ++speechToken.current;
    const contours = [
      { first: 0.72, second: 1.35, rate: 0.72 },
      { first: 1.28, second: 0.78, rate: 0.8 },
      { first: 0.9, second: 1.58, rate: 0.67 },
      { first: 1.15, second: 1.05, rate: 0.88 },
    ];
    const contour = contours[pigCounter.current % contours.length];
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
    const first = new SpeechSynthesisUtterance("欧——");
    const second = new SpeechSynthesisUtterance("桑！");
    [first, second].forEach((part) => {
      part.lang = "zh-CN";
      part.voice = chineseVoice ?? null;
      part.volume = 1;
    });
    first.rate = contour.rate;
    first.pitch = contour.first;
    second.rate = contour.rate + 0.08;
    second.pitch = contour.second;
    window.speechSynthesis.cancel();
    first.onend = () => {
      if (speechToken.current === token) window.speechSynthesis.speak(second);
    };
    window.speechSynthesis.speak(first);
  }

  function pigOink(startAt: number, pitch: number) {
    const context = audioContext.current;
    if (!context) return;
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const wobble = context.createOscillator();
    const wobbleGain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220 * pitch, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(105 * pitch, startAt + 0.28);
    wobble.frequency.value = 27;
    wobbleGain.gain.value = 35;
    wobble.connect(wobbleGain);
    wobbleGain.connect(oscillator.frequency);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.32);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    wobble.start(startAt);
    oscillator.stop(startAt + 0.34);
    wobble.stop(startAt + 0.34);
  }

  function playPigChorus() {
    if (!soundOn || !("AudioContext" in window)) return;
    audioContext.current ??= new AudioContext();
    void audioContext.current.resume();
    const now = audioContext.current.currentTime + 0.03;
    [0, 0.13, 0.27, 0.41].forEach((delay, index) => pigOink(now + delay, 0.9 + index * 0.08));
  }

  function chooseColor(current: Pig[]) {
    const active = current.filter((pig) => !pig.grouping && !pig.golden);
    const almostGroup = pigColors.filter((color) => active.filter((pig) => pig.color.key === color.key).length === 3);
    if (almostGroup.length && Math.random() < 0.48) {
      return almostGroup[Math.floor(Math.random() * almostGroup.length)];
    }
    return pigColors[Math.floor(Math.random() * pigColors.length)];
  }

  function addPig(event: React.PointerEvent<HTMLElement>) {
    if (!entered) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    const rect = farmRef.current?.getBoundingClientRect();
    if (!rect) return;

    pigCounter.current += 1;
    const count = pigCounter.current;
    const golden = count % 17 === 0;
    const x = Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(43, Math.min(87, ((event.clientY - rect.top) / rect.height) * 100));
    const current = pigsRef.current.filter((pig) => !pig.grouping).slice(-47);
    const color = golden ? { key: "gold", tone: "#efbd3d", label: "欧气金" } : chooseColor(current);
    const pig: Pig = {
      id: Date.now() + count,
      x,
      y,
      size: 60 + Math.round(Math.random() * 34),
      rotate: -7 + Math.random() * 14,
      color,
      name: golden ? "金欧桑" : pigNames[Math.floor(Math.random() * pigNames.length)],
      golden,
      walkX: 18 + Math.round(Math.random() * 46),
      walkY: -9 + Math.round(Math.random() * 18),
      walkTime: 2.6 + Math.random() * 3.6,
    };

    const matching = current.filter((item) => item.color.key === color.key && !item.golden).slice(-3);
    if (!golden && matching.length === 3) {
      const flock = [...matching, pig];
      const centerX = flock.reduce((sum, item) => sum + item.x, 0) / 4;
      const centerY = flock.reduce((sum, item) => sum + item.y, 0) / 4;
      const flockIds = new Set(flock.map((item) => item.id));
      const flyX = centerX < 50 ? 115 : -115;
      const groupedPig = (item: Pig): Pig => ({
        ...item,
        grouping: true,
        groupX: centerX - item.x,
        groupY: centerY - item.y,
        flyX,
      });
      const next = [...current.map((item) => flockIds.has(item.id) ? groupedPig(item) : item), groupedPig(pig)];
      updatePigs(next);
      setBubble({ x: centerX, y: centerY - 8, id: pig.id, text: `${color.label}四连！起飞！` });
      window.setTimeout(playPigChorus, 620);
      window.setTimeout(() => {
        updatePigs(pigsRef.current.filter((item) => !flockIds.has(item.id)));
        setBubble((value) => value?.id === pig.id ? null : value);
      }, 3000);
    } else {
      updatePigs([...current, pig]);
      const cries = ["欧↗桑！", "欧～桑↘", "欧↘桑↗！", "欧——桑！"];
      setBubble({ x, y: y - 10, id: pig.id, text: cries[count % cries.length] });
      window.setTimeout(() => setBubble((value) => value?.id === pig.id ? null : value), 1050);
    }
    speakOusang();
  }

  function enterFarm() {
    setEntered(true);
    window.setTimeout(speakOusang, 250);
  }

  return (
    <main className={`site ${entered ? "is-entered" : ""} ${night ? "is-night" : ""}`}>
      <section className="farm" ref={farmRef} onPointerDown={addPig} aria-label="欧记趣味养猪场，点击空地召唤彩色小猪">
        <div className="sky">
          <div className="sun" />
          <div className="cloud cloud-one" />
          <div className="cloud cloud-two" />
          <div className="hills hills-back" />
          <div className="hills hills-front" />
        </div>

        <div className="barn" aria-hidden="true">
          <div className="barn-roof" />
          <div className="barn-body"><span className="barn-mark">欧</span><div className="barn-door" /></div>
        </div>
        <div className="windmill" aria-hidden="true">
          <div className="windmill-wheel"><i /><i /><i /><i /></div><div className="windmill-post" />
        </div>
        <div className="fence fence-left" aria-hidden="true" />
        <div className="fence fence-right" aria-hidden="true" />

        <header className="farm-topbar">
          <div className="mini-brand"><span>欧</span> 欧记猪肉牧场</div>
          <div className="controls">
            <a className="top-game-link" href="/game">玩游戏</a>
            <div className="pig-count" aria-live="polite">在场 {pigs.filter((pig) => !pig.grouping).length}</div>
            <button type="button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭声音" : "开启声音"}>{soundOn ? "声" : "静"}</button>
            <button type="button" onClick={() => setNight((value) => !value)} aria-label={night ? "切换白天" : "切换夜晚"}>{night ? "日" : "月"}</button>
          </div>
        </header>

        <div className="instruction">
          <span>轻点牧场 · 召唤彩色小猪</span>
          <strong>同色四只，抱团起飞</strong>
          <small>小猪会自己散步，听见猪叫就抬头看</small>
        </div>

        <div className="pig-layer" aria-live="polite">
          {pigs.map((pig) => (
            <div
              key={pig.id}
              className={`pig ${pig.golden ? "golden" : ""} ${pig.grouping ? "grouping" : ""}`}
              style={{
                left: `${pig.x}%`,
                top: `${pig.y}%`,
                width: pig.size,
                height: pig.size * 0.72,
                "--pig": pig.color.tone,
                "--rot": `${pig.rotate}deg`,
                "--walk-x": `${pig.walkX}px`,
                "--walk-y": `${pig.walkY}px`,
                "--walk-time": `${pig.walkTime}s`,
                "--group-x": `${pig.groupX ?? 0}vw`,
                "--group-y": `${pig.groupY ?? 0}vh`,
                "--fly-x": `${pig.flyX ?? 0}vw`,
              } as React.CSSProperties}
              title={`${pig.name} · ${pig.color.label}`}
            >
              <div className="pig-shape">
                <div className="pig-body">
                  <span className="pig-spot" /><span className="pig-tail" />
                  <span className="pig-leg leg-one" /><span className="pig-leg leg-two" />
                </div>
                <div className="pig-head">
                  <span className="pig-ear ear-one" /><span className="pig-ear ear-two" />
                  <span className="pig-eye eye-one" /><span className="pig-eye eye-two" />
                  <span className="pig-snout"><i /><i /></span>
                </div>
                <span className="pig-name">{pig.name} · {pig.color.label}</span>
              </div>
            </div>
          ))}
          {bubble && <div className="o-sang" style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}>{bubble.text}</div>}
        </div>
        <footer>牧场状态：<b>{night ? "彩猪夜游中" : pigs.length ? "猪猪散步中" : "等你开张"}</b></footer>
      </section>

      <section className="welcome" aria-hidden={entered}>
        <div className="paper-noise" />
        <p className="welcome-kicker">始于一九八八 · 新鲜好味道</p>
        <button className="logo-sign" type="button" onClick={enterFarm} aria-label="进入欧记猪肉养猪场">
          <span className="seal">欧</span>
          <span className="logo-copy"><small>OU KEE PORK CO.</small><strong>欧记猪肉</strong><em>用心养 · 放心吃</em></span>
          <span className="logo-pig" aria-hidden="true">豬</span>
        </button>
        <a className="game-launch" href="/game">
          <span>NEW · 横版肉鸽试玩</span>
          <strong>进入《欧桑大逃亡》</strong>
          <em>今晚不加菜 →</em>
        </a>
        <p className="tap-hint"><span /> 点击招牌 · 入场赶猪 <span /></p>
        <div className="welcome-stamp">每日<br />新鲜</div>
      </section>
    </main>
  );
}
