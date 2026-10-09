// storage.ts : membaca dan menulis sesi di Local Storage

import type { Role, Session } from "./types.js";

// Nama kunci dikumpulkan di satu tempat supaya tidak salah ketik
export const KEYS = {
  session: "session",
  jenisAntrian: "jenisAntrian",
  tiket: "tiket",
  counter: "counter",
} as const;

const ROLES: Role[] = ["admin", "moderator", "user"];

export function saveSession(session: Session): void {
  localStorage.setItem(KEYS.session, JSON.stringify(session));
}

// Mengembalikan null kalau belum login atau datanya rusak
export function getSession(): Session | null {
  const raw = localStorage.getItem(KEYS.session);
  if (!raw) return null;

  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;

    const { token, role, firstName } = data as Record<string, unknown>;
    if (typeof token !== "string" || token === "") return null;
    if (typeof firstName !== "string") return null;
    if (typeof role !== "string" || !ROLES.includes(role as Role)) return null;

    return { token, role: role as Role, firstName };
  } catch {
    // isi Local Storage bukan JSON yang valid
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}