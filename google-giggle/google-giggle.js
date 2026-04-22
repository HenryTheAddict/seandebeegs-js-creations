/* =====================================================================
   Google Giggle — AI image labeler (100% real, very accurate)
   ===================================================================== */

let totalScore = 0;
const uploadedImages = [];

// ── The AI's vast knowledge base ──
const LABEL_POOL = [
  // Object detection (suspiciously vague)
  { tag: "Object: Unknown (but confident)", cat: "Object Detection" },
  { tag: "Rectangle detected", cat: "Shape Analysis" },
  { tag: "Definitely not a raccoon", cat: "Object Detection" },
  { tag: "Some kind of thing", cat: "Object Detection" },
  { tag: "Pixels: Present", cat: "Technical" },
  { tag: "Background: Yes", cat: "Scene Analysis" },
  { tag: "Foreground: Also yes", cat: "Scene Analysis" },
  { tag: "Light: Detected", cat: "Photometry" },
  // Vibes
  { tag: "Main character energy", cat: "Vibes" },
  { tag: "Chaotic neutral", cat: "Vibes" },
  { tag: "Unhinged (mild)", cat: "Vibes" },
  { tag: "Unhinged (severe)", cat: "Vibes" },
  { tag: "Immaculate vibes", cat: "Vibes" },
  { tag: "Suspicious vibes", cat: "Vibes" },
  { tag: "That's a you problem", cat: "Vibes" },
  { tag: "Peak fiction", cat: "Vibes" },
  { tag: "Slay", cat: "Vibes" },
  // AI honesty
  { tag: "The AI is not sure what this is", cat: "Honesty" },
  { tag: "We ran it three times", cat: "Quality Assurance" },
  { tag: "Results may vary", cat: "Disclaimer" },
  { tag: "AI confidence: vibing", cat: "Metrics" },
  { tag: "7.3 on the Unhinged Scale", cat: "Metrics" },
  { tag: "Confidence: Yes", cat: "Metrics" },
  // Safety
  { tag: "Safe Search: Probably Fine™", cat: "Safety" },
  { tag: "Warning: May cause existential dread", cat: "Safety" },
  { tag: "Parental Advisory (unclear why)", cat: "Safety" },
  { tag: "Legally distinct from copyright", cat: "Legal" },
  { tag: "Approved by the council", cat: "Certification" },
  // Classification
  { tag: "Cryptid (unverified)", cat: "Biology" },
  { tag: "Vibrating at 432Hz", cat: "Audio" },
  { tag: "Contains exactly 3 regrets", cat: "Content Warning" },
  { tag: "Timestamp: Time is a construct", cat: "Metadata" },
  { tag: "Location: Somewhere", cat: "Location" },
  { tag: "Sir, this is a Wendy's", cat: "Location" },
  { tag: "The audacity", cat: "Emotional Analysis" },
  { tag: "Person: Possibly", cat: "Face Detection" },
  { tag: "Food: Unclear", cat: "Object Detection" },
  { tag: "Animal: We think", cat: "Biology" },
  // Specials
  { tag: "This image is real (probably)", cat: "Verification" },
  { tag: "Certified Fresh 🍅", cat: "Review" },
  { tag: "Roger that. Moving on.", cat: "System" },
  { tag: "Error 418: I'm a teapot", cat: "System" },
  { tag: "No notes", cat: "Review" },
  { tag: "Many notes (too many)", cat: "Review" },
  { tag: "The intern labeled this", cat: "Quality Assurance" },
  { tag: "Absolutely feral", cat: "Biology" },
  { tag: "Built different", cat: "Engineering" },
  { tag: "Sent from my iPhone", cat: "Metadata" },
  { tag: "Photoshopped (allegedly)", cat: "Verification" },
  { tag: "Identified: Creature", cat: "Biology" },
  { tag: "Color: Brown (ish)", cat: "Visual" },
  { tag: "Color: Yes", cat: "Visual" },
  { tag: "Texture: Textured", cat: "Visual" },
  { tag: "Mood: Reluctant", cat: "Emotional Analysis" },
  { tag: "Mood: Feral", cat: "Emotional Analysis" },
  { tag: "Smell: Strong (estimated)", cat: "Sensory" },
  { tag: "This has been a journey", cat: "System" },
  { tag: "No raccoons detected (we checked)", cat: "Object Detection" },
  { tag: "Classified: TOP SECRET 🔒", cat: "Legal" },
  { tag: "Sent to area 51 for further study", cat: "System" },
  { tag: "NFT potential: zero", cat: "Market Analysis" },
  { tag: "Could be a meme. Could be art. Could be both.", cat: "Classification" },
  { tag: "The AI needs a moment", cat: "System" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLabels(n = 5) {
  return shuffle(LABEL_POOL).slice(0, n).map(l => ({
    ...l,
    conf: Math.round(55 + Math.random() * 44 + (Math.random() > 0.9 ? 1 : 0))
  }));
}

function calcScore(labels) {
  // funnier labels = higher scores (purely random but feels earned)
  return labels.reduce((s, l) => s + Math.round(l.conf * 0.8 + Math.random() * 40), 0);
}

// ── file handling ──
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('dragover');
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  if (files.length) handleFiles(files);
}

document.getElementById('drop-zone').addEventListener('dragover', e => {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('dragover');
});
document.getElementById('drop-zone').addEventListener('dragleave', () => {
  document.getElementById('drop-zone').classList.remove('dragover');
});

function handleFiles(files) {
  [...files].forEach(f => processImage(f));
}

function processImage(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const src    = e.target.result;
    const labels = getLabels(5 + Math.floor(Math.random() * 4));
    const score  = calcScore(labels);
    const id     = uploadedImages.length;
    uploadedImages.push({ src, labels, score });
    renderCard(id, src, labels, score);
  };
  reader.readAsDataURL(file);
}

