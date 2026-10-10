// auth.ts : aturan hak akses dan perpindahan halaman berdasarkan role
import { clearSession, getSession } from "./storage.js";
// Mengubah teks dari server menjadi Role yang valid.
// Role yang tidak dikenal diperlakukan sebagai "user" (hak akses paling kecil).
export function toRole(value) {
    if (value === "admin" || value === "moderator" || value === "user") {
        return value;
    }
    return "user";
}
// Moderator disamakan dengan admin
export function isAdminLike(role) {
    return role === "admin" || role === "moderator";
}
// Halaman tujuan setelah login
export function homeFor(role) {
    return isAdminLike(role) ? "index.html" : "operator.html";
}
// ---------- Penjaga halaman (guard) ----------
// Auth Guard + Role Guard untuk index.html.
// Lolos  -> mengembalikan data sesi.
// Gagal  -> pindah ke login.html dan mengembalikan null.
export function requireAdmin() {
    const session = getSession();
    if (session === null || !isAdminLike(session.role)) {
        window.location.replace("login.html");
        return null;
    }
    return session;
}
// Logout: hapus sesi, lalu kembali ke halaman login
export function logout() {
    clearSession();
    window.location.replace("login.html");
}
//# sourceMappingURL=auth.js.map