(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const shell = document.querySelector("#game-shell");
  const titleScreen = document.querySelector("#title-screen");
  const startButton = document.querySelector("#start-button");
  const upgradeScreen = document.querySelector("#upgrade-screen");
  const upgradeCards = document.querySelector("#upgrade-cards");
  const endScreen = document.querySelector("#end-screen");
  const restartButton = document.querySelector("#restart-button");
  const hpText = document.querySelector("#hp-text");
  const hpBar = document.querySelector("#hp-bar");
  const roomText = document.querySelector("#room-text");
  const areaName = document.querySelector("#area-name");
  const coinText = document.querySelector("#coin-text");
  const flockGrid = document.querySelector("#flock-grid");
  const skillChip = document.querySelector("#skill-chip");
  const skillStatus = document.querySelector("#skill-status");
  const bossWrap = document.querySelector("#boss-wrap");
  const bossBar = document.querySelector("#boss-bar");
  const bossHpText = document.querySelector("#boss-hp-text");
  const toast = document.querySelector("#toast");
  const comicWord = document.querySelector("#comic-word");
  const soundToggle = document.querySelector("#sound-toggle");
  const comboText = document.querySelector("#combo-text");
  const comboChip = document.querySelector(".combo-chip");
  const threatText = document.querySelector("#threat-text");
  const threatBar = document.querySelector("#threat-bar");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND = 588;
  const WORLD_WIDTH = 3200;
  ctx.imageSmoothingEnabled = false;

  const spriteAtlas = new Image();
  spriteAtlas.src = "./sprites-v2.png";

  const colors = [
    { key: "peach", name: "蜜桃", hex: "#f59aa5", icon: "♥" },
    { key: "orange", name: "蜜橘", hex: "#f2a153", icon: "火" },
    { key: "purple", name: "香芋", hex: "#ae8dde", icon: "慢" },
    { key: "mint", name: "薄荷", hex: "#6ec6a5", icon: "愈" },
    { key: "blue", name: "晴空", hex: "#61aeda", icon: "盾" },
    { key: "cocoa", name: "可可", hex: "#9c6c58", icon: "震" },
  ];

  const areas = [
    { name: "青禾农场", sky1: "#83c8dc", sky2: "#f4d888", ground: "#5d8f43", accent: "#b43b38", kind: "farm" },
    { name: "饲料仓库", sky1: "#d38d50", sky2: "#4a2a29", ground: "#6f4933", accent: "#e2b863", kind: "warehouse" },
    { name: "夜运车队", sky1: "#193450", sky2: "#9b3f43", ground: "#293038", accent: "#55bfd1", kind: "convoy" },
    { name: "欧记加工区", sky1: "#482331", sky2: "#d04c37", ground: "#383137", accent: "#f0a548", kind: "factory" },
    { name: "屠宰场屋顶", sky1: "#141a2c", sky2: "#761f2e", ground: "#252833", accent: "#efc16e", kind: "boss" },
  ];

  const upgradePool = [
    { id: "spring", icon: "↟", title: "弹簧猪蹄", text: "跳跃更高，并获得一次空中二段跳。", tag: "机动", apply: p => { p.jumpPower += 90; p.maxJumps = 2; } },
    { id: "megaphone", icon: "吼", title: "扩音猪鼻", text: "欧桑吼范围与伤害提升，冷却缩短。", tag: "技能", apply: p => { p.shoutDamage += 16; p.shoutMaxCd = Math.max(6, p.shoutMaxCd - 2); } },
    { id: "bowl", icon: "碗", title: "祖传饭碗", text: "最大生命 +30，并立刻回满 30 点。", tag: "生存", apply: p => { p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 30); } },
    { id: "headbutt", icon: "撞", title: "铁头功章法", text: "普通撞击伤害 +10，攻击范围更远。", tag: "攻击", apply: p => { p.damage += 10; p.attackRange += 16; } },
    { id: "boots", icon: "»", title: "偷来的工靴", text: "移动速度 +12%，冲刺冷却缩短。", tag: "机动", apply: p => { p.speed *= 1.12; p.dashMaxCd = Math.max(.7, p.dashMaxCd - .25); } },
    { id: "badge", icon: "证", title: "伪造工作证", text: "敌人反应变慢，受击无敌时间增加。", tag: "诡计", apply: p => { p.sneak += .16; p.invulnBonus += .12; } },
    { id: "coupon", icon: "券", title: "夜市代金券", text: "金币掉落翻倍，每关恢复 12 点生命。", tag: "财富", apply: p => { p.coinMult += 1; p.roomHeal += 12; } },
    { id: "pepper", icon: "辣", title: "爆辣饲料", text: "撞击附带灼烧，持续造成额外伤害。", tag: "攻击", apply: p => { p.burn += 5; } },
    { id: "bell", icon: "铃", title: "放饭铃", text: "彩猪出现率提高，更容易凑齐同色四只。", tag: "小队", apply: p => { p.dropChance = Math.min(.95, p.dropChance + .2); } },
  ];

  const keys = new Set();
  let mode = "title";
  let lastTime = 0;
  let cameraX = 0;
  let room = 0;
  let roomCleared = false;
  let clearTimer = 0;
  let player;
  let enemies = [];
  let projectiles = [];
  let pickups = [];
  let particles = [];
  let floaters = [];
  let platforms = [];
  let scenery = [];
  let screenShake = 0;
  let time = 0;
  let stats;
  let soundOn = true;
  let audioCtx = null;
  let musicTimer = null;
  let musicStep = 0;
  let voiceAudio = null;
  let toastTimer = null;
  let hitStop = 0;
  let roomTime = 0;
  let runTime = 0;
  let combo = 0;
  let comboTimer = 0;
  let perfectDodges = 0;

  function makePlayer() {
    return {
      x: 140, y: GROUND - 68, w: 78, h: 66, vx: 0, vy: 0,
      speed: 370, jumpPower: 790, maxJumps: 1, jumps: 0, grounded: true,
      facing: 1, hp: 100, maxHp: 100, damage: 24, attackRange: 92,
      attackTimer: 0, attackCd: 0, attackHit: new Set(), attackStep: 0, chainWindow: 0, burn: 0,
      dashTimer: 0, dashCd: 0, dashMaxCd: 1.15,
      shoutCd: 0, shoutMaxCd: 12, shoutDamage: 34,
      invuln: 0, invulnBonus: 0, shield: 0, sneak: 0,
      coinMult: 1, roomHeal: 0, dropChance: .58,
      maxAirDash: 1, airDash: 1,
      coyote: .1, jumpBuffer: 0, dashHit: new Set(),
      flock: Object.fromEntries(colors.map(c => [c.key, 0])),
      resonance: Object.fromEntries(colors.map(c => [c.key, 0])),
    };
  }

  function resetRun() {
    player = makePlayer();
    stats = { kills: 0, rescues: 0, coins: 0, resonance: 0, maxCombo: 0, start: performance.now() };
    room = 0;
    cameraX = 0;
    time = 0;
    runTime = 0;
    roomTime = 0;
    combo = 0;
    comboTimer = 0;
    perfectDodges = 0;
    setupRoom(0);
    updateHUD();
  }

  function createPlatforms(index) {
    const patterns = [
      [[520,485,250],[980,420,220],[1420,500,280],[1930,390,230],[2400,475,280]],
      [[460,490,230],[820,400,250],[1230,470,260],[1680,370,220],[2100,455,320],[2630,390,210]],
      [[510,455,300],[1020,380,230],[1410,485,270],[1880,410,270],[2360,350,240],[2700,485,230]],
      [[440,470,230],[790,390,250],[1200,465,200],[1580,350,280],[2060,430,220],[2450,345,260]],
      [[500,440,260],[930,365,260],[1390,460,250],[1830,355,260],[2280,450,250],[2700,375,230]],
    ];
    return patterns[index].map(([x,y,w]) => ({ x, y, w, h: 22 }));
  }

  function setupScenery(index) {
    const seeded = [];
    for (let i = 0; i < 18; i++) {
      seeded.push({
        x: 100 + i * 190 + ((i * 73 + index * 41) % 95),
        y: 280 + ((i * 47 + index * 29) % 190),
        s: .65 + ((i * 17) % 45) / 100,
        kind: i % 4,
      });
    }
    return seeded;
  }

  function setupRoom(index) {
    enemies = [];
    projectiles = [];
    pickups = [];
    particles = [];
    floaters = [];
    platforms = createPlatforms(index);
    scenery = setupScenery(index);
    roomCleared = false;
    clearTimer = 0;
    roomTime = 0;
    player.x = 130;
    player.y = GROUND - player.h;
    player.vx = player.vy = 0;
    player.hp = Math.min(player.maxHp, player.hp + player.roomHeal);
    player.airDash = player.maxAirDash;
    cameraX = 0;
    const count = 6 + index * 2;
    if (index < 4) {
      for (let i = 0; i < count; i++) {
        const x = 620 + i * ((WORLD_WIDTH - 960) / Math.max(1, count - 1)) + (i % 2) * 75;
        const type = index === 0 ? "bot" : (i % 3 === 1 ? "drone" : i % 4 === 2 ? "roller" : "bot");
        spawnEnemy(type, x, type === "drone" ? 260 + (i % 2) * 70 : GROUND - 60, 1 + index * .17);
      }
      if (index >= 1 && enemies.length) {
        const elite = enemies[Math.floor(enemies.length * .66)];
        elite.elite = true;
        elite.hp *= 1.55;
        elite.maxHp = elite.hp;
        elite.damage *= 1.25;
      }
    } else {
      spawnEnemy("boss", 2530, GROUND - 135, 1);
      showToast("最终关：让分拣队长听听真正的欧桑");
    }
    areaName.textContent = areas[index].name;
    roomText.textContent = `第 ${index + 1} / 5 关`;
    bossWrap.classList.toggle("visible", index === 4);
    updateHUD();
  }

  function spawnEnemy(type, x, y, scale) {
    const spec = type === "drone"
      ? { w: 64, h: 50, hp: 38, speed: 85, damage: 11 }
      : type === "roller"
      ? { w: 70, h: 58, hp: 62, speed: 125, damage: 15 }
      : type === "boss"
      ? { w: 150, h: 135, hp: 720, speed: 105, damage: 22 }
      : { w: 62, h: 62, hp: 48, speed: 105, damage: 12 };
    enemies.push({
      type, x, y, baseY: y, ...spec,
      maxHp: spec.hp * scale,
      hp: spec.hp * scale,
      speed: spec.speed * (1 + (scale - 1) * .25),
      dir: -1, hitFlash: 0, attackCd: Math.random(),
      shootCd: 1.2 + Math.random(), dead: false, stun: 0, slow: 0,
      phase: Math.random() * Math.PI * 2, burn: 0, burnTick: 0,
      windup: 0, action: "idle", chargeTimer: 0, telegraph: 0,
    });
  }

  function ensureAudio() {
    if (!soundOn || !window.AudioContext) return null;
    audioCtx ||= new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, duration=.12, volume=.05, type="square", slide=1, delay=0) {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), now + duration);
    g.gain.setValueAtTime(.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + .012);
    g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    o.connect(g); g.connect(ac.destination);
    o.start(now); o.stop(now + duration + .02);
  }

  function sfx(name) {
    if (!soundOn) return;
    if (name === "jump") { tone(270,.11,.035,"square",1.6); }
    if (name === "attack") { tone(120,.08,.05,"sawtooth",.45); }
    if (name === "hit") { tone(88,.12,.06,"square",.5); tone(210,.06,.025,"triangle",.7,.03); }
    if (name === "coin") { tone(660,.08,.04,"sine",1.35); tone(880,.12,.035,"sine",1.1,.07); }
    if (name === "hurt") { tone(150,.24,.08,"sawtooth",.5); }
    if (name === "dash") { tone(90,.16,.06,"sawtooth",2.1); }
    if (name === "resonance") [330,440,554,660].forEach((f,i)=>tone(f,.36,.045,"triangle",1.08,i*.07));
    if (name === "boss") [82,68,55].forEach((f,i)=>tone(f,.45,.075,"sawtooth",.65,i*.11));
  }

  function speakOusang() {
    if (!soundOn) return;
    const clips = ["../audio/ousang-lively.mp3","../audio/ousang-cute.mp3","../audio/ousang-passion.mp3"];
    voiceAudio?.pause();
    voiceAudio = new Audio(clips[Math.floor(Math.random() * clips.length)]);
    voiceAudio.volume = .95;
    voiceAudio.playbackRate = .92 + Math.random() * .15;
    voiceAudio.play().catch(() => {
      if (!("speechSynthesis" in window)) return;
      const utter = new SpeechSynthesisUtterance("欧——桑！");
      utter.lang = "zh-CN"; utter.pitch = .8 + Math.random() * .6; utter.rate = .72 + Math.random() * .2;
      speechSynthesis.cancel(); speechSynthesis.speak(utter);
    });
  }

  function playMusicBeat() {
    if (!soundOn || mode !== "playing") return;
    const ac = ensureAudio();
    if (!ac) return;
    const root = [110, 110, 98, 123.47, 82.41][room];
    const scale = [1,1.1892,1.3348,1.4983,1.7818,1.4983,1.3348,.8909];
    const intensity = 1+Math.min(.55,runTime/240);
    const f = root*scale[musicStep%scale.length];
    tone(f*2,.105,.014*intensity,"square",.995);
    tone(f,.16,.015*intensity,"triangle",.99,.02);
    if(musicStep%2===0)tone(root/2,.14,.022,"square",.82);
    if(musicStep%4===2)tone(58,.045,.022,"square",.4);
    if((room>=3||runTime>75)&&musicStep%2)tone(root*4,.04,.008,"square",.55);
    musicStep++;
  }

  function startMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicStep = 0;
    musicTimer = setInterval(playMusicBeat, room === 4 ? 190 : 235);
  }

  function updateHUD() {
    if (!player) return;
    hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    hpBar.style.width = `${Math.max(0, player.hp / player.maxHp * 100)}%`;
    coinText.textContent = stats?.coins || 0;
    const cd = player.shoutCd;
    skillChip.classList.toggle("cooldown", cd > 0);
    skillStatus.textContent = cd > 0 ? `${cd.toFixed(1)} 秒` : "准备就绪";
    comboText.textContent = `×${combo}`;
    comboChip.classList.toggle("hot", combo >= 8);
    const threat = Math.min(4, Math.floor(runTime / 38));
    const threatNames = ["摸鱼","留意","追捕","封锁","全厂暴走"];
    threatText.textContent = threatNames[threat];
    threatBar.style.width = `${Math.min(100, 6 + runTime / 152 * 94)}%`;
    flockGrid.innerHTML = colors.map(c =>
      `<div class="flock-color ${player.flock[c.key] === 3 ? "ready" : ""}" style="--c:${c.hex}" title="${c.name}共鸣 ${player.resonance[c.key]} 次">
        <span>${c.name}</span><b>${player.flock[c.key]}/4</b>
      </div>`).join("");
    const boss = enemies.find(e => e.type === "boss");
    if (boss) {
      const pct = Math.max(0, boss.hp / boss.maxHp * 100);
      bossBar.style.width = `${pct}%`;
      bossHpText.textContent = `${Math.ceil(pct)}%`;
    }
  }

  function threatScale() {
    return 1 + Math.min(.55, runTime / 300);
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function showComic(text) {
    comicWord.textContent = text;
    comicWord.classList.remove("show");
    void comicWord.offsetWidth;
    comicWord.classList.add("show");
  }

  function startGame() {
    ensureAudio();
    resetRun();
    mode = "playing";
    titleScreen.classList.add("hidden");
    endScreen.classList.remove("visible");
    upgradeScreen.classList.remove("visible");
    shell.classList.add("playing");
    speakOusang();
    startMusic();
    showToast("第一关：冲出青禾农场");
  }

  function attack() {
    if (mode !== "playing" || player.attackCd > 0) return;
    player.attackStep = player.chainWindow > 0 ? (player.attackStep + 1) % 3 : 0;
    player.attackTimer = player.attackStep === 2 ? .32 : .22;
    player.attackCd = player.attackStep === 2 ? .31 : .23;
    player.chainWindow = .52;
    player.attackHit.clear();
    sfx("attack");
  }

  function jump() {
    if (mode !== "playing") return;
    player.jumpBuffer = .13;
    tryBufferedJump();
  }

  function tryBufferedJump() {
    if (player.jumpBuffer <= 0) return;
    const canGroundJump = player.grounded || player.coyote > 0;
    if (!canGroundJump && player.jumps >= player.maxJumps) return;
    player.vy = -player.jumpPower;
    player.jumps = canGroundJump ? 1 : player.jumps + 1;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    burst(player.x + player.w/2, player.y + player.h, "#f4d399", 8, 180);
    sfx("jump");
  }

  function dash() {
    if (mode !== "playing" || player.dashCd > 0 || (!player.grounded && player.airDash <= 0)) return;
    player.dashTimer = .2;
    player.dashCd = player.dashMaxCd;
    player.invuln = Math.max(player.invuln, .28);
    player.dashHit.clear();
    if (!player.grounded) player.airDash--;
    burst(player.x + player.w/2, player.y + player.h/2, "#ffe0a0", 12, 300);
    sfx("dash");
  }

  function shout() {
    if (mode !== "playing" || player.shoutCd > 0) return;
    player.shoutCd = player.shoutMaxCd;
    speakOusang();
    sfx("resonance");
    showComic("欧——桑！");
    screenShake = 13;
    burst(player.x + player.w/2, player.y + player.h/2, "#ffd98a", 34, 480);
    for (const e of enemies) {
      const dx = (e.x + e.w/2) - (player.x + player.w/2);
      const dy = (e.y + e.h/2) - (player.y + player.h/2);
      if (Math.hypot(dx,dy) < 330) {
        damageEnemy(e, player.shoutDamage, dx >= 0 ? 1 : -1);
        e.stun = Math.max(e.stun, 1.2);
      }
    }
    for (const p of projectiles) p.dead = true;
  }

  function keyAction(code) {
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") jump();
    if (code === "KeyJ" || code === "KeyX") attack();
    if (code === "KeyK" || code === "ShiftLeft" || code === "ShiftRight") dash();
    if (code === "KeyQ" || code === "KeyE") shout();
  }

  function burst(x, y, color, count=10, speed=180) {
    for (let i=0; i<count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (.35 + Math.random() * .65);
      particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: .35 + Math.random()*.5, maxLife: .85, color, size: 2 + Math.random()*5 });
    }
  }

  function floater(x,y,text,color="#fff") {
    floaters.push({x,y,text,color,life:.85,maxLife:.85});
  }

  function damageEnemy(e, amount, dir) {
    if (e.dead) return;
    amount *= 1 + Math.min(.5, combo * .025);
    e.hp -= amount;
    e.hitFlash = .12;
    e.x += dir * 18;
    combo++;
    comboTimer = 1.7;
    stats.maxCombo = Math.max(stats.maxCombo, combo);
    hitStop = Math.max(hitStop, e.type === "boss" ? .025 : .038);
    if (player.burn > 0) e.burn = Math.max(e.burn, 2.6);
    floater(e.x + e.w/2, e.y, `-${Math.round(amount)}`, "#ffe09a");
    burst(e.x + e.w/2, e.y + e.h/2, e.type === "boss" ? "#f0a348" : "#ef6e57", 8, 220);
    sfx("hit");
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.dead = true;
    stats.kills++;
    stats.coins += player.coinMult * (e.elite ? 3 : 1);
    sfx("coin");
    burst(e.x+e.w/2,e.y+e.h/2,"#ffd068",e.type==="boss"?32:15,e.type==="boss"?480:260);
    if (e.type === "boss") {
      for (let i=0;i<6;i++) spawnPickup(e.x+e.w/2+(i-3)*32,e.y+20,colors[i].key);
    } else if (Math.random() < player.dropChance) {
      let color = colors[Math.floor(Math.random()*colors.length)];
      const near = colors.filter(c => player.flock[c.key] === 3);
      if (near.length && Math.random() < .32) color = near[Math.floor(Math.random()*near.length)];
      spawnPickup(e.x+e.w/2,e.y+10,color.key);
    }
  }

  function spawnPickup(x,y,key) {
    pickups.push({x,y,vx:(Math.random()-.5)*160,vy:-330-Math.random()*100,key,life:20,phase:Math.random()*6});
  }

  function collectPig(pickup) {
    const c = colors.find(x=>x.key===pickup.key);
    pickup.dead = true;
    player.flock[c.key]++;
    stats.rescues++;
    burst(pickup.x,pickup.y,c.hex,14,260);
    tone(480 + player.flock[c.key]*85,.15,.045,"sine",1.25);
    if (player.flock[c.key] >= 4) triggerResonance(c);
    else showToast(`救下${c.name}猪：${player.flock[c.key]} / 4`);
  }

  function triggerResonance(c) {
    player.flock[c.key] = 0;
    player.resonance[c.key]++;
    stats.resonance++;
    showComic(`${c.name}四连！`);
    sfx("resonance");
    screenShake = 16;
    const cx = player.x + player.w/2;
    const cy = player.y + player.h/2;
    burst(cx,cy,c.hex,45,520);
    if (c.key === "peach") {
      player.hp = Math.min(player.maxHp, player.hp + 45);
      showToast("蜜桃共鸣：全队热乎乎，生命 +45");
    } else if (c.key === "orange") {
      enemies.forEach(e => damageEnemy(e, 48, e.x > player.x ? 1 : -1));
      showToast("蜜橘共鸣：爆裂猪气，全屏伤害");
    } else if (c.key === "purple") {
      enemies.forEach(e => e.slow = Math.max(e.slow, 6));
      showToast("香芋共鸣：时间摸鱼，敌人减速 6 秒");
    } else if (c.key === "mint") {
      player.roomHeal += 4;
      player.hp = Math.min(player.maxHp, player.hp + 22);
      showToast("薄荷共鸣：清凉续命，关后恢复增强");
    } else if (c.key === "blue") {
      player.shield += 45;
      showToast("晴空共鸣：获得 45 点欧气护盾");
    } else {
      enemies.forEach(e => { damageEnemy(e, 34, e.x > player.x ? 1 : -1); e.stun = Math.max(e.stun,2); });
      showToast("可可共鸣：大地猪震，敌人集体发懵");
    }
  }

  function hurtPlayer(amount, sourceX) {
    if (player.invuln > 0 || player.dashTimer > 0) return;
    combo = 0;
    comboTimer = 0;
    let actual = amount;
    if (player.shield > 0) {
      const blocked = Math.min(player.shield, actual);
      player.shield -= blocked;
      actual -= blocked;
      floater(player.x+player.w/2,player.y,"护盾","#75cfff");
    }
    if (actual > 0) player.hp -= actual;
    player.invuln = .72 + player.invulnBonus;
    player.vx = player.x < sourceX ? -320 : 320;
    player.vy = -270;
    screenShake = 10;
    burst(player.x+player.w/2,player.y+player.h/2,"#ff7c76",12,260);
    sfx("hurt");
    updateHUD();
    if (player.hp <= 0) endRun(false);
  }

  function aabb(a,b) {
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function attackBox() {
    const reach = player.attackRange;
    return {
      x: player.facing > 0 ? player.x+player.w-10 : player.x-reach+10,
      y: player.y+8, w: reach, h: player.h-8,
    };
  }

  function updatePlayer(dt) {
    player.attackCd = Math.max(0,player.attackCd-dt);
    player.attackTimer = Math.max(0,player.attackTimer-dt);
    player.dashCd = Math.max(0,player.dashCd-dt);
    player.dashTimer = Math.max(0,player.dashTimer-dt);
    player.shoutCd = Math.max(0,player.shoutCd-dt);
    player.invuln = Math.max(0,player.invuln-dt);
    player.chainWindow = Math.max(0,player.chainWindow-dt);
    player.jumpBuffer = Math.max(0,player.jumpBuffer-dt);
    player.coyote = player.grounded ? .1 : Math.max(0,player.coyote-dt);

    const left = keys.has("ArrowLeft") || keys.has("KeyA");
    const right = keys.has("ArrowRight") || keys.has("KeyD");
    const axis = (right?1:0) - (left?1:0);
    if (axis) player.facing = axis;

    if (player.dashTimer > 0) {
      player.vx = player.facing * 930;
      player.vy *= .72;
      particles.push({x:player.x+player.w/2,y:player.y+player.h/2,vx:-player.facing*80,vy:(Math.random()-.5)*80,life:.25,maxLife:.25,color:"#f7d7a0",size:7+Math.random()*7});
    } else {
      const target = axis * player.speed;
      player.vx += (target - player.vx) * Math.min(1, dt * (player.grounded ? 12 : 6));
    }

    const wasGrounded = player.grounded;
    player.vy += 2050*dt;
    const oldBottom = player.y + player.h;
    player.x += player.vx*dt;
    player.y += player.vy*dt;
    player.x = Math.max(0,Math.min(WORLD_WIDTH-player.w,player.x));
    player.grounded = false;

    if (player.y+player.h >= GROUND) {
      player.y = GROUND-player.h; player.vy = 0; player.grounded = true; player.jumps = 0; player.airDash = player.maxAirDash;
    }
    for (const p of platforms) {
      if (player.vy >= 0 && oldBottom <= p.y+8 && player.y+player.h >= p.y && player.x+player.w > p.x && player.x < p.x+p.w) {
        player.y = p.y-player.h; player.vy=0; player.grounded=true; player.jumps=0; player.airDash=player.maxAirDash;
      }
    }
    if (wasGrounded && !player.grounded && player.vy >= 0) player.coyote = .1;
    tryBufferedJump();

    if (player.dashTimer > 0) {
      for (const e of enemies) {
        if (!e.dead && !player.dashHit.has(e) && aabb(player,e)) {
          player.dashHit.add(e);
          const perfect = e.windup > 0 || e.telegraph > 0;
          damageEnemy(e, 16 + player.damage * .35, player.facing);
          if (perfect) {
            perfectDodges++;
            player.dashCd *= .35;
            player.shoutCd = Math.max(0,player.shoutCd-.8);
            floater(player.x+player.w/2,player.y-8,"完美冲刺!","#75e7ff");
            burst(player.x+player.w/2,player.y+player.h/2,"#75e7ff",18,330);
          }
        }
      }
    }

    if (player.attackTimer > .06) {
      const box = attackBox();
      for (const e of enemies) {
        if (!e.dead && !player.attackHit.has(e) && aabb(box,e)) {
          player.attackHit.add(e);
          const finisher = player.attackStep === 2;
          damageEnemy(e,player.damage*(finisher?1.65:1),player.facing);
          if (finisher) {
            e.stun = Math.max(e.stun,.35);
            screenShake = Math.max(screenShake,7);
          }
        }
      }
    }

    if (roomCleared && player.x > WORLD_WIDTH - 210) openUpgrade();
  }

  function executeEnemyAttack(e) {
    const scale = threatScale();
    const dx = player.x - e.x;
    if (e.action === "droneShot") {
      const px=e.x+e.w/2, py=e.y+e.h/2;
      const tx=player.x+player.w/2, ty=player.y+player.h/2;
      const d=Math.max(1,Math.hypot(tx-px,ty-py));
      projectiles.push({x:px,y:py,w:14,h:14,vx:(tx-px)/d*350*scale,vy:(ty-py)/d*350*scale,damage:e.damage*scale,life:4});
      e.shootCd=1.9+player.sneak;
      tone(320,.1,.03,"square",.62);
    } else if (e.action === "rollCharge") {
      e.chargeTimer=.48;
      e.attackCd=1.65+player.sneak;
      tone(72,.2,.045,"sawtooth",1.8);
    } else if (e.action === "bossVolley") {
      e.attackCd=1.45+player.sneak;
      for(let i=-2;i<=2;i++) projectiles.push({x:e.x+e.w/2,y:e.y+35,w:18,h:18,vx:e.dir*(250+Math.abs(i)*34)*scale,vy:-190+Math.abs(i)*54,damage:e.damage*.7*scale,life:4,gravity:520});
      sfx("boss");
    } else if (e.action === "bossSlam") {
      e.chargeTimer=.42;
      e.attackCd=1.05+player.sneak;
      screenShake=8;
      sfx("boss");
    } else if (e.action === "melee") {
      e.attackCd=.78+player.sneak;
      if (Math.abs(dx)<118 && Math.abs((player.y+player.h/2)-(e.y+e.h/2))<80) hurtPlayer(e.damage*scale,e.x+e.w/2);
      burst(e.x+(e.dir>0?e.w:0),e.y+e.h*.55,"#ef564d",8,170);
    }
    e.action="idle";
    e.telegraph=0;
  }

  function beginWindup(e, action, duration) {
    e.action=action;
    e.windup=duration*(e.elite?.78:1);
    e.telegraph=e.windup;
    tone(190,.07,.018,"square",1.5);
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (e.dead) continue;
      e.hitFlash = Math.max(0,e.hitFlash-dt);
      e.attackCd = Math.max(0,e.attackCd-dt);
      e.shootCd = Math.max(0,e.shootCd-dt);
      e.stun = Math.max(0,e.stun-dt);
      e.slow = Math.max(0,e.slow-dt);
      e.phase += dt*2;
      if (e.burn > 0) {
        e.burn -= dt; e.burnTick -= dt;
        if (e.burnTick <= 0) { e.burnTick=.5; e.hp -= player.burn; burst(e.x+e.w/2,e.y+10,"#ff8b3d",4,80); if(e.hp<=0)killEnemy(e); }
      }
      if (e.stun > 0) continue;
      const slow = e.slow > 0 ? .42 : 1;
      const scale = threatScale();
      const dx = player.x - e.x;
      const dist = Math.abs(dx);
      e.dir = dx >= 0 ? 1 : -1;

      if (e.type === "drone") e.y = e.baseY + Math.sin(e.phase)*30;

      if (e.windup > 0) {
        e.windup -= dt;
        e.telegraph = Math.max(0,e.windup);
        if (e.windup <= 0) executeEnemyAttack(e);
        continue;
      }

      if (e.chargeTimer > 0) {
        e.chargeTimer -= dt;
        e.x += e.dir*(e.type==="boss"?760:680)*scale*dt;
        if (aabb(player,e)) {
          hurtPlayer(e.damage*1.15*scale,e.x+e.w/2);
          e.chargeTimer=0;
        }
        continue;
      }

      if (e.type === "drone") {
        e.x += Math.sign(dx)*e.speed*.22*slow*scale*dt;
        if (dist<720 && e.shootCd<=0) beginWindup(e,"droneShot",.46);
      } else if (e.type === "boss") {
        if (e.attackCd<=0 && dist<600) beginWindup(e,dist>175&&Math.random()<.58?"bossVolley":"bossSlam",dist>175?.72:.5);
        else if(dist>135)e.x+=e.dir*e.speed*slow*scale*dt;
      } else if (e.type === "roller") {
        if(e.attackCd<=0&&dist<470)beginWindup(e,"rollCharge",.54);
        else if(dist>80)e.x+=e.dir*e.speed*.65*slow*scale*dt;
      } else {
        if(e.attackCd<=0&&dist<92)beginWindup(e,"melee",.38);
        else if(dist>72)e.x+=e.dir*e.speed*slow*scale*dt;
      }
    }
    enemies = enemies.filter(e=>!e.dead);
    if (!roomCleared && enemies.length === 0) {
      roomCleared = true;
      clearTimer = 1.1;
      if (room === 4) {
        setTimeout(()=>endRun(true),950);
      } else {
        showToast("区域清空！前往右侧出口");
      }
    }
  }

  function updateProjectiles(dt) {
    for (const p of projectiles) {
      p.life -= dt;
      if (p.gravity) p.vy += p.gravity*dt;
      p.x += p.vx*dt; p.y += p.vy*dt;
      if (aabb(player,p)) {
        p.dead=true;
        if(player.dashTimer>0){
          perfectDodges++;
          player.dashCd*=.45;
          floater(player.x+player.w/2,player.y,"擦弹!","#75e7ff");
          burst(p.x,p.y,"#75e7ff",9,230);
        }else hurtPlayer(p.damage,p.x);
      }
      if (p.y > GROUND) p.dead=true;
    }
    projectiles = projectiles.filter(p=>!p.dead && p.life>0);
  }

  function updatePickups(dt) {
    for (const p of pickups) {
      p.life-=dt; p.phase+=dt*4; p.vy+=900*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
      if (p.y>GROUND-30) {p.y=GROUND-30;p.vy*=-.42;p.vx*=.8;}
      const dx=player.x+player.w/2-p.x,dy=player.y+player.h/2-p.y;
      const d=Math.hypot(dx,dy);
      if (d<180) {p.vx+=dx/Math.max(1,d)*900*dt;p.vy+=dy/Math.max(1,d)*900*dt;}
      if(d<42)collectPig(p);
    }
    pickups=pickups.filter(p=>!p.dead&&p.life>0);
  }

  function updateEffects(dt) {
    screenShake=Math.max(0,screenShake-dt*35);
    for(const p of particles){p.life-=dt;p.vy+=380*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;}
    particles=particles.filter(p=>p.life>0);
    for(const f of floaters){f.life-=dt;f.y-=48*dt;}
    floaters=floaters.filter(f=>f.life>0);
  }

  function update(dt) {
    time += dt;
    if (mode !== "playing") { updateEffects(dt); return; }
    if(hitStop>0){hitStop-=dt;updateEffects(dt*.15);return;}
    runTime += dt;
    roomTime += dt;
    comboTimer=Math.max(0,comboTimer-dt);
    if(comboTimer<=0)combo=0;
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateEffects(dt);
    const target = Math.max(0,Math.min(WORLD_WIDTH-W,player.x-W*.34));
    cameraX += (target-cameraX)*Math.min(1,dt*5.5);
    updateHUD();
  }

  function openUpgrade() {
    if (mode !== "playing" || room >= 4) return;
    mode = "upgrade";
    const fastClear = roomTime < 48 + room * 7;
    const pool = [...upgradePool].sort(()=>Math.random()-.5).slice(0,3).map((u,i)=>({
      ...u,
      rarity: (fastClear&&i===0)||Math.random()<.18 ? "传奇" : "精良",
    }));
    upgradeCards.innerHTML = pool.map((u,i)=>`
      <button class="upgrade-card ${u.rarity==="传奇"?"legendary":""}" type="button" data-id="${u.id}" data-key="${i+1}">
        <span class="upgrade-icon">${u.icon}</span><h3>${u.title}</h3><p>${u.text}</p><small>${u.tag} · 选择 ${i+1}</small>
        <em>${u.rarity}${fastClear&&i===0?" · 速通奖励":""}</em>
      </button>`).join("");
    upgradeCards.querySelectorAll(".upgrade-card").forEach((card,i)=>card.addEventListener("click",()=>chooseUpgrade(pool[i])));
    upgradeScreen.classList.add("visible");
    upgradeScreen._choices = pool;
  }

  function chooseUpgrade(upgrade) {
    if (!upgrade || mode !== "upgrade") return;
    upgrade.apply(player);
    if(upgrade.rarity==="传奇")upgrade.apply(player);
    showToast(`获得${upgrade.rarity==="传奇"?"传奇":""}遗物：${upgrade.title}`);
    upgradeScreen.classList.remove("visible");
    room++;
    setupRoom(room);
    mode="playing";
    startMusic();
  }

  function endRun(won) {
    if (mode === "end") return;
    mode="end";
    shell.classList.remove("playing");
    endScreen.classList.add("visible");
    document.querySelector("#end-kicker").textContent=won?"成功逃出生天":"本次逃亡结束";
    document.querySelector("#end-title").textContent=won?"今晚，谁都不加菜":"今晚还是加菜了";
    document.querySelector("#end-copy").textContent=won?"你带着彩猪小队冲进夜市，欧桑响彻全城。":"别怕，肉鸽的规矩就是再来一局。";
    document.querySelector("#run-stats").innerHTML=`
      <div class="stat-box"><b>${stats.kills}</b><small>击退守卫</small></div>
      <div class="stat-box"><b>${stats.rescues}</b><small>救出彩猪</small></div>
      <div class="stat-box"><b>×${stats.maxCombo}</b><small>最高连击</small></div>
      <div class="stat-box"><b>${perfectDodges}</b><small>完美冲刺</small></div>`;
    if(won){speakOusang();showComic("自由了！");}
  }

  function roundRect(x,y,w,h,r,fill,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  }

  function drawBackground() {
    const a=areas[room];
    ctx.fillStyle=a.sky1;ctx.fillRect(0,0,W,230);
    ctx.fillStyle=a.sky2;ctx.fillRect(0,230,W,GROUND-230);
    ctx.fillStyle=room<2?"rgba(255,239,177,.14)":"rgba(255,92,85,.09)";
    for(let y=70;y<GROUND;y+=32)for(let x=((y/32)%2)*16;x<W;x+=32)ctx.fillRect(x,y,4,4);
    const sunX=room<2?1040:1050, sunY=room<2?100:82;
    ctx.fillStyle=room<2?"#ffd276":"#f2d6a0";
    ctx.fillRect(sunX,sunY,64,64);ctx.fillRect(sunX-8,sunY+16,80,32);ctx.fillRect(sunX+16,sunY-8,32,80);
    ctx.save();
    ctx.translate(-(cameraX*.18)%W,0);
    ctx.globalAlpha=.2;
    for(let i=-1;i<4;i++){
      ctx.fillStyle=room<2?"#fff0ce":"#101827";
      const cx=i*470+160,cy=150+(i%2)*55;
      ctx.fillRect(cx,cy,150,28);ctx.fillRect(cx+25,cy-20,90,20);ctx.fillRect(cx+55,cy-36,48,16);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-cameraX*.42,0);
    if(a.kind==="farm"){
      for(let i=0;i<11;i++){drawHill(i*480-200,410,400,170,i%2?"#4f7b3d":"#6f9a4a");}
      for(let i=0;i<7;i++)drawBarn(i*620+210,315,.58);
    } else if(a.kind==="warehouse"){
      for(let i=0;i<8;i++)drawWarehouse(i*540+80,260,.72,a.accent);
    } else if(a.kind==="convoy"){
      for(let i=0;i<7;i++)drawCity(i*520+80,180,.8);
      for(let i=0;i<6;i++)drawTruck(i*610+190,410,.65);
    } else {
      for(let i=0;i<9;i++)drawFactory(i*480+20,215,.72,a.accent);
    }
    ctx.restore();

    ctx.fillStyle=a.ground;ctx.fillRect(0,GROUND,W,44);
    ctx.fillStyle="#151216";ctx.fillRect(0,GROUND+44,W,H-GROUND-44);
    ctx.fillStyle="rgba(0,0,0,.24)";ctx.fillRect(0,GROUND, W,8);
    ctx.fillStyle="rgba(255,255,255,.05)";
    for(let x=-(cameraX%96);x<W;x+=96){ctx.fillRect(x,GROUND+18,48,4);ctx.fillRect(x+24,GROUND+68,48,4);}
  }

  function drawHill(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x+w/2,y,w/2,h,0,Math.PI,0);ctx.fill();}
  function drawBarn(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#8d282c";ctx.fillRect(0,75,250,190);ctx.fillStyle="#3c2422";ctx.beginPath();ctx.moveTo(-25,78);ctx.lineTo(125,0);ctx.lineTo(275,78);ctx.fill();ctx.fillStyle="#e5c38b";ctx.fillRect(95,155,60,110);ctx.fillRect(18,110,52,44);ctx.restore();}
  function drawWarehouse(x,y,s,accent){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#31262a";ctx.fillRect(0,70,410,250);ctx.fillStyle=accent;ctx.fillRect(0,70,410,15);ctx.fillStyle="#151317";for(let i=0;i<3;i++)ctx.fillRect(38+i*122,140,90,180);ctx.restore();}
  function drawCity(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#142639";ctx.fillRect(0,40,160,350);ctx.fillStyle="rgba(79,210,220,.55)";for(let yy=70;yy<340;yy+=48)for(let xx=18;xx<140;xx+=38)ctx.fillRect(xx,yy,13,24);ctx.restore();}
  function drawTruck(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#2d3239";ctx.fillRect(0,0,310,120);ctx.fillStyle="#912d31";ctx.fillRect(310,35,115,85);ctx.fillStyle="#16191e";ctx.beginPath();ctx.arc(80,125,34,0,7);ctx.arc(345,125,34,0,7);ctx.fill();ctx.restore();}
  function drawFactory(x,y,s,accent){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#2b2930";ctx.fillRect(0,85,380,270);ctx.fillStyle=accent;ctx.fillRect(0,85,380,12);ctx.fillStyle="#222028";ctx.fillRect(52,0,42,100);ctx.fillRect(142,25,34,80);ctx.fillRect(268,-30,52,140);ctx.fillStyle="rgba(255,174,70,.72)";for(let i=0;i<4;i++)ctx.fillRect(35+i*85,145,42,40);ctx.restore();}

  function drawWorld() {
    ctx.save();
    ctx.translate(-cameraX,0);
    for(const s of scenery) {
      const a=areas[room];
      ctx.globalAlpha=.35;
      ctx.fillStyle=a.kind==="farm"?(s.kind%2?"#315a35":"#dfb55f"):(s.kind%2?a.accent:"#17151b");
      if(s.kind%2){ctx.fillRect(s.x,s.y,16*s.s,GROUND-s.y);ctx.beginPath();ctx.arc(s.x+8*s.s,s.y,32*s.s,0,7);ctx.fill();}
      else {ctx.fillRect(s.x,s.y,35*s.s,GROUND-s.y);}
    }
    ctx.globalAlpha=1;
    for(const p of platforms) {
      ctx.fillStyle=room<2?"#6b5038":"#38373e";ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle=areas[room].accent;ctx.fillRect(p.x,p.y,p.w,6);
      ctx.fillStyle="rgba(255,255,255,.1)";for(let x=p.x+12;x<p.x+p.w;x+=32)ctx.fillRect(x,p.y+9,12,3);
      for(let x=p.x+20;x<p.x+p.w-10;x+=46){ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(x,p.y+p.h,8,30);}
    }
    if(roomCleared&&room<4)drawExitGate(WORLD_WIDTH-155,GROUND-155);
    for(const p of pickups)drawPickup(p);
    for(const e of enemies)drawEnemy(e);
    for(const p of projectiles)drawProjectile(p);
    drawPlayer(player);
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;const s=Math.max(2,Math.round(p.size));ctx.fillRect(Math.round(p.x-s/2),Math.round(p.y-s/2),s,s);}
    ctx.globalAlpha=1;
    for(const f of floaters){ctx.globalAlpha=f.life/f.maxLife;ctx.fillStyle=f.color;ctx.font="900 18px monospace";ctx.textAlign="center";ctx.fillText(f.text,f.x,f.y);}
    ctx.globalAlpha=1;ctx.textAlign="left";
    ctx.restore();
  }

  function drawExitGate(x,y){
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle="#24171d";ctx.fillRect(0,30,100,125);
    ctx.fillStyle="#bf3335";ctx.fillRect(-10,0,120,42);
    ctx.fillStyle="#ffe0a1";ctx.font="900 18px sans-serif";ctx.textAlign="center";ctx.fillText("出口",50,27);
    ctx.fillStyle=`rgba(255,224,161,${.35+Math.sin(time*5)*.2})`;ctx.fillRect(18,55,64,100);
    ctx.restore();
  }

  function drawPig(x,y,w,h,color,facing=1,hero=false,phase=0) {
    ctx.save();
    ctx.translate(x+w/2,y+h/2);
    ctx.scale(facing,1);
    const bob=Math.sin(time*8+phase)*(hero?2:1);
    ctx.translate(-w/2,-h/2+bob);
    if(hero){ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(w*.48,h+6,w*.37,8,0,0,7);ctx.fill();}
    ctx.fillStyle=color;ctx.strokeStyle="rgba(75,31,36,.7)";ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(w*.44,h*.55,w*.38,h*.36,-.08,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(w*.74,h*.48,w*.27,h*.31,.08,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(w*.58,h*.2);ctx.lineTo(w*.62,-h*.03);ctx.lineTo(w*.78,h*.2);ctx.fill();ctx.stroke();
    ctx.fillStyle="#ef8790";ctx.beginPath();ctx.ellipse(w*.87,h*.57,w*.15,h*.13,0,0,7);ctx.fill();
    ctx.fillStyle="#392126";ctx.beginPath();ctx.arc(w*.79,h*.39,3.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(w*.83,h*.57,2.5,0,7);ctx.arc(w*.91,h*.57,2.5,0,7);ctx.fill();
    ctx.fillStyle=color;ctx.fillRect(w*.2,h*.76,w*.13,h*.2);ctx.fillRect(w*.55,h*.76,w*.13,h*.2);
    ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(w*.05,h*.46,w*.12,-1.4,1.5);ctx.stroke();
    if(hero){
      ctx.fillStyle="#b5252c";ctx.fillRect(w*.47,h*.17,w*.48,8);
      ctx.beginPath();ctx.moveTo(w*.5,h*.19);ctx.lineTo(w*.2,h*.05);ctx.lineTo(w*.35,h*.28);ctx.fill();
      ctx.strokeStyle="#2c151b";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w*.7,h*.31);ctx.lineTo(w*.83,h*.27);ctx.stroke();
    }
    ctx.restore();
  }

  function drawAtlas(col,row,x,y,w,h,flip=false,filter="none") {
    if(!spriteAtlas.complete||!spriteAtlas.naturalWidth)return false;
    const sw=spriteAtlas.naturalWidth/4,sh=spriteAtlas.naturalHeight/4;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.filter=filter;
    if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(spriteAtlas,col*sw,row*sh,sw,sh,0,0,w,h);}
    else ctx.drawImage(spriteAtlas,col*sw,row*sh,sw,sh,x,y,w,h);
    ctx.restore();
    return true;
  }

  function drawPlayer(p) {
    ctx.save();
    if(p.invuln>0&&Math.floor(p.invuln*16)%2===0)ctx.globalAlpha=.35;
    if(p.shield>0){
      ctx.globalAlpha=.38;
      drawAtlas(1,3,p.x-30,p.y-38,138,138,false);
      ctx.globalAlpha=1;
    }
    let frame=0;
    if(!p.grounded)frame=2;
    else if(p.attackTimer>.05)frame=3;
    else if(Math.abs(p.vx)>55)frame=Math.floor(time*10)%2?1:0;
    const bob=p.grounded&&Math.abs(p.vx)>55?(Math.floor(time*20)%2)*3:0;
    const used=drawAtlas(frame,0,p.x-36,p.y-47+bob,150,150,p.facing<0,p.hitFlash>0?"brightness(2)":"none");
    if(!used)drawPig(p.x,p.y,p.w,p.h,"#f29ca5",p.facing,true);
    if(p.dashTimer>0){
      ctx.globalAlpha=.25;
      drawAtlas(1,0,p.x-36-p.facing*34,p.y-47,150,150,p.facing<0);
      ctx.globalAlpha=1;
    }
    if(p.attackTimer>.05){
      const b=attackBox();
      ctx.globalAlpha=.42;ctx.fillStyle=p.attackStep===2?"#ffcf62":"#ffe5a6";
      for(let i=0;i<4;i++)ctx.fillRect(b.x+(p.facing>0?i*16:b.w-i*16),b.y+12+i*6,18,8);
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    if(e.windup>0){
      const flash=Math.floor(time*16)%2===0;
      ctx.globalAlpha=flash?.48:.22;
      ctx.fillStyle="#ff403d";
      if(e.type==="drone"){
        ctx.fillRect(e.x-8,e.y+e.h/2-3,(player.x-e.x)+player.w/2,6);
      }else{
        const reach=e.type==="boss"?230:e.type==="roller"?290:105;
        ctx.fillRect(e.dir>0?e.x+e.w:e.x-reach,e.y+e.h*.3,reach,e.h*.58);
      }
      ctx.globalAlpha=1;
      ctx.fillStyle="#ffdf8a";ctx.font="900 22px monospace";ctx.textAlign="center";ctx.fillText("!",e.x+e.w/2,e.y-24);
    }
    if(e.elite){ctx.fillStyle=`rgba(255,202,83,${.12+Math.sin(time*8)*.05})`;ctx.fillRect(e.x-10,e.y-10,e.w+20,e.h+20);}
    if(e.hitFlash>0)ctx.filter="brightness(2.5)";
    if(e.stun>0){ctx.fillStyle="#ffe078";ctx.font="18px monospace";ctx.fillText("✦ ✦",e.x+e.w*.25,e.y-8);}
    const col=e.type==="drone"?1:e.type==="roller"?2:e.type==="boss"?3:0;
    const size=e.type==="boss"?235:e.type==="drone"?118:e.type==="roller"?128:120;
    const ox=e.x-(size-e.w)/2,oy=e.y-(size-e.h)+16;
    const used=drawAtlas(col,2,ox,oy,size,size,e.dir<0,e.hitFlash>0?"brightness(2.4)":"none");
    if(!used){ctx.fillStyle="#30343a";ctx.fillRect(e.x,e.y,e.w,e.h);}
    if(e.type!=="boss"){
      ctx.fillStyle="rgba(0,0,0,.72)";ctx.fillRect(e.x,e.y-13,e.w,7);
      ctx.fillStyle=e.elite?"#f4bf52":"#e34c47";ctx.fillRect(e.x,e.y-13,e.w*Math.max(0,e.hp/e.maxHp),7);
    }
    ctx.restore();
  }

  function drawPickup(p) {
    const c=colors.find(x=>x.key===p.key);
    const map={orange:0,mint:1,blue:2,purple:3,peach:3,cocoa:0};
    const filter=p.key==="peach"?"hue-rotate(300deg) saturate(.9)":p.key==="cocoa"?"sepia(1) saturate(.65) brightness(.67)":"none";
    const y=p.y+Math.sin(p.phase)*5;
    ctx.save();
    ctx.globalAlpha=.18;ctx.fillStyle=c.hex;ctx.fillRect(p.x-32,y-30,64,64);ctx.globalAlpha=1;
    if(!drawAtlas(map[p.key],1,p.x-44,y-44,88,88,false,filter))drawPig(p.x-22,y-18,44,36,c.hex,1,false,p.phase);
    ctx.restore();
  }

  function drawProjectile(p) {
    ctx.save();
    if(!drawAtlas(0,3,p.x-24,p.y-24,48,48,p.vx<0)){
      ctx.fillStyle="#ef6a4e";ctx.fillRect(p.x-p.w/2,p.y-p.h/2,p.w,p.h);
    }
    ctx.restore();
  }

  function draw() {
    ctx.save();
    const sx=screenShake?(Math.random()-.5)*screenShake:0;
    const sy=screenShake?(Math.random()-.5)*screenShake:0;
    ctx.translate(sx,sy);
    drawBackground();
    drawWorld();
    if(mode==="title"){ctx.fillStyle="rgba(15,10,14,.25)";ctx.fillRect(0,0,W,H);}
    ctx.restore();
  }

  function loop(now) {
    const dt=Math.min(.033,(now-lastTime)/1000||0);
    lastTime=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown",e=>{
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
    if(!keys.has(e.code))keyAction(e.code);
    keys.add(e.code);
    if(mode==="title"&&(e.code==="Enter"||e.code==="Space"))startGame();
    if(mode==="end"&&(e.code==="KeyR"||e.code==="Enter"))startGame();
    if(mode==="upgrade"&&["Digit1","Digit2","Digit3"].includes(e.code)){
      const i=Number(e.code.at(-1))-1;chooseUpgrade(upgradeScreen._choices?.[i]);
    }
  },{passive:false});
  window.addEventListener("keyup",e=>keys.delete(e.code));
  window.addEventListener("blur",()=>keys.clear());

  startButton.addEventListener("click",startGame);
  restartButton.addEventListener("click",startGame);
  canvas.addEventListener("pointerdown",e=>{if(mode==="playing"&&e.pointerType!=="touch")attack();});
  soundToggle.addEventListener("click",()=>{
    soundOn=!soundOn;soundToggle.textContent=soundOn?"♫":"×";soundToggle.setAttribute("aria-label",soundOn?"关闭声音":"开启声音");
    if(!soundOn){voiceAudio?.pause();if(audioCtx)audioCtx.suspend();}else{ensureAudio();startMusic();}
  });

  document.querySelectorAll(".touch-controls button").forEach(btn=>{
    const code=btn.dataset.key;
    const down=e=>{e.preventDefault();btn.classList.add("pressed");if(!keys.has(code))keyAction(code);keys.add(code);};
    const up=e=>{e.preventDefault();btn.classList.remove("pressed");keys.delete(code);};
    btn.addEventListener("pointerdown",down,{passive:false});
    btn.addEventListener("pointerup",up,{passive:false});
    btn.addEventListener("pointercancel",up,{passive:false});
    btn.addEventListener("pointerleave",up,{passive:false});
  });

  resetRun();
  mode="title";
  shell.classList.remove("playing");
  requestAnimationFrame(loop);
})();
