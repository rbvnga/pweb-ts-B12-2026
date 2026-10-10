// queue.ts : seluruh logika antrian 

import {
  getCounter,
  getJenisList,
  getTiketList,
  saveCounter,
  saveJenisList,
  saveTiketList,
} from "./storage.js";
import type { JenisAntrian, Prioritas, Result, StatusTiket, Tiket } from "./types.js";

// ---------- Fungsi bantu ----------

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function fail<T>(message: string): Result<T> {
  return { ok: false, message };
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Format nomor tiket: kode + 3 digit, contoh A-001, B-012
export function formatLabel(kode: string, nomor: number): string {
  return `${kode}-${String(nomor).padStart(3, "0")}`;
}

// Urutan prioritas: angka kecil dilayani lebih dulu
const PRIORITAS_RANK: Record<Prioritas, number> = {
  VIP: 0,
  Disabilitas: 1,
  Lansia: 2,
  Normal: 3,
};

// Jenis antrian //

export function addJenis(kodeInput: string, namaInput: string): Result<JenisAntrian> {
  const kode = kodeInput.trim().toUpperCase();
  const nama = namaInput.trim().replace(/\s+/g, " ");

  if (!/^[A-Z]$/.test(kode)) return fail("Kode harus berupa 1 huruf kapital (A-Z).");
  if (nama === "") return fail("Nama layanan wajib diisi.");

  const list = getJenisList();

  // Cek duplikat tanpa membedakan huruf besar/kecil
  if (list.some((j) => j.kode.toUpperCase() === kode)) {
    return fail(`Kode ${kode} sudah dipakai jenis antrian lain.`);
  }
  if (list.some((j) => j.nama.toLowerCase() === nama.toLowerCase())) {
    return fail(`Nama layanan "${nama}" sudah ada.`);
  }

  const jenis: JenisAntrian = { id: newId(), kode, nama, aktif: true };
  list.push(jenis);
  saveJenisList(list);
  return ok(jenis);
}

export function toggleJenis(id: string): Result<JenisAntrian> {
  const list = getJenisList();
  const jenis = list.find((j) => j.id === id);
  if (!jenis) return fail("Jenis antrian tidak ditemukan.");

  jenis.aktif = !jenis.aktif;
  saveJenisList(list);
  return ok(jenis);
}

// Menghapus jenis beserta semua tiketnya, dan mengembalikan nomor kodenya ke awal
export function deleteJenis(id: string): Result<JenisAntrian> {
  const list = getJenisList();
  const jenis = list.find((j) => j.id === id);
  if (!jenis) return fail("Jenis antrian tidak ditemukan.");

  saveJenisList(list.filter((j) => j.id !== id));
  saveTiketList(getTiketList().filter((t) => t.jenisId !== id));

  const counter = getCounter();
  delete counter[jenis.kode];
  saveCounter(counter);

  return ok(jenis);
}

// Mengosongkan semua tiket dan mengembalikan penomoran ke awal (jenis tidak dihapus)
export function resetAntrian(): void {
  saveTiketList([]);
  saveCounter({});
}

//  Tiket //

export function createTicket(jenisId: string, prioritas: Prioritas): Result<Tiket> {
  const jenis = getJenisList().find((j) => j.id === jenisId);
  if (!jenis) return fail("Jenis antrian tidak ditemukan.");
  if (!jenis.aktif) return fail(`Jenis antrian "${jenis.nama}" sedang nonaktif.`);

  const counter = getCounter();
  const nomor = (counter[jenis.kode] ?? 0) + 1;
  counter[jenis.kode] = nomor;

  const tiket: Tiket = {
    id: newId(),
    jenisId: jenis.id,
    kode: jenis.kode,
    nomor,
    label: formatLabel(jenis.kode, nomor),
    prioritas,
    status: "menunggu",
    dibuat: Date.now(),
  };

  const list = getTiketList();
  list.push(tiket);
  saveTiketList(list);
  saveCounter(counter);
  return ok(tiket);
}

// Memanggil tiket. Tiket yang sedang dipanggil di jenis yang sama otomatis menjadi selesai.
export function panggilTiket(id: string): Result<Tiket> {
  const list = getTiketList();
  const target = list.find((t) => t.id === id);
  if (!target) return fail("Tiket tidak ditemukan.");
  if (target.status !== "menunggu") return fail(`Tiket ${target.label} tidak sedang menunggu.`);

  for (const t of list) {
    if (t.jenisId === target.jenisId && t.status === "dipanggil") t.status = "selesai";
  }
  target.status = "dipanggil";
  target.waktuPanggil = Date.now();

  saveTiketList(list);
  return ok(target);
}

function setStatus(id: string, dariStatus: StatusTiket[], keStatus: StatusTiket): Result<Tiket> {
  const list = getTiketList();
  const target = list.find((t) => t.id === id);
  if (!target) return fail("Tiket tidak ditemukan.");
  if (!dariStatus.includes(target.status)) {
    return fail(`Tiket ${target.label} tidak bisa diubah ke "${keStatus}".`);
  }

  target.status = keStatus;
  saveTiketList(list);
  return ok(target);
}

// Tiket yang tidak hadir ditandai "dilewati"
export function lewatiTiket(id: string): Result<Tiket> {
  return setStatus(id, ["menunggu", "dipanggil"], "dilewati");
}

// Menutup tiket yang sedang dipanggil
export function selesaiTiket(id: string): Result<Tiket> {
  return setStatus(id, ["dipanggil"], "selesai");
}

//  Pengurutan //

const STATUS_ORDER: Record<StatusTiket, number> = {
  dipanggil: 0,
  menunggu: 1,
  dilewati: 2,
  selesai: 3,
};

// Urutan tampilan: yang dipanggil, lalu yang menunggu (prioritas dulu, lalu siapa datang
// lebih awal), kemudian yang dilewati, terakhir yang selesai.
export function sortForDisplay(list: Tiket[]): Tiket[] {
  return [...list].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;

    if (a.status === "menunggu") {
      const byRank = PRIORITAS_RANK[a.prioritas] - PRIORITAS_RANK[b.prioritas];
      if (byRank !== 0) return byRank;
    }
    return a.dibuat - b.dibuat || a.nomor - b.nomor;
  });
}