/* ═══════════════════════════════════════════════════════════════
   SNEHA ❤️ AMAN — MAIN APP JS
   ═══════════════════════════════════════════════════════════════ */

const API = 'https://mehta-wedding.onrender.com';

// ─── FLOATING PETALS ──────────────────────────────────────────
(function initPetals() {
  const container = document.getElementById('petals');
  const emojis = ['🌸', '🌺', '🌹', '✨', '🍂'];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (8 + Math.random() * 14) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    p.style.fontSize = (0.8 + Math.random() * 0.8) + 'rem';
    container.appendChild(p);
  }
})();

// ─── DRAG & DROP ───────────────────────────────────────────────
const dropZone = document.getElementById('drop-zone');
const photoInput = document.getElementById('photo-input');
const dropPreview = document.getElementById('drop-preview');
const dropInner = document.getElementById('drop-zone-inner');
const previewImg = document.getElementById('preview-img');
const removePreviewBtn = document.getElementById('remove-preview');

let selectedFile = null;

function showPreview(file) {
  if (!file || !file.type.startsWith('image/')) return;
  selectedFile = file;
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  dropInner.style.display = 'none';
  dropPreview.style.display = 'block';
}

photoInput.addEventListener('change', (e) => {
  if (e.target.files[0]) showPreview(e.target.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) { showPreview(f); }
});

removePreviewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedFile = null;
  photoInput.value = '';
  previewImg.src = '';
  dropPreview.style.display = 'none';
  dropInner.style.display = 'flex';
});

// ─── UPLOAD FORM ───────────────────────────────────────────────
const form = document.getElementById('upload-form');
const uploadBtn = document.getElementById('upload-btn');
const statusEl = document.getElementById('upload-status');

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'upload-status ' + type;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('guest_name').value.trim();
  const file = selectedFile || photoInput.files[0];

  if (!name) { setStatus('Please enter your name 🌸', 'error'); return; }
  if (!file) { setStatus('Please choose a photo 📸', 'error'); return; }

  uploadBtn.disabled = true;
  uploadBtn.querySelector('.btn-text').textContent = 'Uploading…';
  setStatus('Sending your moment to the gallery…', 'loading');

  const formData = new FormData();
  formData.append('guest_name', name);
  formData.append('photo', file);

  try {
    const res = await fetch(`${API}/api/upload`, { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      setStatus('✨ Moment shared! Thank you for being part of our day!', 'success');
      launchConfetti();
      form.reset();
      selectedFile = null;
      photoInput.value = '';
      dropPreview.style.display = 'none';
      dropInner.style.display = 'flex';
      setTimeout(() => { loadGallery(); }, 800);
    } else {
      setStatus('Upload failed: ' + (data.error || 'Please try again'), 'error');
    }
  } catch (err) {
    setStatus('Network error. Please check connection and try again.', 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.querySelector('.btn-text').textContent = 'Share Moment';
  }
});

// ─── GALLERY ───────────────────────────────────────────────────
const galleryGrid = document.getElementById('gallery-grid');
const galleryLoader = document.getElementById('gallery-loader');
const galleryEmpty = document.getElementById('gallery-empty');
const photoCountEl = document.getElementById('photo-count');

let galleryPhotos = [];

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

function createPhotoCard(photo, delay = 0) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.style.animationDelay = delay + 'ms';
  item.dataset.id = photo.id;

  const img = document.createElement('img');
  img.src = photo.url;
  img.alt = `Photo by ${photo.guest_name}`;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.style.minHeight = (120 + Math.floor(Math.random() * 80)) + 'px';

  const meta = document.createElement('div');
  meta.className = 'gallery-item-meta';
  meta.innerHTML = `
    <div class="meta-name">${escapeHtml(photo.guest_name)}</div>
    <div class="meta-time">${formatTime(photo.uploaded_at)}</div>
  `;

  item.appendChild(img);
  item.appendChild(meta);

  item.addEventListener('click', () => openLightbox(photo));
  return item;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadGallery() {
  galleryLoader.style.display = 'block';
  galleryEmpty.style.display = 'none';

  try {
    const res = await fetch(`${API}/api/photos`);
    const data = await res.json();
    galleryPhotos = data.photos || [];

    galleryLoader.style.display = 'none';

    // Remove existing cards (keep loader and empty)
    Array.from(galleryGrid.querySelectorAll('.gallery-item')).forEach(el => el.remove());

    if (galleryPhotos.length === 0) {
      galleryEmpty.style.display = 'block';
      photoCountEl.textContent = '0 moments shared';
      return;
    }

    photoCountEl.textContent = `${galleryPhotos.length} moment${galleryPhotos.length !== 1 ? 's' : ''} shared`;

    galleryPhotos.forEach((photo, i) => {
      const card = createPhotoCard(photo, i * 60);
      galleryGrid.appendChild(card);
    });

  } catch (err) {
    galleryLoader.innerHTML = '<p style="color:#c62828">Failed to load gallery. Please refresh.</p>';
  }
}

document.getElementById('refresh-btn').addEventListener('click', loadGallery);

// ─── LIGHTBOX ──────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbName = document.getElementById('lb-name');
const lbTime = document.getElementById('lb-time');

function openLightbox(photo) {
  lbImg.src = photo.url;
  lbName.textContent = '🌺 ' + photo.guest_name;
  lbTime.textContent = formatTime(photo.uploaded_at);
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.style.display = 'none';
  document.body.style.overflow = '';
  lbImg.src = '';
}
document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-overlay').addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// ─── CONFETTI ──────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#D4AF37','#8B0000','#FF4D6D','#FDF6E3','#F5C518','#A50000','#FFD700'];
  const shapes = ['circle','rect','star'];
  const particles = Array.from({length: 120}, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 4,
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 6,
    size: 6 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    opacity: 1,
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
      if (p.opacity <= 0 || p.y > canvas.height) return;
      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        // star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? p.size / 2 : p.size / 4;
          i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });
    if (alive > 0) {
      frame = requestAnimationFrame(draw);
    } else {
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  if (frame) cancelAnimationFrame(frame);
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); canvas.style.display = 'none'; }, 5000);
}

// ─── BACKGROUND MUSIC ──────────────────────────────────────────
const audio = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
const musicLabel = document.getElementById('music-label');
let playing = false;

audio.volume = 0.3;
musicBtn.addEventListener('click', async () => {
  if (playing) {
    audio.pause();
    playing = false;
    musicLabel.textContent = 'Play Music';
  } else {
    try {
      await audio.play();
      playing = true;
      musicLabel.textContent = 'Pause Music';
    } catch {
      musicLabel.textContent = 'Music Unavailable';
    }
  }
});

// ─── AUTO-REFRESH ──────────────────────────────────────────────
loadGallery();
setInterval(loadGallery, 30000); // refresh every 30s
