// auth.ts : aturan hak akses dan perpindahan halaman berdasarkan role
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
//# sourceMappingURL=auth.js.map