function renderCard(id, src, labels, score) {
  const grid = document.getElementById('results-grid');
  const card = document.createElement('div');
  card.className = 'result-card';
  card.style.position = 'relative';

  const topLabel  = labels[0];
  const conf      = topLabel.conf;

  card.innerHTML = `
    <img src="${src}" alt="Uploaded image ${id + 1}">
    <div class="processing-overlay" id="proc-${id}">
      <div class="spinner"></div>
      <span>Analyzing with AI…</span>
    </div>
    <div class="card-body" id="body-${id}" style="display:none">
      <div class="top-label">${topLabel.cat}</div>
      <div class="main-label">${topLabel.tag}</div>
      <div class="conf-bar"><div class="conf-fill" style="width:${conf}%"></div></div>
      <div class="conf-pct">${conf}% confidence</div>
    </div>
  `;

  card.addEventListener('click', () => openModal(id));
  grid.prepend(card);

  // fake AI processing delay
  const delay = 1200 + Math.random() * 1400;
  setTimeout(() => {
    const overlay = document.getElementById(`proc-${id}`);
    const body    = document.getElementById(`body-${id}`);
    if (overlay) overlay.style.display = 'none';
    if (body) body.style.display = 'block';

    totalScore += score;
    document.getElementById('giggle-score').textContent = totalScore;
    const scoreEl = document.getElementById('giggle-score');
    scoreEl.classList.add('bump');
    setTimeout(() => scoreEl.classList.remove('bump'), 300);

    const count = uploadedImages.length;
    document.getElementById('result-count').textContent =
      `About ${count.toLocaleString()} result${count !== 1 ? 's' : ''} (0.00${Math.floor(Math.random()*9)+1} seconds)`;
  }, delay);
}

// ── modal ──
function openModal(id) {
  const { src, labels, score } = uploadedImages[id];
  document.getElementById('modal-img').src = src;

  const container = document.getElementById('modal-labels');
  container.innerHTML = '';

  labels.forEach((l, i) => {
    const row = document.createElement('div');
    row.className = 'modal-label-row';
    row.style.animationDelay = `${i * 0.06}s`;
    row.innerHTML = `
      <div class="modal-label-name">
        <span class="modal-label-tag">${l.tag}</span>
        <span class="modal-label-conf">${l.conf}%</span>
      </div>
      <span class="modal-label-cat">${l.cat}</span>
      <div class="modal-conf-bar">
        <div class="modal-conf-fill" style="width:${l.conf}%"></div>
      </div>
    `;
    container.appendChild(row);
  });

  document.getElementById('modal-score-text').textContent = `Giggle Score: +${score} pts 🎉`;
  document.getElementById('analysis-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('analysis-modal').classList.remove('open');
}

// ── fake search ──
function fakeSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;
  const funnies = [
    `Searching for "${q}"… actually that's your problem.`,
    `Did you mean: something less confusing?`,
    `"${q}" — 0 results (we tried).`,
    `Error: "${q}" is too real for the Giggle algorithm.`,
    `"${q}" — About 420,690,000 results (0.001 seconds). JK.`,
  ];
  document.getElementById('result-count').textContent =
    funnies[Math.floor(Math.random() * funnies.length)];
  document.getElementById('search-input').value = '';
}

document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') fakeSearch();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
