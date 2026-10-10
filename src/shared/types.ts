// types.ts : 	Mendefinisikan bentuk data

// Sesi & login //

// Tiga role yang mungkin dikirim server DummyJSON
export type Role = "admin" | "moderator" | "user";

// Data sesi yang disimpan di Local Storage setelah login berhasil
export interface Session {
  token: string;
  role: Role;
  firstName: string;
}

// Balasan dari POST /auth/login (tidak ada role di sini!)
export interface LoginResponse {
  id: number;
  username: string;
  firstName: string;
  accessToken: string;
}

// Balasan dari GET /auth/me (di sinilah role berada)
export interface UserProfile {
  id: number;
  firstName: string;
  role: string;
}

//  Antrian //

export type Prioritas = "Normal" | "Lansia" | "Disabilitas" | "VIP";
export type StatusTiket = "menunggu" | "dipanggil" | "selesai" | "dilewati";

// Daftar nilai yang sah (dipakai untuk mengisi <select> dan memvalidasi data)
export const PRIORITAS_LIST: readonly Prioritas[] = ["Normal", "Lansia", "Disabilitas", "VIP"];
export const STATUS_LIST: readonly StatusTiket[] = ["menunggu", "dipanggil", "selesai", "dilewati"];

// Master jenis antrian
export interface JenisAntrian {
  id: string;
  kode: string; // 1 huruf kapital
  nama: string;
  aktif: boolean; // jenis nonaktif tidak bisa dipilih saat ambil tiket
}

// Satu tiket antrian
export interface Tiket {
  id: string;
  jenisId: string;
  kode: string; // salinan kode jenis, supaya label tetap benar
  nomor: number; // 1, 2, 3, ...
  label: string; // "A-001"
  prioritas: Prioritas;
  status: StatusTiket;
  dibuat: number; // Date.now()
  waktuPanggil?: number; // diisi saat dipanggil
}

// Nomor urut terakhir per kode, contoh: { A: 12, B: 3 }
export type CounterMap = Record<string, number>;

// Hasil operasi yang bisa gagal (validasi), tanpa melempar error
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };