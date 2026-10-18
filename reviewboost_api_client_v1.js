// Frontend helper (Next.js). Put in e.g. lib/reviewboost_api_client_v1.js
// Set NEXT_PUBLIC_API_URL in Vercel, e.g. https://your-backend.onrender.com
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

function getToken() {
  try { return sessionStorage.getItem("rb_admin_token"); } catch { return null; }
}

async function request(path, { method = "GET", body, admin = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (admin) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res;
  try {
    res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Cannot reach the server. Please check your internet and try again.");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    const message = typeof d === "string" ? d : d?.message || (Array.isArray(d) ? d.map((e) => e.msg).join(", ") : "Something went wrong.");
    const err = new Error(message);
    err.status = res.status;
    err.code = d?.code;
    err.missing = d?.missing;
    throw err;
  }
  return data;
}

// ---------- Admin ----------
export async function adminLogin(password) {
  const data = await request("/api/admin/login", { method: "POST", body: { password } });
  try { sessionStorage.setItem("rb_admin_token", data.token); } catch {}
  return data;
}
export const getDashboard = () => request("/api/admin/dashboard", { admin: true });
export const getTemplates = () => request("/api/admin/templates", { admin: true });
export const listBusinesses = () => request("/api/admin/businesses", { admin: true });
export const getBusiness = (id) => request(`/api/admin/businesses/${id}`, { admin: true });
export const createBusiness = (b) => request("/api/admin/businesses", { method: "POST", body: b, admin: true });
export const updateBusiness = (id, b) => request(`/api/admin/businesses/${id}`, { method: "PUT", body: b, admin: true });
export const setBusinessStatus = (id, status) => request(`/api/admin/businesses/${id}/status`, { method: "PATCH", body: { status }, admin: true });
export const deleteBusiness = (id) => request(`/api/admin/businesses/${id}`, { method: "DELETE", admin: true });
// QR: use as <img src={qrUrl(id)} />  and  <a href={qrUrl(id, true)}>Download</a>
export const qrUrl = (id, download = false) => `${API}/api/qr/${id}.png${download ? "?download=true" : ""}`;

// ---------- Customer ----------
export const getPublicBusiness = (id, preview = false) => request(`/api/public/business/${id}${preview ? "?preview=true" : ""}`);
// answers: [{ category_id, rating }]  (rating = the option label)
export const generateReview = (id, answers, comment, regenerate = false) =>
  request(`/api/public/business/${id}/generate-review`, { method: "POST", body: { answers, comment, regenerate } });
export const trackCopyAndOpen = (id) => request(`/api/public/business/${id}/events`, { method: "POST", body: { event: "copy_and_open_clicked" } });
