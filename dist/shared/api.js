// api.ts : semua komunikasi dengan DummyJSON
const BASE_URL = "https://dummyjson.com";
// Error khusus: server menjawab, tetapi username/password salah.
// Dibedakan dari error jaringan (server tidak terjangkau).
export class CredentialError extends Error {
}
// Langkah 1: kirim username dan password, terima accessToken
export async function loginRequest(username, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, expiresInMins: 60 }),
    });
    // DummyJSON membalas 400 untuk kredensial yang salah
    if (res.status === 400 || res.status === 401) {
        throw new CredentialError("Username atau password salah.");
    }
    if (!res.ok) {
        throw new Error(`Server membalas dengan status ${res.status}`);
    }
    return (await res.json());
}
// Langkah 2: tanya server "siapa pemilik token ini?" untuk mendapatkan role
export async function fetchProfile(token) {
    const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error(`Gagal mengambil profil (status ${res.status})`);
    }
    return (await res.json());
}
//# sourceMappingURL=api.js.map