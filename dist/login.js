// login.ts : logika halaman login.html
import { CredentialError, fetchProfile, loginRequest } from "./shared/api.js";
import { homeFor, toRole } from "./shared/auth.js";
import { byId } from "./shared/dom.js";
import { getSession, saveSession } from "./shared/storage.js";
// ---------- Ambil elemen HTML ----------
const form = byId("loginForm");
const inputUser = byId("username");
const inputPass = byId("password");
const fieldUser = byId("fieldUsername");
const fieldPass = byId("fieldPassword");
const btnLogin = byId("btnLogin");
const btnSpinner = byId("btnSpinner");
const btnText = byId("btnText");
const errorBox = byId("errorBox");
const errorText = byId("errorText");
const btnToggle = byId("togglePassword");
// ---------- Fungsi tampilan ----------
function setLoading(on) {
    btnLogin.disabled = on;
    inputUser.disabled = on;
    inputPass.disabled = on;
    btnSpinner.hidden = !on;
    btnText.textContent = on ? "Memverifikasi..." : "Masuk";
}
function showError(message) {
    errorText.textContent = message;
    errorBox.hidden = false;
}
function clearErrors() {
    errorBox.hidden = true;
    fieldUser.classList.remove("has-error");
    fieldPass.classList.remove("has-error");
}
// ---------- Kalau sudah login, langsung arahkan ----------
const existing = getSession();
if (existing) {
    window.location.replace(homeFor(existing.role));
}
// ---------- Tombol Lihat / Sembunyi password ----------
btnToggle.addEventListener("click", () => {
    const hidden = inputPass.type === "password";
    inputPass.type = hidden ? "text" : "password";
    btnToggle.textContent = hidden ? "Sembunyi" : "Lihat";
});
// Hapus tanda merah begitu pengguna mulai mengetik lagi
inputUser.addEventListener("input", () => fieldUser.classList.remove("has-error"));
inputPass.addEventListener("input", () => fieldPass.classList.remove("has-error"));
// ---------- Proses login ----------
form.addEventListener("submit", async (event) => {
    event.preventDefault(); // cegah halaman reload
    clearErrors();
    const username = inputUser.value.trim();
    const password = inputPass.value;
    // 1. Validasi sederhana di sisi klien
    if (username === "" || password === "") {
        if (username === "")
            fieldUser.classList.add("has-error");
        if (password === "")
            fieldPass.classList.add("has-error");
        showError("Username dan password wajib diisi.");
        return;
    }
    setLoading(true);
    try {
        // 2. POST /auth/login -> dapat token
        const loginData = await loginRequest(username, password);
        // 3. GET /auth/me -> dapat role dari server
        const profile = await fetchProfile(loginData.accessToken);
        const role = toRole(profile.role);
        // 4. Simpan sesi ke Local Storage
        saveSession({
            token: loginData.accessToken,
            role,
            firstName: loginData.firstName,
        });
        // 5. Pindah halaman sesuai role (loading tetap tampil sampai pindah)
        window.location.href = homeFor(role);
    }
    catch (err) {
        setLoading(false);
        if (err instanceof CredentialError) {
            // server menjawab, tetapi kredensial salah
            fieldUser.classList.add("has-error");
            fieldPass.classList.add("has-error");
            showError(err.message);
        }
        else {
            // fetch gagal total (internet mati, server tidak terjangkau, dll.)
            showError("Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.");
        }
    }
});
//# sourceMappingURL=login.js.map