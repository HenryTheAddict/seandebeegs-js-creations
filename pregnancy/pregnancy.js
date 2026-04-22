/* =====================================================================
   The Pregnancy Game — jiggle physics soft-body simulation
   ===================================================================== */

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

// ── resize canvas to its CSS size ──
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

// ── spring soft-body blob ──
const POINTS    = 28;
const STIFFNESS = 0.18;
const DAMPING   = 0.72;
const PRESSURE  = 0.35;

const blob = {
  cx: 0, cy: 0,
  baseR: 0,
  pts: [],   // {x, y, vx, vy, ox, oy}  ox/oy = offset from centre
  growthR: 0,

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
    // random interior point bursting outward
    const angle = Math.random() * Math.PI * 2;
    const ix = this.cx + Math.cos(angle) * this.baseR * 0.3;
    const iy = this.cy + Math.sin(angle) * this.baseR * 0.3;
    this.applyImpulse(ix, iy, -18);
  },

  applyPat() {
    // gentle inward then outward squish from top
    for (const p of this.pts) {
      p.vy += -6 + Math.random() * 12;
      p.vx += -4 + Math.random() * 8;
    }
  },

  step() {
    const cx = this.cx, cy = this.cy;
    const r  = this.baseR;

    for (const p of this.pts) {
      // spring back to rest position
      const rx = cx + p.ox, ry = cy + p.oy;
      p.vx += (rx - p.x) * STIFFNESS;
      p.vy += (ry - p.y) * STIFFNESS;

      // pressure: push outward from centre
      const dx = p.x - cx, dy = p.y - cy;
      const d  = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const deficit = r - d;
      p.vx += (dx / d) * deficit * PRESSURE;
      p.vy += (dy / d) * deficit * PRESSURE;

      // damping
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      p.x += p.vx;
      p.y += p.vy;
    }
  },

  draw() {
    const pts = this.pts;
    const n   = pts.length;

    // ── 3D-ish glossy belly ──
    ctx.save();

    // body fill — radial gradient for sphere illusion
    const grd = ctx.createRadialGradient(
      this.cx - this.baseR * 0.25, this.cy - this.baseR * 0.3, this.baseR * 0.05,
      this.cx, this.cy, this.baseR * 1.1
    );
    grd.addColorStop(0,   'rgba(255,230,200,1)');
    grd.addColorStop(0.45,'rgba(240,190,160,1)');
    grd.addColorStop(1,   'rgba(200,130,100,1)');

    // draw blob path (catmull-rom via quadratic bezier midpoints)
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a  = pts[i];
      const b  = pts[(i + 1) % n];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(a.x, a.y, mx, my);
    }
    ctx.closePath();

    // shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur  = 28;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = grd;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // skin outline
    ctx.strokeStyle = 'rgba(180,110,80,0.35)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // ── gloss top-light (the jelly sheen) ──
    const gBelly = ctx.createRadialGradient(
      this.cx - this.baseR * 0.18, this.cy - this.baseR * 0.38, 2,
      this.cx - this.baseR * 0.1,  this.cy - this.baseR * 0.15, this.baseR * 0.7
    );
    gBelly.addColorStop(0,   'rgba(255,255,255,0.62)');
    gBelly.addColorStop(0.45,'rgba(255,255,255,0.12)');
    gBelly.addColorStop(1,   'rgba(255,255,255,0)');

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a  = pts[i];
      const b  = pts[(i + 1) % n];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(a.x, a.y, mx, my);
    }
    ctx.closePath();
    ctx.fillStyle = gBelly;
    ctx.fill();

    // ── belly button ──
    const bx = this.cx, by = this.cy + this.baseR * 0.12;
    ctx.beginPath();
    ctx.ellipse(bx, by, 6, 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(170,100,70,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── stretch marks (subtle) ──
    ctx.strokeStyle = 'rgba(210,150,130,0.22)';
    ctx.lineWidth = 1.5;
    const marks = [
      [-0.35, -0.1, -0.55, 0.15],
      [ 0.38, -0.08,  0.58, 0.18],
      [-0.2,  0.3,  -0.35, 0.55],
      [ 0.22, 0.28,   0.4,  0.52],
    ];
    for (const [ax,ay,bx2,by2] of marks) {
      ctx.beginPath();
      ctx.moveTo(this.cx + ax * this.baseR, this.cy + ay * this.baseR);
      ctx.quadraticCurveTo(
        this.cx + (ax+bx2)/2 * this.baseR + 12, this.cy + (ay+by2)/2 * this.baseR,
        this.cx + bx2 * this.baseR, this.cy + by2 * this.baseR
      );
      ctx.stroke();
    }

    ctx.restore();
  }
};

