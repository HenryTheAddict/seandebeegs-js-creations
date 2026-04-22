/* =====================================================================
   The Pregnancy Game — jiggle physics + Sean Mode + color picker
   ===================================================================== */

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}
window.addEventListener('resize', () => { resize(); blob.init(); });
resize();

const W = () => canvas.getBoundingClientRect().width;
const H = () => canvas.getBoundingClientRect().height;

// ── skin palette ──
const SKINS = [
  { light: 'rgba(255,225,195,1)', mid: 'rgba(240,195,160,1)', dark: 'rgba(210,155,115,1)', outline: 'rgba(190,120,80,0.35)' },
  { light: 'rgba(255,205,160,1)', mid: 'rgba(235,170,120,1)', dark: 'rgba(200,125,75,1)',  outline: 'rgba(175,100,55,0.35)' },
  { light: 'rgba(215,145,90,1)',  mid: 'rgba(190,115,65,1)',  dark: 'rgba(155,80,35,1)',   outline: 'rgba(130,65,25,0.35)' },
  { light: 'rgba(165,90,45,1)',   mid: 'rgba(135,65,25,1)',   dark: 'rgba(100,40,10,1)',   outline: 'rgba(85,30,5,0.35)'  },
  { light: 'rgba(105,55,20,1)',   mid: 'rgba(80,35,8,1)',     dark: 'rgba(55,18,2,1)',     outline: 'rgba(45,12,0,0.4)'   },
  { light: null, mid: null, dark: null, outline: null }, // rainbow — handled separately
];
let skinIdx = 0;

function setSkin(i) {
  skinIdx = i;
  document.querySelectorAll('.swatch').forEach((s, j) => s.classList.toggle('active', j === i));
}
window.setSkin = setSkin;

// ── mode ──
let currentMode = 'normal'; // 'normal' | 'sean'

const MODES = {
  normal: {
    title: 'The Pregnancy Game',
    weekLabel: 'Week',
    actionLabels: ['Pat Belly 🤲', 'Sing to Baby 🎵', 'Rest 😴'],
    hungerLabel: 'Hunger',
    babyLabel: 'Baby Activity',
    cravings: [
      { emoji: '🍕', name: 'Pizza',      yum: 20 },
      { emoji: '🍦', name: 'Ice Cream',  yum: 22 },
      { emoji: '🥒', name: 'Pickles',    yum: 15 },
      { emoji: '🍫', name: 'Chocolate',  yum: 18 },
      { emoji: '🍟', name: 'Fries',      yum: 16 },
      { emoji: '🍰', name: 'Cake',       yum: 25 },
      { emoji: '🍓', name: 'Strawberry', yum: 14 },
      { emoji: '🧀', name: 'Cheese',     yum: 12 },
      { emoji: '🍌', name: 'Banana',     yum: 11 },
      { emoji: '🌮', name: 'Taco',       yum: 19 },
    ],
    thoughts: ['💭 Kick!', '💭 Hungry!', '💭 Sleepy…', '💭 🎵', '💭 Gotta pee', '💭 Pickles??'],
    logs: {
      kick: '👟 Baby kicked!',
      pat:  '🤲 Patted the belly! Baby loves it.',
      sing: '🎵 Sang a lullaby! Score +15',
      rest: '😴 Rested. Feeling better!',
      miss: '😤 Missed a craving!',
      init: ['👶 Pregnancy begins! Week 1...', 'Click the belly to feel the baby! Eat the cravings! 🍕'],
      weekMsg: (w) => `📅 Week ${w} — baby is growing!`,
      done: (s) => `🎉 40 weeks! It's time! Final score: ${s}`,
    },
  },
  sean: {
    title: "Sean Mode: Sympathy Pregnancy",
    weekLabel: 'Week of Dad Training',
    actionLabels: ['Pat Gut 🤲', 'Watch the Game 📺', 'Nap 😴'],
    hungerLabel: 'Hunger (Severe)',
    babyLabel: 'Gas Activity',
    cravings: [
      { emoji: '🌭', name: 'Hot Dog',     yum: 20 },
      { emoji: '🍕', name: 'Pizza',       yum: 25 },
      { emoji: '🍟', name: 'Fries',       yum: 18 },
      { emoji: '🧇', name: 'Waffles',     yum: 16 },
      { emoji: '🥓', name: 'Bacon',       yum: 22 },
      { emoji: '🍔', name: 'Burger',      yum: 24 },
      { emoji: '🎮', name: 'Controller',  yum: 5  },
      { emoji: '🧃', name: 'Juice Box',   yum: 10 },
      { emoji: '🍪', name: 'Cookie',      yum: 14 },
      { emoji: '🧆', name: 'Falafel',     yum: 12 },
    ],
    thoughts: ['💭 Game's on!', '💭 Is that gas?', '💭 My back hurts', '💭 Need chips', '💭 Sympathy kick??', '💭 I\'m basically pregnant'],
    logs: {
      kick: '💨 Sympathy kick detected (probably gas)',
      pat:  '🤲 Patted the gut. It jiggled. Nice.',
      sing: '📺 Watched the game. Score +15',
      rest: '😴 Napped on the couch. Legend.',
      miss: '😤 Missed a snack!',
      init: ["👨 Sean Mode activated. You have sympathy pregnancy.", "Click the gut! Eat the snacks! Try not to complain! 🌭"],
      weekMsg: (w) => `📅 Week ${w} of dad training — still waddling!`,
      done: (s) => `🏆 40 weeks survived! You're basically a hero. Score: ${s}`,
    },
  },
};

