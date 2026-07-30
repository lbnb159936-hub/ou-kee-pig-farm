const pigNames = ["花卷", "肉松", "豆包", "旺财", "桃桃", "阿福", "小欧", "滚滚", "煤球", "奶盖"];
const pigColors = [
  { key: "peach", tone: "#f7a6ac", label: "蜜桃粉" },
  { key: "orange", tone: "#f2a15f", label: "蜜橘橙" },
  { key: "lavender", tone: "#ba9de8", label: "香芋紫" },
  { key: "mint", tone: "#83cbb0", label: "薄荷绿" },
  { key: "blue", tone: "#76b9dd", label: "晴空蓝" },
  { key: "cocoa", tone: "#a8755e", label: "可可棕" },
];

const site = document.querySelector("#site");
const farm = document.querySelector("#farm");
const pigLayer = document.querySelector("#pig-layer");
const pigCount = document.querySelector("#pig-count");
const farmStatus = document.querySelector("#farm-status");
const soundButton = document.querySelector("#sound-button");
const nightButton = document.querySelector("#night-button");

let entered = false;
let soundOn = true;
let night = false;
let pigs = [];
let count = 0;
let speechToken = 0;
let audioContext = null;
let bubble = null;

function updateCount() {
  const active = pigs.filter((pig) => !pig.grouping).length;
  pigCount.textContent = `在场 ${active}`;
  farmStatus.textContent = night ? "彩猪夜游中" : active ? "猪猪散步中" : "等你开张";
}

function showBubble(x, y, text, duration = 1050) {
  if (bubble) bubble.remove();
  bubble = document.createElement("div");
  bubble.className = "o-sang";
  bubble.textContent = text;
  bubble.style.left = `${x}%`;
  bubble.style.top = `${y}%`;
  pigLayer.appendChild(bubble);
  window.setTimeout(() => {
    bubble?.remove();
    bubble = null;
  }, duration);
}

function speakOusang() {
  if (!soundOn || !("speechSynthesis" in window)) return;
  const token = ++speechToken;
  const contours = [
    { first: 0.72, second: 1.35, rate: 0.72 },
    { first: 1.28, second: 0.78, rate: 0.8 },
    { first: 0.9, second: 1.58, rate: 0.67 },
    { first: 1.15, second: 1.05, rate: 0.88 },
  ];
  const contour = contours[count % contours.length];
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
  const first = new SpeechSynthesisUtterance("欧——");
  const second = new SpeechSynthesisUtterance("桑！");
  [first, second].forEach((part) => {
    part.lang = "zh-CN";
    part.voice = chineseVoice || null;
    part.volume = 1;
  });
  first.rate = contour.rate;
  first.pitch = contour.first;
  second.rate = contour.rate + 0.08;
  second.pitch = contour.second;
  window.speechSynthesis.cancel();
  first.onend = () => {
    if (speechToken === token) window.speechSynthesis.speak(second);
  };
  window.speechSynthesis.speak(first);
}

function pigOink(startAt, pitch) {
  if (!audioContext) return;
  const gain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  const wobble = audioContext.createOscillator();
  const wobbleGain = audioContext.createGain();
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
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  wobble.start(startAt);
  oscillator.stop(startAt + 0.34);
  wobble.stop(startAt + 0.34);
}

function playPigChorus() {
  if (!soundOn || !("AudioContext" in window)) return;
  audioContext ||= new AudioContext();
  audioContext.resume();
  const now = audioContext.currentTime + 0.03;
  [0, 0.13, 0.27, 0.41].forEach((delay, index) => pigOink(now + delay, 0.9 + index * 0.08));
}

function chooseColor() {
  const active = pigs.filter((pig) => !pig.grouping && !pig.golden);
  const almostGroup = pigColors.filter((color) =>
    active.filter((pig) => pig.color.key === color.key).length === 3
  );
  if (almostGroup.length && Math.random() < 0.48) {
    return almostGroup[Math.floor(Math.random() * almostGroup.length)];
  }
  return pigColors[Math.floor(Math.random() * pigColors.length)];
}