// ── character (simple body around blob) ──
function drawCharacter() {
  const cx = blob.cx, cy = blob.cy, r = blob.baseR;
  ctx.save();

  // legs
  ctx.strokeStyle = 'rgba(60,30,10,0.7)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + r * 0.85);
  ctx.lineTo(cx - 22, cy + r * 0.85 + 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy + r * 0.85);
  ctx.lineTo(cx + 22, cy + r * 0.85 + 60);
  ctx.stroke();

  // shoes
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(cx - 30, cy + r * 0.85 + 68, 20, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 30, cy + r * 0.85 + 68, 20, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // arms
  ctx.strokeStyle = 'rgba(200,150,120,0.8)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.8, cy - r * 0.05);
  ctx.quadraticCurveTo(cx - r * 1.1, cy + r * 0.35, cx - r * 0.7, cy + r * 0.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.8, cy - r * 0.05);
  ctx.quadraticCurveTo(cx + r * 1.1, cy + r * 0.35, cx + r * 0.7, cy + r * 0.65);
  ctx.stroke();

  // shirt overlay (top + bottom strips)
  ctx.fillStyle = 'rgba(100,150,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.6, r * 0.52, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  const hx = cx, hy = cy - r - 42;
  const headGrd = ctx.createRadialGradient(hx - 8, hy - 10, 3, hx, hy, 34);
  headGrd.addColorStop(0, 'rgba(255,220,185,1)');
  headGrd.addColorStop(1, 'rgba(210,160,120,1)');
  ctx.beginPath();
  ctx.arc(hx, hy, 34, 0, Math.PI * 2);
  ctx.fillStyle = headGrd;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur  = 8;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // hair
  ctx.fillStyle = '#3a1f00';
  ctx.beginPath();
  ctx.ellipse(hx, hy - 22, 34, 18, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx - 32, hy - 5, 8, 20, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 32, hy - 5, 8, 20, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(hx - 10, hy - 2, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx + 10, hy - 2, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath(); ctx.arc(hx - 10, hy - 1, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 10, hy - 1, 4, 0, Math.PI * 2); ctx.fill();
  // shine
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(hx - 8, hy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 12, hy - 3, 1.5, 0, Math.PI * 2); ctx.fill();

  // mouth — changes with mood
  ctx.strokeStyle = '#a0522d';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const smileY = hy + 14;
  if (game.happiness > 60) {
    ctx.arc(hx, smileY - 2, 10, 0.2, Math.PI - 0.2);
  } else if (game.happiness < 30) {
    ctx.arc(hx, smileY + 8, 10, Math.PI + 0.2, -0.2);
  } else {
    ctx.moveTo(hx - 9, smileY + 4);
    ctx.lineTo(hx + 9, smileY + 4);
  }
  ctx.stroke();

  ctx.restore();
}

// ── particle system for sparkles/kicks ──
const particles = [];

function spawnParticles(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      decay: 0.03 + Math.random() * 0.04,
      r: 4 + Math.random() * 6,
      color
    });
  }
}

function stepParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.18;
    p.vx *= 0.95; p.vy *= 0.96;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

