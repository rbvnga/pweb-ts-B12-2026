// auth.ts : aturan hak akses dan perpindahan halaman berdasarkan role

import type { Role } from "./types.js";

// Mengubah teks dari server menjadi Role yang valid.
// Role yang tidak dikenal diperlakukan sebagai "user" (hak akses paling kecil).
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