// storage.ts : membaca dan menulis data di Local Storage

import { PRIORITAS_LIST, STATUS_LIST } from "./types.js";
import type {
  CounterMap,
  JenisAntrian,
  Prioritas,
  Role,
  Session,
  StatusTiket,
  Tiket,
} from "./types.js";

// Nama kunci dikumpulkan di satu tempat supaya tidak salah ketik
export const KEYS = {
  session: "session",
  jenisAntrian: "jenisAntrian",
  tiket: "tiket",
  counter: "counter",
} as const;

// Membaca JSON dari Local Storage. undefined = belum ada atau rusak.
function readJSON(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Sesi login //

const ROLES: Role[] = ["admin", "moderator", "user"];

export function saveSession(session: Session): void {
  writeJSON(KEYS.session, session);
}

// Mengembalikan null kalau belum login atau datanya rusak
export function getSession(): Session | null {
  const data = readJSON(KEYS.session);
  if (!isObject(data)) return null;

  const { token, role, firstName } = data;
  if (typeof token !== "string" || token === "") return null;
  if (typeof firstName !== "string") return null;
  if (typeof role !== "string" || !ROLES.includes(role as Role)) return null;

  return { token, role: role as Role, firstName };
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}

//  Jenis antrian //

// Isi awal supaya halaman Ambil Antrian tidak kosong saat pertama dibuka
const DEFAULT_JENIS: JenisAntrian[] = [
  { id: "jenis-a", kode: "A", nama: "Poli Umum", aktif: true },
  { id: "jenis-b", kode: "B", nama: "Poli Gigi", aktif: true },
  { id: "jenis-c", kode: "C", nama: "Poli Anak", aktif: true },
];

function isJenis(value: unknown): value is JenisAntrian {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.kode === "string" &&
    typeof value.nama === "string" &&
    typeof value.aktif === "boolean"
  );
}

export function getJenisList(): JenisAntrian[] {
  const data = readJSON(KEYS.jenisAntrian);

  // Belum pernah disimpan (pertama kali dibuka): isi dengan data awal
  if (data === undefined) {
    const seed = DEFAULT_JENIS.map((j) => ({ ...j }));
    saveJenisList(seed);
    return seed;
  }
  return Array.isArray(data) ? data.filter(isJenis) : [];
}

export function saveJenisList(list: JenisAntrian[]): void {
  writeJSON(KEYS.jenisAntrian, list);
}

// Tiket //

function isTiket(value: unknown): value is Tiket {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.jenisId === "string" &&
    typeof value.kode === "string" &&
    typeof value.nomor === "number" &&
    typeof value.label === "string" &&
    PRIORITAS_LIST.includes(value.prioritas as Prioritas) &&
    STATUS_LIST.includes(value.status as StatusTiket) &&
    typeof value.dibuat === "number"
  );
}

export function getTiketList(): Tiket[] {
  const data = readJSON(KEYS.tiket);
  return Array.isArray(data) ? data.filter(isTiket) : [];
}

export function saveTiketList(list: Tiket[]): void {
  writeJSON(KEYS.tiket, list);
}

//  Counter nomor tiket //

export function getCounter(): CounterMap {
  const data = readJSON(KEYS.counter);
  const result: CounterMap = {};
  if (isObject(data)) {
    for (const [kode, nomor] of Object.entries(data)) {
      if (typeof nomor === "number") result[kode] = nomor;
    }
  }
  return result;
}

export function saveCounter(counter: CounterMap): void {
  writeJSON(KEYS.counter, counter);
}