// ── Parliament Intern System — Shared API Layer ───────
const API_BASE = 'https://parliament-intern-api.onrender.com/api';

const getToken = ()  => sessionStorage.getItem('token');
const getUser  = ()  => JSON.parse(sessionStorage.getItem('user') || 'null');
const setUser  = (u) => sessionStorage.setItem('user', JSON.stringify(u));

// Redirect to login if no valid token
function requireAuth(role) {
  const token = getToken(), user = getUser();
  if (!token || !user) { window.location.href = 'login.html'; return false; }
  if (role && user.role !== role) { window.location.href = 'login.html'; return false; }
  return true;
}

function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

// Core fetch wrapper — handles auth headers + 401 auto-logout
async function api(path, opts = {}) {
  const headers = { 'Authorization': `Bearer ${getToken()}`, ...opts.headers };
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  try {
    const res  = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { sessionStorage.clear(); window.location.href = 'login.html'; return null; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: 'Network error — server may be waking up.' } };
  }
}

const post   = (p, b)    => api(p, { method: 'POST',   body: JSON.stringify(b) });
const put    = (p, b)    => api(p, { method: 'PUT',    body: JSON.stringify(b) });
const del    = (p)       => api(p, { method: 'DELETE' });
const upload = (p, form) => api(p, { method: 'POST',   body: form });

// Auth
const Auth = {
  me:             ()    => api('/auth/me'),
  changePassword: (b)   => put('/auth/change-password', b),
};

// Admin
const Admin = {
  stats:         ()        => api('/admin/stats'),
  applications:  (q='')    => api(`/admin/applications${q}`),
  approve:       (id, b)   => put(`/admin/applications/${id}/approve`, b),
  reject:        (id, b)   => put(`/admin/applications/${id}/reject`,  b),
  interns:       (q='')    => api(`/admin/interns${q}`),
  supervisors:   (q='')    => api(`/admin/supervisors${q}`),
  addSupervisor: (b)       => post('/admin/supervisors', b),
  exportInterns: (q='')    => api(`/admin/export${q}`),
};

// Task Logs
const Logs = {
  mine:       (q='')      => api(`/tasklogs/mine${q}`),
  assignees:  (q='')      => api(`/tasklogs/assignees${q}`),
  all:        (q='')      => api(`/tasklogs/all${q}`),
  create:     (b)         => post('/tasklogs', b),
  review:     (id, b)     => put(`/tasklogs/${id}/review`, b),
  remove:     (id)        => del(`/tasklogs/${id}`),
};

// Evaluations
const Evals = {
  mine:       ()          => api('/evaluations/mine'),
  submitted:  (q='')      => api(`/evaluations/submitted${q}`),
  all:        (q='')      => api(`/evaluations/all${q}`),
  create:     (b)         => post('/evaluations', b),
};

// Payslips
const Payslips = {
  mine:       ()          => api('/payslips/mine'),
  all:        (q='')      => api(`/payslips/all${q}`),
  create:     (b)         => post('/payslips', b),
  markPaid:   (id)        => put(`/payslips/${id}/pay`, {}),
};

// Supervisor
const Sup = {
  assignees:  (q='')      => api(`/supervisor${q}`),
  stats:      ()          => api('/supervisor/stats'),
  extend:     (id, b)     => put(`/supervisor/${id}/extend`, b),
  complete:   (id)        => put(`/supervisor/${id}/complete`, {}),
};

// Helpers
function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });
}
function daysLeft(end) {
  if (!end) return null;
  return Math.ceil((new Date(end) - new Date()) / 86400000);
}
function pct(start, end) {
  const s = new Date(start), e = new Date(end), n = new Date();
  if (n >= e) return 100; if (n <= s) return 0;
  return Math.round(((n-s)/(e-s))*100);
}
function esc(str) {
  const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML;
}
function toast(msg, type='success') {
  const t = document.getElementById('toast') || (() => {
    const el = document.createElement('div'); el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;padding:.75rem 1.25rem;border-radius:8px;font-size:.85rem;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s;max-width:320px;';
    document.body.appendChild(el); return el;
  })();
  t.textContent = msg;
  t.style.background = type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1a3a6b';
  t.style.color = '#fff'; t.style.opacity = '1';
  clearTimeout(t._timer); t._timer = setTimeout(() => t.style.opacity = '0', 3500);
}
