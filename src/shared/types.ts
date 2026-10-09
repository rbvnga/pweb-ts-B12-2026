// types.ts : bentuk data yang dipakai bersama oleh semua halaman

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