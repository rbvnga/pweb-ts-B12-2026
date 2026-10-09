// storage.ts : membaca dan menulis sesi di Local Storage
// Nama kunci dikumpulkan di satu tempat supaya tidak salah ketik
export const KEYS = {
    session: "session",
    jenisAntrian: "jenisAntrian",
    tiket: "tiket",
    counter: "counter",
};
const ROLES = ["admin", "moderator", "user"];
export function saveSession(session) {
    localStorage.setItem(KEYS.session, JSON.stringify(session));
}
// Mengembalikan null kalau belum login atau datanya rusak
export function getSession() {
    const raw = localStorage.getItem(KEYS.session);
    if (!raw)
        return null;
    try {
        const data = JSON.parse(raw);
        if (typeof data !== "object" || data === null)
            return null;
        const { token, role, firstName } = data;
        if (typeof token !== "string" || token === "")
            return null;
        if (typeof firstName !== "string")
            return null;
        if (typeof role !== "string" || !ROLES.includes(role))
            return null;
        return { token, role: role, firstName };
    }
    catch {
        // isi Local Storage bukan JSON yang valid
        return null;
    }
}
export function clearSession() {
    localStorage.removeItem(KEYS.session);
}
//# sourceMappingURL=storage.js.map