function makePigElement(pig) {
  const element = document.createElement("div");
  element.className = `pig${pig.golden ? " golden" : ""}`;
  element.title = `${pig.name} · ${pig.color.label}`;
  element.style.left = `${pig.x}%`;
  element.style.top = `${pig.y}%`;
  element.style.width = `${pig.size}px`;
  element.style.height = `${pig.size * 0.72}px`;
  element.style.setProperty("--pig", pig.color.tone);
  element.style.setProperty("--rot", `${pig.rotate}deg`);
  element.style.setProperty("--walk-x", `${pig.walkX}px`);
  element.style.setProperty("--walk-y", `${pig.walkY}px`);
  element.style.setProperty("--walk-time", `${pig.walkTime}s`);
  element.innerHTML = `
    <div class="pig-shape">
      <div class="pig-body">
        <span class="pig-spot"></span><span class="pig-tail"></span>
        <span class="pig-leg leg-one"></span><span class="pig-leg leg-two"></span>
      </div>
      <div class="pig-head">
        <span class="pig-ear ear-one"></span><span class="pig-ear ear-two"></span>
        <span class="pig-eye eye-one"></span><span class="pig-eye eye-two"></span>
        <span class="pig-snout"><i></i><i></i></span>
      </div>
      <span class="pig-name">${pig.name} · ${pig.color.label}</span>
    </div>`;
  pigLayer.appendChild(element);
  pig.element = element;
}

function groupAndFly(flock, color) {
  const centerX = flock.reduce((sum, pig) => sum + pig.x, 0) / 4;
  const centerY = flock.reduce((sum, pig) => sum + pig.y, 0) / 4;
  const flyX = centerX < 50 ? 115 : -115;
  flock.forEach((pig) => {
    pig.grouping = true;
    pig.element.classList.add("grouping");
    pig.element.style.setProperty("--group-x", `${centerX - pig.x}vw`);
    pig.element.style.setProperty("--group-y", `${centerY - pig.y}vh`);
    pig.element.style.setProperty("--fly-x", `${flyX}vw`);
  });
  showBubble(centerX, centerY - 8, `${color.label}四连！起飞！`, 2500);
  window.setTimeout(playPigChorus, 620);
  window.setTimeout(() => {
    flock.forEach((pig) => pig.element.remove());
    pigs = pigs.filter((pig) => !flock.includes(pig));
    updateCount();
  }, 3000);
}

function addPig(event) {
  if (!entered || event.target.closest("button")) return;
  const rect = farm.getBoundingClientRect();
  count += 1;
  const golden = count % 17 === 0;
  const x = Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(43, Math.min(87, ((event.clientY - rect.top) / rect.height) * 100));
  const color = golden ? { key: "gold", tone: "#efbd3d", label: "欧气金" } : chooseColor();
  const pig = {
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
    grouping: false,
  };
  makePigElement(pig);
  pigs.push(pig);

  const matching = pigs.filter((item) =>
    item !== pig && !item.grouping && !item.golden && item.color.key === color.key
  ).slice(-3);
  if (!golden && matching.length === 3) {
    groupAndFly([...matching, pig], color);
  } else {
    const cries = ["欧↗桑！", "欧～桑↘", "欧↘桑↗！", "欧——桑！"];
    showBubble(x, y - 10, cries[count % cries.length]);
  }
  speakOusang();
  updateCount();

  const quietPigs = pigs.filter((item) => !item.grouping);
  if (quietPigs.length > 52) {
    const oldest = quietPigs[0];
    oldest.element.remove();
    pigs = pigs.filter((item) => item !== oldest);
  }
}

document.querySelector("#enter-button").addEventListener("click", () => {
  entered = true;
  site.classList.add("is-entered");
  window.setTimeout(speakOusang, 250);
});

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.textContent = soundOn ? "声" : "静";
  soundButton.setAttribute("aria-label", soundOn ? "关闭声音" : "开启声音");
  if (!soundOn) window.speechSynthesis?.cancel();
});

nightButton.addEventListener("click", () => {
  night = !night;
  site.classList.toggle("is-night", night);
  nightButton.textContent = night ? "日" : "月";
  nightButton.setAttribute("aria-label", night ? "切换白天" : "切换夜晚");
  updateCount();
});

farm.addEventListener("pointerdown", addPig);