function setMode(m) {
  currentMode = m;
  const mode = MODES[m];
  document.getElementById('title').textContent = mode.title;
  document.getElementById('label-hunger').textContent = mode.hungerLabel;
  document.getElementById('label-baby').textContent   = mode.babyLabel;
  const [a, b, c] = mode.actionLabels;
  document.getElementById('btn-pat').textContent  = a;
  document.getElementById('btn-sing').textContent = b;
  document.getElementById('btn-rest').textContent = c;
  document.querySelectorAll('.mode-btn').forEach(el =>
    el.classList.toggle('active', el.id === `btn-mode-${m}`)
  );
  game.log(mode.logs.init[0]);
}
window.setMode = setMode;

// ── spring soft-body blob ──
const POINTS    = 28;
const STIFFNESS = 0.18;
const DAMPING   = 0.72;
const PRESSURE  = 0.35;

const blob = {
  cx: 0, cy: 0, baseR: 0, pts: [], growthR: 0,
  rainbowT: 0,

  init() {
    this.cx = W() / 2;
    this.cy = H() / 2 + 30;
    this.baseR = Math.min(W(), H()) * 0.28 + this.growthR;
    this.pts = [];
    for (let i = 0; i < POINTS; i++) {
      const a  = (i / POINTS) * Math.PI * 2;
      const ox = Math.cos(a) * this.baseR;
      const oy = Math.sin(a) * this.baseR;
      this.pts.push({ x: this.cx + ox, y: this.cy + oy, vx: 0, vy: 0, ox, oy });
    }
  },

  applyImpulse(px, py, force) {
    for (const p of this.pts) {
      const dx = p.x - px, dy = p.y - py;
      const d  = Math.sqrt(dx * dx + dy * dy) + 1;
      const f  = force / (d * 0.05 + 1);
      p.vx += (dx / d) * f;
      p.vy += (dy / d) * f;
    }
  },

  applyKick() {
    const angle = Math.random() * Math.PI * 2;
    this.applyImpulse(
      this.cx + Math.cos(angle) * this.baseR * 0.3,
      this.cy + Math.sin(angle) * this.baseR * 0.3,
      -18
    );
  },

  applyPat() {
    for (const p of this.pts) {
      p.vy += -6 + Math.random() * 12;
      p.vx += -4 + Math.random() * 8;
    }
  },

  step() {
    const cx = this.cx, cy = this.cy, r = this.baseR;
    this.rainbowT += 0.015;
    for (const p of this.pts) {
      const rx = cx + p.ox, ry = cy + p.oy;
      p.vx += (rx - p.x) * STIFFNESS;
      p.vy += (ry - p.y) * STIFFNESS;
      const dx = p.x - cx, dy = p.y - cy;
      const d  = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const deficit = r - d;
      p.vx += (dx / d) * deficit * PRESSURE;
      p.vy += (dy / d) * deficit * PRESSURE;
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;
    }
  },

  blobPath() {
    const pts = this.pts, n = pts.length;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(a.x, a.y, mx, my);
    }
    ctx.closePath();
  },

  draw() {
    ctx.save();
    const skin = SKINS[skinIdx];
    const cx = this.cx, cy = this.cy, r = this.baseR;

    let grd;
    if (skinIdx === 5) {
      // rainbow mode: conic-ish via linear with hue shift
      grd = ctx.createRadialGradient(cx - r*0.25, cy - r*0.3, r*0.05, cx, cy, r*1.1);
      const t = this.rainbowT;
      grd.addColorStop(0,   `hsl(${(t*80) % 360},100%,75%)`);
      grd.addColorStop(0.4, `hsl(${(t*80+120) % 360},100%,60%)`);
      grd.addColorStop(1,   `hsl(${(t*80+240) % 360},100%,45%)`);
    } else {
      grd = ctx.createRadialGradient(cx - r*0.25, cy - r*0.3, r*0.05, cx, cy, r*1.1);
      grd.addColorStop(0,   skin.light);
      grd.addColorStop(0.45, skin.mid);
      grd.addColorStop(1,   skin.dark);
    }

    this.blobPath();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur  = 28;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = skinIdx === 5 ? 'rgba(255,255,255,0.4)' : skin.outline;
    ctx.lineWidth   = 2;
    this.blobPath();
    ctx.stroke();

    // gloss
    const gBelly = ctx.createRadialGradient(cx-r*0.18, cy-r*0.38, 2, cx-r*0.1, cy-r*0.15, r*0.7);
    gBelly.addColorStop(0,   'rgba(255,255,255,0.62)');
    gBelly.addColorStop(0.45,'rgba(255,255,255,0.12)');
    gBelly.addColorStop(1,   'rgba(255,255,255,0)');
    this.blobPath();
    ctx.fillStyle = gBelly;
    ctx.fill();

    // belly button
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.12, 6, 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = skinIdx === 5 ? 'rgba(255,255,255,0.5)' : skin.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // stretch marks (skip on rainbow — too trippy)
    if (skinIdx !== 5) {
      ctx.strokeStyle = 'rgba(210,150,130,0.2)';
      ctx.lineWidth = 1.5;
      for (const [ax,ay,bx2,by2] of [[-0.35,-0.1,-0.55,0.15],[0.38,-0.08,0.58,0.18],[-0.2,0.3,-0.35,0.55],[0.22,0.28,0.4,0.52]]) {
        ctx.beginPath();
        ctx.moveTo(cx + ax*r, cy + ay*r);
        ctx.quadraticCurveTo(cx + (ax+bx2)/2*r + 12, cy + (ay+by2)/2*r, cx + bx2*r, cy + by2*r);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
};

// ── character drawing ──
function drawCharacter() {
  if (currentMode === 'sean') drawSean();
  else drawNormal();
}

function drawNormal() {
  const cx = blob.cx, cy = blob.cy, r = blob.baseR;
  const skin = SKINS[skinIdx];
  const skinMid = skinIdx === 5 ? `hsl(${(blob.rainbowT*80+60)%360},80%,60%)` : skin.mid;
  ctx.save();

  // legs
  ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx-18, cy+r*0.85); ctx.lineTo(cx-22, cy+r*0.85+60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+18, cy+r*0.85); ctx.lineTo(cx+22, cy+r*0.85+60); ctx.stroke();

  // shoes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(cx-30, cy+r*0.85+68, 20, 10, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+30, cy+r*0.85+68, 20, 10,  0.2, 0, Math.PI*2); ctx.fill();

  // arms
  ctx.strokeStyle = skinMid; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(cx-r*0.8, cy-r*0.05); ctx.quadraticCurveTo(cx-r*1.1, cy+r*0.35, cx-r*0.7, cy+r*0.65); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+r*0.8, cy-r*0.05); ctx.quadraticCurveTo(cx+r*1.1, cy+r*0.35, cx+r*0.7, cy+r*0.65); ctx.stroke();

  // shirt
  ctx.fillStyle = 'rgba(100,150,255,0.28)';
  ctx.beginPath(); ctx.ellipse(cx, cy-r*0.6, r*0.52, r*0.28, 0, 0, Math.PI*2); ctx.fill();

  // head
  const hx = cx, hy = cy - r - 42;
  const hGrd = ctx.createRadialGradient(hx-8, hy-10, 3, hx, hy, 34);
  if (skinIdx === 5) {
    hGrd.addColorStop(0, `hsl(${(blob.rainbowT*80+30)%360},90%,75%)`);
    hGrd.addColorStop(1, `hsl(${(blob.rainbowT*80+90)%360},80%,55%)`);
  } else {
    hGrd.addColorStop(0, skin.light); hGrd.addColorStop(1, skin.mid);
  }
  ctx.beginPath(); ctx.arc(hx, hy, 34, 0, Math.PI*2);
  ctx.fillStyle = hGrd; ctx.shadowColor='rgba(0,0,0,0.2)'; ctx.shadowBlur=8; ctx.fill(); ctx.shadowColor='transparent';

  // hair
  ctx.fillStyle = '#3a1f00';
  ctx.beginPath(); ctx.ellipse(hx, hy-22, 34, 18, 0, Math.PI, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx-32, hy-5, 8, 20, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx+32, hy-5, 8, 20,  0.3, 0, Math.PI*2); ctx.fill();

  drawFace(hx, hy);
  ctx.restore();
}

