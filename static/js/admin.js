/* ═══════════════════════════════════════════════════════════════
   ADMIN PANEL JS
   ═══════════════════════════════════════════════════════════════ */

const API = '';
let adminPassword = '';
let allPhotos = [];

// ─── LOGIN ────────────────────────────────────────────────────
const loginEl = document.getElementById('admin-login');
const dashEl = document.getElementById('admin-dash');
const loginBtn = document.getElementById('login-btn');
const passInput = document.getElementById('admin-pass');
const loginErr = document.getElementById('login-err');

loginBtn.addEventListener('click', doLogin);
passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
  const pw = passInput.value.trim();
  if (!pw) { loginErr.textContent = 'Please enter the password'; return; }

  loginBtn.disabled = true;
  loginBtn.querySelector('.btn-text').textContent = 'Logging in…';

  try {
    const res = await fetch(`${API}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();
    if (data.success) {
      adminPassword = pw;
      loginEl.style.display = 'none';
      dashEl.style.display = 'block';
      loadAdminGallery();
    } else {
      loginErr.textContent = '❌ Incorrect password. Please try again.';
    }
  } catch {
    loginErr.textContent = 'Connection error. Is the server running?';
  } finally {
    loginBtn.disabled = false;
    loginBtn.querySelector('.btn-text').textContent = 'Login';
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  adminPassword = '';
  dashEl.style.display = 'none';
  loginEl.style.display = 'flex';
  passInput.value = '';
  loginErr.textContent = '';
});

// ─── LOAD GALLERY ─────────────────────────────────────────────
async function loadAdminGallery() {
  const grid = document.getElementById('admin-grid');
  grid.innerHTML = '<div class="gallery-loader"><div class="loader-spinner"></div><p>Loading…</p></div>';

  try {
    const res = await fetch(`${API}/api/photos`);
    const data = await res.json();
    allPhotos = data.photos || [];

    updateStats();
    renderAdminGrid();
  } catch {
    grid.innerHTML = '<p style="color:#c62828;padding:2rem">Failed to load photos.</p>';
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = allPhotos.length;

  const guests = new Set(allPhotos.map(p => p.guest_name.toLowerCase())).size;
  document.getElementById('stat-guests').textContent = guests;

  const today = new Date().toDateString();
  const todayCount = allPhotos.filter(p => new Date(p.uploaded_at).toDateString() === today).length;
  document.getElementById('stat-today').textContent = todayCount;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return iso; }
}

function renderAdminGrid() {
  const grid = document.getElementById('admin-grid');
  grid.innerHTML = '';

  if (allPhotos.length === 0) {
    grid.innerHTML = '<div class="gallery-empty"><div class="empty-icon">🌸</div><p>No photos yet.</p></div>';
    return;
  }

  allPhotos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'admin-photo-card';
    card.dataset.id = photo.id;
    card.innerHTML = `
      <img src="${escapeHtml(photo.url)}" alt="Photo by ${escapeHtml(photo.guest_name)}" loading="lazy" />
      <button class="admin-photo-del" title="Delete photo" onclick="deletePhoto('${photo.id}')">🗑️</button>
      <div class="admin-photo-info">
        <div class="admin-photo-name">🌺 ${escapeHtml(photo.guest_name)}</div>
        <div class="admin-photo-time">${formatTime(photo.uploaded_at)}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.getElementById('admin-refresh').addEventListener('click', loadAdminGallery);

// ─── DELETE SINGLE PHOTO ──────────────────────────────────────
async function deletePhoto(photoId) {
  if (!confirm('Delete this photo?')) return;

  try {
    const res = await fetch(`${API}/api/admin/delete/${photoId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': adminPassword }
    });
    const data = await res.json();
    if (data.success) {
      allPhotos = allPhotos.filter(p => p.id !== photoId);
      const card = document.querySelector(`.admin-photo-card[data-id="${photoId}"]`);
      if (card) card.remove();
      updateStats();
    } else {
      alert('Failed to delete: ' + (data.error || 'Unknown error'));
    }
  } catch {
    alert('Network error. Please try again.');
  }
}
window.deletePhoto = deletePhoto;

// ─── CLEAR ALL ────────────────────────────────────────────────
const clearBtn = document.getElementById('clear-all-btn');
const modal = document.getElementById('modal-overlay');
const modalCount = document.getElementById('modal-count');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

clearBtn.addEventListener('click', () => {
  modalCount.textContent = allPhotos.length;
  modal.style.display = 'flex';
});
modalCancel.addEventListener('click', () => { modal.style.display = 'none'; });

modalConfirm.addEventListener('click', async () => {
  modalConfirm.disabled = true;
  modalConfirm.textContent = 'Deleting…';

  try {
    const res = await fetch(`${API}/api/admin/clear`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': adminPassword }
    });
    const data = await res.json();
    if (data.success) {
      modal.style.display = 'none';
      allPhotos = [];
      updateStats();
      renderAdminGrid();
    } else {
      alert('Failed: ' + (data.error || 'Unknown error'));
    }
  } catch {
    alert('Network error.');
  } finally {
    modalConfirm.disabled = false;
    modalConfirm.textContent = 'Yes, Delete All';
  }
});
