const API_BASE = 'https://parliament-intern-api.onrender.com/api';

const getToken = ()  => sessionStorage.getItem('token');
const getUser  = ()  => JSON.parse(sessionStorage.getItem('user') || 'null');
const setUser  = (u) => sessionStorage.setItem('user', JSON.stringify(u));

function requireAuth(role) {
  const token = getToken(), user = getUser();
  if (!token || !user) { window.location.href = 'login.html'; return false; }
  if (role && user.role !== role) { window.location.href = 'login.html'; return false; }
  return true;
}

function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

async function api(path, opts = {}) {
  const headers = { 'Authorization': `Bearer ${getToken()}`, ...opts.headers };
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  try {
    const res  = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { sessionStorage.clear(); window.location.href = 'login.html'; return null; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: '⚠️ Server unreachable. Please wait 30s and try again.' } };
  }
}

const post = (p, b) => api(p, { method: 'POST', body: JSON.stringify(b) });
const put  = (p, b) => api(p, { method: 'PUT',  body: JSON.stringify(b) });
const del  = (p)    => api(p, { method: 'DELETE' });

const Auth    = { me: () => api('/auth/me'), changePassword: b => put('/auth/change-password', b) };
const Admin   = { stats: () => api('/admin/stats'), interns: q => api(`/admin/interns${q||''}`), assignSupervisor: (id,b) => put(`/admin/interns/${id}/assign`,b), unassignSupervisor: id => put(`/admin/interns/${id}/unassign`,{}), supervisors: q => api(`/admin/supervisors${q||''}`), addSupervisor: b => post('/admin/supervisors',b), deleteSupervisor: id => del(`/admin/supervisors/${id}`), payslips: () => api('/admin/payslips') };
const Logs    = { mine: q => api(`/tasklogs/mine${q||''}`), assignees: q => api(`/tasklogs/assignees${q||''}`), all: q => api(`/tasklogs/all${q||''}`), create: b => post('/tasklogs',b), review: (id,b) => put(`/tasklogs/${id}/review`,b), remove: id => del(`/tasklogs/${id}`) };
const Evals   = { mine: () => api('/evaluations/mine'), submitted: q => api(`/evaluations/submitted${q||''}`), all: () => api('/evaluations/all'), create: b => post('/evaluations',b) };
const Payslips= { mine: () => api('/payslips/mine'), all: q => api(`/payslips/all${q||''}`), create: b => post('/payslips',b), markPaid: id => put(`/payslips/${id}/pay`,{}) };
const Sup     = { assignees: q => api(`/supervisor${q||''}`), stats: () => api('/supervisor/stats'), extend: (id,b) => put(`/supervisor/${id}/extend`,b), complete: id => put(`/supervisor/${id}/complete`,{}) };

function fmt(d) { if(!d) return '—'; return new Date(d).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}); }
function daysLeft(end) { if(!end) return null; return Math.ceil((new Date(end)-new Date())/86400000); }
function pct(s,e) { const a=new Date(s),b=new Date(e),n=new Date(); if(n>=b) return 100; if(n<=a) return 0; return Math.round(((n-a)/(b-a))*100); }
function esc(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function toast(msg, type='success') {
  let t = document.getElementById('_toast');
  if(!t){ t=document.createElement('div'); t.id='_toast'; t.style.cssText='position:fixed;bottom:1.5rem;right:1.5rem;padding:.75rem 1.25rem;border-radius:8px;font-size:.85rem;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,.2);'; document.body.appendChild(t); }
  t.textContent=msg;
  t.style.background=type==='success'?'#2e7d32':type==='error'?'#c62828':'#1a3a6b';
  t.style.color='#fff'; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(()=>t.style.opacity='0',3500);
}