function drawSean() {
  const cx = blob.cx, cy = blob.cy, r = blob.baseR;
  const skin = SKINS[skinIdx];
  const skinLight = skinIdx === 5 ? `hsl(${(blob.rainbowT*80+30)%360},90%,75%)` : skin.light;
  const skinMid   = skinIdx === 5 ? `hsl(${(blob.rainbowT*80+60)%360},80%,60%)` : skin.mid;
  ctx.save();

  // legs (wider = dad energy)
  ctx.strokeStyle = '#2a3060'; ctx.lineWidth = 22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx-22, cy+r*0.85); ctx.lineTo(cx-26, cy+r*0.85+65); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+22, cy+r*0.85); ctx.lineTo(cx+26, cy+r*0.85+65); ctx.stroke();

  // sneakers (dad shoes)
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath(); ctx.ellipse(cx-34, cy+r*0.85+73, 24, 11, -0.15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.ellipse(cx-34, cy+r*0.85+73, 24, 4, -0.15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath(); ctx.ellipse(cx+34, cy+r*0.85+73, 24, 11,  0.15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.ellipse(cx+34, cy+r*0.85+73, 24, 4,  0.15, 0, Math.PI*2); ctx.fill();

  // arms (holding remote)
  ctx.strokeStyle = skinMid; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(cx-r*0.82, cy-r*0.05); ctx.quadraticCurveTo(cx-r*1.15, cy+r*0.3, cx-r*0.8, cy+r*0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+r*0.82, cy-r*0.05); ctx.quadraticCurveTo(cx+r*1.15, cy+r*0.3, cx+r*0.8, cy+r*0.6); ctx.stroke();
  // remote in right hand
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.roundRect(cx+r*0.68, cy+r*0.55, 18, 30, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,0,0,0.7)'; ctx.beginPath(); ctx.arc(cx+r*0.77, cy+r*0.6, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(0,200,0,0.7)'; ctx.beginPath(); ctx.arc(cx+r*0.77, cy+r*0.68, 3, 0, Math.PI*2); ctx.fill();

  // jersey / shirt (sports)
  ctx.fillStyle = 'rgba(220,40,40,0.35)';
  ctx.beginPath(); ctx.ellipse(cx, cy-r*0.6, r*0.55, r*0.30, 0, 0, Math.PI*2); ctx.fill();
  // jersey number
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${Math.round(r*0.22)}px 'Georgia', serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('69', cx, cy - r*0.62);

  // head (rounder, bigger)
  const hx = cx, hy = cy - r - 50;
  const hGrd = ctx.createRadialGradient(hx-8, hy-10, 3, hx, hy, 38);
  if (skinIdx === 5) {
    hGrd.addColorStop(0, skinLight); hGrd.addColorStop(1, skinMid);
  } else {
    hGrd.addColorStop(0, skin.light); hGrd.addColorStop(1, skin.mid);
  }
  ctx.beginPath(); ctx.arc(hx, hy, 38, 0, Math.PI*2);
  ctx.fillStyle = hGrd; ctx.shadowColor='rgba(0,0,0,0.2)'; ctx.shadowBlur=8; ctx.fill(); ctx.shadowColor='transparent';

  // short hair / buzz cut
  ctx.fillStyle = '#5a3520';
  ctx.beginPath(); ctx.ellipse(hx, hy-30, 38, 12, 0, Math.PI, Math.PI*2); ctx.fill();

  // stubble
  ctx.fillStyle = 'rgba(80,50,30,0.18)';
  ctx.beginPath(); ctx.ellipse(hx, hy+14, 22, 14, 0, 0, Math.PI*2); ctx.fill();
  // stubble dots
  ctx.fillStyle = 'rgba(80,50,30,0.35)';
  for (let i = 0; i < 18; i++) {
    const sx = hx - 18 + Math.random()*36;
    const sy = hy + 6 + Math.random()*16;
    ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI*2); ctx.fill();
  }

  // baseball cap
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.ellipse(hx, hy-28, 42, 16, 0, Math.PI, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx+20, hy-22, 22, 8, 0.4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#aa2222';
  ctx.font = `bold 10px Arial`; ctx.fillText('DAD', hx-5, hy-32);

  drawFace(hx, hy, true);
  ctx.restore();
}

function drawFace(hx, hy, isSean = false) {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(hx-11, hy-2, 7, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx+11, hy-2, 7, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath(); ctx.arc(hx-11, hy-1, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx+11, hy-1, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(hx-9, hy-3, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx+13, hy-3, 1.5, 0, Math.PI*2); ctx.fill();

  // eyebrows (thicker for Sean)
  ctx.strokeStyle = isSean ? '#5a3520' : '#3a1f00';
  ctx.lineWidth = isSean ? 3 : 2;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx-17, hy-13); ctx.lineTo(hx-5, hy-11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx+5, hy-11);  ctx.lineTo(hx+17, hy-13); ctx.stroke();

  ctx.strokeStyle = '#a0522d'; ctx.lineWidth = 2;
  const smileY = hy + 14;
  ctx.beginPath();
  if (game.happiness > 60) {
    ctx.arc(hx, smileY - 2, 10, 0.2, Math.PI - 0.2);
  } else if (game.happiness < 30) {
    ctx.arc(hx, smileY + 8, 10, Math.PI + 0.2, -0.2);
  } else {
    ctx.moveTo(hx - 9, smileY + 4); ctx.lineTo(hx + 9, smileY + 4);
  }
  ctx.stroke();
}

// ── particles ──
const particles = [];
function spawnParticles(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 5;
    particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd - 1, life: 1, decay: 0.03+Math.random()*0.04, r: 4+Math.random()*6, color });
  }
}
function stepParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.95; p.vy *= 0.96; p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.save(); ctx.globalAlpha = p.life;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
  }
}

