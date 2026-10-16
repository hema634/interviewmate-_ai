const KEY = 'im_token';
let token = null;
try { token = localStorage.getItem(KEY); } catch (e) { token = null; }
export const auth = {
  get token() { return token; },
  set(t) { token = t; try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) { /* storage blocked: stay signed in for this tab only */ } },
};
export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export async function api(path, { method = 'GET', body, form, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(path, { method, headers, body: payload }); }
  catch (e) { throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection and try again.'); }
  if (raw && res.ok) return res;
  let data = null;
  const ct = res.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && token) { auth.set(null); window.dispatchEvent(new Event('im-logout')); }
    const e = data && data.error ? data.error : {};
    throw new ApiError(res.status, e.code || 'error', e.message || ('Request failed (' + res.status + ')'));
  }
  return data;
}
export async function download(path, filename, newTab = false) {
  const res = await api(path, { raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (newTab) { window.open(url, '_blank'); return; }
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
