// auth.ts : Aturan role dan penjaga halaman

import { clearSession, getSession } from "./storage.js";
import type { Role, Session } from "./types.js";

// Mengubah teks dari server menjadi Role yang valid
// Role yang tidak dikenal diperlakukan sebagai "user" 
export function toRole(value: unknown): Role {
  if (value === "admin" || value === "moderator" || value === "user") {
    return value;
  }
  return "user";
}

// Moderator disamakan dengan admin
export function isAdminLike(role: Role): boolean {
  return role === "admin" || role === "moderator";
}

// Halaman tujuan setelah login
export function homeFor(role: Role): string {
  return isAdminLike(role) ? "index.html" : "operator.html";
}

// ---------- Penjaga halaman (guard) ----------

// Auth Guard + Role Guard untuk index.html.
// Lolos  -> mengembalikan data sesi.
// Gagal  -> pindah ke login.html dan mengembalikan null.
export function requireAdmin(): Session | null {
  const session = getSession();
  if (session === null || !isAdminLike(session.role)) {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

// Logout: hapus sesi, lalu kembali ke halaman login
export function logout(): void {
  clearSession();
  window.location.replace("login.html");
}