// ── background ──
function drawBackground() {
  const w = W(), h = H();
  if (currentMode === 'sean') {
    // sports bar vibe
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1a1a2e'); bg.addColorStop(1, '#16213e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // TV glow
    const tv = ctx.createRadialGradient(w/2, h*0.3, 10, w/2, h*0.3, w*0.4);
    tv.addColorStop(0, 'rgba(80,120,255,0.15)'); tv.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tv; ctx.fillRect(0, 0, w, h);
    // floor
    ctx.fillStyle = 'rgba(60,40,20,0.4)';
    ctx.beginPath(); ctx.ellipse(w/2, h-20, w*0.55, 35, 0, 0, Math.PI*2); ctx.fill();
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#e0f7ff'); bg.addColorStop(0.6, '#f0f9ff'); bg.addColorStop(1, '#fff');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const floor = ctx.createLinearGradient(0, h-60, 0, h);
    floor.addColorStop(0, 'rgba(180,220,255,0.4)'); floor.addColorStop(1, 'rgba(140,200,255,0.15)');
    ctx.fillStyle = floor;
    ctx.beginPath(); ctx.ellipse(w/2, h-20, w*0.55, 40, 0, 0, Math.PI*2); ctx.fill();
  }
}

// ── game logic ──
const game = {
  hunger: 60, happiness: 70, babyActivity: 40,
  score: 0, week: 1,

  get mode() { return MODES[currentMode]; },

  init() {
    const m = this.mode;
    m.logs.init.forEach(l => this.log(l));
    blob.growthR = 0; blob.init();
    this.updateUI();
    this.scheduleKick(); this.scheduleWeek(); this.scheduleThought();
  },

  scheduleKick() {
    setTimeout(() => {
      if (this.babyActivity > 20) this.kick();
      this.scheduleKick();
    }, 3000 + Math.random() * 5000);
  },

  scheduleWeek() {
    setTimeout(() => {
      if (this.week < 40) {
        this.week++;
        blob.growthR = this.week * 2.2;
        blob.init();
        if (this.week % 4 === 0) this.log(this.mode.logs.weekMsg(this.week));
        this.updateUI();
        this.scheduleWeek();
      } else {
        this.log(this.mode.logs.done(this.score));
      }
    }, 8000);
  },

  scheduleThought() {
    setTimeout(() => {
      if (Math.random() < 0.4) {
        const thoughts = this.mode.thoughts;
        this.showThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
      }
      this.scheduleThought();
    }, 5000 + Math.random() * 7000);
  },

  kick() {
    blob.applyKick();
    this.babyActivity = Math.min(100, this.babyActivity + 12);
    spawnParticles(blob.cx+(Math.random()-0.5)*60, blob.cy+(Math.random()-0.5)*60, `hsl(${50+Math.random()*40},100%,60%)`, 10);
    const flash = document.getElementById('kick-flash');
    flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 120);
    this.log(this.mode.logs.kick);
    this.score += 5; this.updateUI();
  },

  bellyClick(x, y) {
    blob.applyImpulse(x, y, -14);
    const c = currentMode === 'sean' ? 'rgba(255,100,50,0.9)' : 'rgba(255,180,100,0.9)';
    spawnParticles(x, y, c, 6);
    this.babyActivity = Math.min(100, this.babyActivity + 6);
    this.happiness    = Math.min(100, this.happiness + 3);
    this.score += 2; this.updateUI();
  },

  spawnCraving() {
    const zone = document.getElementById('craving-zone');
    const foods = this.mode.cravings;
    const food  = foods[Math.floor(Math.random() * foods.length)];
    const el    = document.createElement('div');
    el.className = 'craving'; el.textContent = food.emoji; el.title = food.name;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 10+Math.random()*30; y = 20+Math.random()*60; }
    else if (side === 1) { x = 60+Math.random()*30; y = 20+Math.random()*60; }
    else if (side === 2) { x = 5+Math.random()*40;  y = 50+Math.random()*40; }
    else                 { x = 55+Math.random()*40; y = 50+Math.random()*40; }
    el.style.left = x+'%'; el.style.top = y+'%';
    let eaten = false;
    el.addEventListener('click', () => {
      if (eaten) return; eaten = true; el.classList.add('nom');
      this.hunger    = Math.min(100, this.hunger + food.yum);
      this.happiness = Math.min(100, this.happiness + food.yum*0.5);
      this.score += food.yum;
      this.log(`😋 Ate ${food.emoji} ${food.name}! +${food.yum}`);
      this.showThought('😋 Yum!');
      blob.applyImpulse(blob.cx, blob.cy - blob.baseR*0.5, -8);
      this.updateUI(); setTimeout(() => el.remove(), 400);
    });
    setTimeout(() => {
      if (!eaten && el.parentNode) {
        el.classList.add('nom');
        this.hunger = Math.max(0, this.hunger - 8);
        this.log(this.mode.logs.miss); this.updateUI();
        setTimeout(() => el.remove(), 350);
      }
    }, 5000 + Math.random()*4000);
    zone.appendChild(el);
  },

  pat() {
    blob.applyPat();
    const c = currentMode === 'sean' ? 'rgba(255,200,50,0.9)' : 'rgba(255,100,200,0.9)';
    spawnParticles(blob.cx, blob.cy - blob.baseR*0.6, c, 12);
    this.happiness    = Math.min(100, this.happiness + 8);
    this.babyActivity = Math.min(100, this.babyActivity + 4);
    this.showThought(currentMode === 'sean' ? '👊 Jiggle!' : '🥰');
    this.score += 8; this.log(this.mode.logs.pat); this.updateUI();
  },

  sing() {
    const c = currentMode === 'sean' ? 'rgba(255,80,80,0.85)' : 'rgba(160,100,255,0.85)';
    spawnParticles(blob.cx, blob.cy - blob.baseR - 60, c, 14);
    this.happiness    = Math.min(100, this.happiness + 15);
    this.babyActivity = Math.min(100, this.babyActivity + 10);
    this.showThought(currentMode === 'sean' ? '📺 GOAL!' : '🎵 🎶');
    this.log(this.mode.logs.sing); this.score += 15; this.updateUI();
    const btn = document.getElementById('btn-sing');
    btn.disabled = true; setTimeout(() => btn.disabled = false, 3000);
  },

  rest() {
    this.hunger    = Math.max(0, this.hunger - 5);
    this.happiness = Math.min(100, this.happiness + 20);
    this.babyActivity = Math.max(0, this.babyActivity - 15);
    this.showThought(currentMode === 'sean' ? '😴 zzz… Sports…' : '😴 zzz');
    this.log(this.mode.logs.rest); this.score += 10; this.updateUI();
    const btn = document.getElementById('btn-rest');
    btn.disabled = true; setTimeout(() => btn.disabled = false, 5000);
  },

  showThought(text) {
    const el = document.getElementById('thought-bubble');
    el.textContent = text; el.classList.add('show');
    clearTimeout(this._thoughtTimer);
    this._thoughtTimer = setTimeout(() => el.classList.remove('show'), 2200);
  },

  log(msg) {
    const log = document.getElementById('log');
    const el  = document.createElement('div'); el.className = 'log-entry'; el.textContent = msg;
    log.prepend(el); while (log.children.length > 6) log.lastChild.remove();
  },

  updateUI() {
    document.getElementById('week').textContent  = this.week;
    document.getElementById('score').textContent = this.score;
    const moods = this.happiness > 75 ? '😄' : this.happiness > 50 ? '😊' : this.happiness > 30 ? '😐' : '😩';
    document.getElementById('mood').textContent = moods;
    document.getElementById('hunger-bar').style.width    = this.hunger + '%';
    document.getElementById('happy-bar').style.width     = this.happiness + '%';
    document.getElementById('baby-bar').style.width      = this.babyActivity + '%';
  },

  tick() {
    this.hunger       = Math.max(0, this.hunger       - 0.008);
    this.happiness    = Math.max(0, this.happiness    - 0.006);
    this.babyActivity = Math.max(0, this.babyActivity - 0.004);
  }
};

// ── input ──
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  game.bellyClick(e.clientX - rect.left, e.clientY - rect.top);
});

setInterval(() => {
  if (document.querySelectorAll('.craving').length < 3) game.spawnCraving();
}, 3500);

// ── loop ──
let lastUIUpdate = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);
  drawBackground();
  drawCharacter();
  blob.step();
  blob.draw();
  stepParticles();
  drawParticles();
  game.tick();
  if (ts - lastUIUpdate > 500) { game.updateUI(); lastUIUpdate = ts; }
}

game.init();
requestAnimationFrame(loop);