// ── background ──
function drawBackground() {
  const w = W(), h = H();
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0,   '#e0f7ff');
  bg.addColorStop(0.6, '#f0f9ff');
  bg.addColorStop(1,   '#fff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // floor
  const floor = ctx.createLinearGradient(0, h - 60, 0, h);
  floor.addColorStop(0, 'rgba(180,220,255,0.4)');
  floor.addColorStop(1, 'rgba(140,200,255,0.15)');
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.ellipse(w/2, h - 20, w * 0.55, 40, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ── game state ──
const CRAVINGS = [
  { emoji: '🍕', name: 'Pizza',     yum: 20 },
  { emoji: '🍦', name: 'Ice Cream', yum: 22 },
  { emoji: '🥒', name: 'Pickles',   yum: 15 },
  { emoji: '🍫', name: 'Chocolate', yum: 18 },
  { emoji: '🍟', name: 'Fries',     yum: 16 },
  { emoji: '🍰', name: 'Cake',      yum: 25 },
  { emoji: '🍓', name: 'Strawberry',yum: 14 },
  { emoji: '🧀', name: 'Cheese',    yum: 12 },
  { emoji: '🍌', name: 'Banana',    yum: 11 },
  { emoji: '🌮', name: 'Taco',      yum: 19 },
];

const THOUGHTS = ['💭 Kick!', '💭 Hungry!', '💭 Sleepy…', '💭 🎵', '💭 Gotta pee', '💭 Pickles??'];

const game = {
  hunger:     60,
  happiness:  70,
  babyActivity: 40,
  score:      0,
  week:       1,
  lastCraving: 0,
  lastKick:    0,
  kickCooldown: 4000,

  init() {
    this.log('👶 Pregnancy begins! Week 1...');
    this.log('Click the belly to feel the baby! Eat the cravings! 🍕');
    blob.growthR = 0;
    blob.init();
    this.updateUI();
    this.scheduleKick();
    this.scheduleWeek();
    this.scheduleThought();
  },

  scheduleKick() {
    const delay = 3000 + Math.random() * 5000;
    setTimeout(() => {
      if (this.babyActivity > 20) this.kick();
      this.scheduleKick();
    }, delay);
  },

  scheduleWeek() {
    setTimeout(() => {
      if (this.week < 40) {
        this.week++;
        blob.growthR = this.week * 2.2;
        blob.init();
        if (this.week % 4 === 0) this.log(`📅 Week ${this.week} — baby is growing!`);
        this.updateUI();
        this.scheduleWeek();
      } else {
        this.log('🎉 40 weeks! It\'s time! Final score: ' + this.score);
      }
    }, 8000);
  },

  scheduleThought() {
    setTimeout(() => {
      if (Math.random() < 0.4) {
        const t = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
        this.showThought(t);
      }
      this.scheduleThought();
    }, 5000 + Math.random() * 7000);
  },

  kick() {
    blob.applyKick();
    this.babyActivity = Math.min(100, this.babyActivity + 12);
    spawnParticles(blob.cx + (Math.random()-0.5)*60, blob.cy + (Math.random()-0.5)*60,
      `hsl(${50 + Math.random()*40},100%,60%)`, 10);
    // flash
    const flash = document.getElementById('kick-flash');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 120);
    this.log('👟 Baby kicked!');
    this.score += 5;
    this.updateUI();
  },

  bellyClick(x, y) {
    blob.applyImpulse(x, y, -14);
    spawnParticles(x, y, 'rgba(255,180,100,0.9)', 6);
    this.babyActivity = Math.min(100, this.babyActivity + 6);
    this.happiness = Math.min(100, this.happiness + 3);
    this.score += 2;
    this.updateUI();
  },

  spawnCraving() {
    const zone = document.getElementById('craving-zone');
    const food = CRAVINGS[Math.floor(Math.random() * CRAVINGS.length)];
    const el   = document.createElement('div');
    el.className = 'craving';
    el.textContent = food.emoji;
    el.title = food.name;
    // random position near edges
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 10 + Math.random() * 30; y = 20 + Math.random() * 60; }
    else if (side === 1) { x = 60 + Math.random() * 30; y = 20 + Math.random() * 60; }
    else if (side === 2) { x = 5 + Math.random() * 40; y = 50 + Math.random() * 40; }
    else { x = 55 + Math.random() * 40; y = 50 + Math.random() * 40; }
    el.style.left = x + '%';
    el.style.top  = y + '%';

    let eaten = false;
    el.addEventListener('click', () => {
      if (eaten) return;
      eaten = true;
      el.classList.add('nom');
      this.hunger    = Math.min(100, this.hunger    + food.yum);
      this.happiness = Math.min(100, this.happiness + food.yum * 0.5);
      this.score    += food.yum;
      this.log(`😋 Ate ${food.emoji} ${food.name}! +${food.yum} hunger`);
      this.showThought('😋 Yum!');
      blob.applyImpulse(blob.cx, blob.cy - blob.baseR * 0.5, -8);
      this.updateUI();
      setTimeout(() => el.remove(), 400);
    });

    // auto-despawn
    setTimeout(() => {
      if (!eaten && el.parentNode) {
        el.classList.add('nom');
        this.hunger = Math.max(0, this.hunger - 8);
        this.log(`😤 Missed a craving!`);
        this.updateUI();
        setTimeout(() => el.remove(), 350);
      }
    }, 5000 + Math.random() * 4000);

    zone.appendChild(el);
  },

  pat() {
    blob.applyPat();
    spawnParticles(blob.cx, blob.cy - blob.baseR * 0.6, 'rgba(255,100,200,0.9)', 12);
    this.happiness = Math.min(100, this.happiness + 8);
    this.babyActivity = Math.min(100, this.babyActivity + 4);
    this.showThought('🥰');
    this.score += 8;
    this.log('🤲 Patted the belly! Baby loves it.');
    this.updateUI();
  },

  sing() {
    spawnParticles(blob.cx, blob.cy - blob.baseR - 60, 'rgba(160,100,255,0.85)', 14);
    this.happiness = Math.min(100, this.happiness + 15);
    this.babyActivity = Math.min(100, this.babyActivity + 10);
    this.showThought('🎵 🎶');
    this.log('🎵 Sang a lullaby! Score +15');
    this.score += 15;
    this.updateUI();
    // disable briefly
    const btn = document.getElementById('btn-sing');
    btn.disabled = true;
    setTimeout(() => btn.disabled = false, 3000);
  },

  rest() {
    this.hunger    = Math.max(0, this.hunger    - 5);
    this.happiness = Math.min(100, this.happiness + 20);
    this.babyActivity = Math.max(0, this.babyActivity - 15);
    this.showThought('😴 zzz');
    this.log('😴 Rested. Feeling better!');
    this.score += 10;
    this.updateUI();
    const btn = document.getElementById('btn-rest');
    btn.disabled = true;
    setTimeout(() => btn.disabled = false, 5000);
  },

  showThought(text) {
    const el = document.getElementById('thought-bubble');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this._thoughtTimer);
    this._thoughtTimer = setTimeout(() => el.classList.remove('show'), 2200);
  },

  log(msg) {
    const log = document.getElementById('log');
    const el  = document.createElement('div');
    el.className = 'log-entry';
    el.textContent = msg;
    log.prepend(el);
    while (log.children.length > 6) log.lastChild.remove();
  },

  updateUI() {
    document.getElementById('week').textContent  = this.week;
    document.getElementById('score').textContent = this.score;

    const moods = this.happiness > 75 ? '😄' : this.happiness > 50 ? '😊'
      : this.happiness > 30 ? '😐' : '😩';
    document.getElementById('mood').textContent = moods;

    document.getElementById('hunger-bar').style.width    = this.hunger + '%';
    document.getElementById('happy-bar').style.width     = this.happiness + '%';
    document.getElementById('baby-bar').style.width      = this.babyActivity + '%';

    // tick down meters slowly (handled in loop)
  },

  tick() {
    // slow decay
    this.hunger       = Math.max(0, this.hunger       - 0.008);
    this.happiness    = Math.max(0, this.happiness    - 0.006);
    this.babyActivity = Math.max(0, this.babyActivity - 0.004);
  }
};

// ── input ──
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  game.bellyClick(x, y);
});

// ── craving spawner ──
setInterval(() => {
  if (document.querySelectorAll('.craving').length < 3) {
    game.spawnCraving();
  }
}, 3500);

// ── main loop ──
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

  if (ts - lastUIUpdate > 500) {
    game.updateUI();
    lastUIUpdate = ts;
  }
}

game.init();
requestAnimationFrame(loop);
