// Halaman operator (perlu login). Memakai modul di shared/, sama seperti admin.ts.
import { logout } from "./shared/auth.js";
import { byId, el } from "./shared/dom.js";
import { lewatiTiket, panggilTiket, selesaiTiket } from "./shared/queue.js";
import { getJenisList, getSession, getTiketList, KEYS } from "./shared/storage.js";
const LOGIN_PAGE = "login.html";
const INTERVAL_POLLING = 2000;
// ---------- Ambil elemen HTML ----------
const operatorAvatar = byId("operatorAvatar");
const operatorName = byId("operatorName");
const operatorRole = byId("operatorRole");
const btnLogout = byId("logoutBtn");
const totalWaitingCount = byId("totalWaitingCount");
const totalActiveCount = byId("totalActiveCount");
const systemClock = byId("systemClock");
const container = byId("queueOperatorContainer");
const toastContainer = byId("toastContainer");
// ==================== AUTH GUARD ====================
// Belum login -> paksa kembali ke login.html
function pastikanLogin() {
    const session = getSession();
    if (!session) {
        window.location.replace(LOGIN_PAGE);
        return null;
    }
    return session;
}
// ==================== PRIORITAS ====================
// VIP (3) > Disabilitas (2) > Lansia (1) > Normal (0)
function bobotPrioritas(prioritas) {
    switch (prioritas) {
        case "VIP":
            return 3;
        case "Disabilitas":
            return 2;
        case "Lansia":
            return 1;
        default:
            return 0;
    }
}
// Antrian yang menunggu: prioritas tertinggi dulu, lalu yang lebih dulu diambil
function urutAntrian(tiket) {
    return tiket
        .filter((t) => t.status === "menunggu")
        .sort((a, b) => {
        const selisih = bobotPrioritas(b.prioritas) - bobotPrioritas(a.prioritas);
        if (selisih !== 0)
            return selisih;
        return new Date(a.dibuat).getTime() - new Date(b.dibuat).getTime();
    });
}
// ==================== TOAST ====================
function showToast(pesan, jenis = "success") {
    const toast = el("div", `toast ${jenis}`, pesan);
    toastContainer.append(toast);
    window.setTimeout(() => toast.remove(), 3000);
}
function updateClock() {
    systemClock.textContent = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}
// ==================== AKSI ====================
// Panggil Berikutnya: tiket yang sedang dipanggil -> Selesai, lalu panggil tiket berikutnya
function panggilBerikutnya(jenis) {
    if (!pastikanLogin())
        return;
    const milik = getTiketList().filter((t) => t.jenisId === jenis.id);
    const aktif = milik.find((t) => t.status === "dipanggil");
    const berikutnya = urutAntrian(milik)[0];
    if (aktif) {
        const selesai = selesaiTiket(aktif.id);
        if (!selesai.ok) {
            showToast(selesai.message, "warning");
            render(true);
            return;
        }
    }
    if (!berikutnya) {
        showToast(`Tidak ada antrian menunggu untuk ${jenis.nama}`, "warning");
        render(true);
        return;
    }
    const hasil = panggilTiket(berikutnya.id);
    if (hasil.ok) {
        showToast(`Memanggil nomor tiket ${berikutnya.label}`, "success");
    }
    else {
        showToast(hasil.message, "warning");
    }
    render(true);
}
// Lewati: tiket berikutnya ditandai Dilewati (keluar dari antrian)
function lewatiBerikutnya(jenis) {
    if (!pastikanLogin())
        return;
    const milik = getTiketList().filter((t) => t.jenisId === jenis.id);
    const berikutnya = urutAntrian(milik)[0];
    if (!berikutnya)
        return;
    const hasil = lewatiTiket(berikutnya.id);
    if (hasil.ok) {
        showToast(`Tiket ${berikutnya.label} dilewati`, "warning");
    }
    else {
        showToast(hasil.message, "warning");
    }
    render(true);
}
// Selesai: tutup tiket yang sedang dipanggil TANPA otomatis memanggil berikutnya
function selesaikan(jenis) {
    if (!pastikanLogin())
        return;
    const aktif = getTiketList().find((t) => t.jenisId === jenis.id && t.status === "dipanggil");
    if (!aktif)
        return;
    const hasil = selesaiTiket(aktif.id);
    if (hasil.ok) {
        showToast(`Sesi layanan ${jenis.nama} diselesaikan`, "success");
    }
    else {
        showToast(hasil.message, "warning");
    }
    render(true);
}
// ==================== TAMPILAN ====================
function kotakStatus(judul, tiket) {
    const kotak = el("div", "status-box");
    kotak.append(el("span", "", judul), el("div", tiket ? "status-value" : "status-value empty", tiket ? tiket.label : "-"));
    if (tiket)
        kotak.append(el("small", "priority-tag", tiket.prioritas));
    return kotak;
}
function buatKartu(jenis, semuaTiket) {
    const milik = semuaTiket.filter((t) => t.jenisId === jenis.id);
    const dipanggil = milik.find((t) => t.status === "dipanggil");
    const antrian = urutAntrian(milik);
    const berikutnya = antrian[0];
    const kartu = el("div", "queue-card");
    const kepala = el("div", "queue-card-header");
    kepala.append(el("span", "queue-title", `${jenis.nama} (${jenis.kode})`), el("span", "waiting-badge", `${antrian.length} dalam antrian`));
    const badan = el("div", "queue-status-body");
    badan.append(kotakStatus("Sedang Dipanggil", dipanggil), kotakStatus("Berikutnya", berikutnya));
    const btnPanggil = el("button", "btn btn-call", "Panggil Berikutnya");
    btnPanggil.type = "button";
    btnPanggil.addEventListener("click", () => panggilBerikutnya(jenis));
    const btnLewati = el("button", "btn btn-skip", "Lewati");
    btnLewati.type = "button";
    btnLewati.disabled = !berikutnya;
    btnLewati.addEventListener("click", () => lewatiBerikutnya(jenis));
    const btnSelesai = el("button", "btn btn-finish", "Selesai");
    btnSelesai.type = "button";
    btnSelesai.disabled = !dipanggil;
    btnSelesai.addEventListener("click", () => selesaikan(jenis));
    const aksi = el("div", "queue-actions");
    aksi.append(btnPanggil, btnLewati, btnSelesai);
    kartu.append(kepala, badan, aksi);
    return kartu;
}
// Hanya gambar ulang kalau datanya berubah (supaya klik tidak "hilang" saat polling)
let tandaTerakhir = "";
function render(paksa = false) {
    const jenisAktif = getJenisList().filter((j) => j.aktif);
    const semuaTiket = getTiketList();
    totalWaitingCount.textContent = semuaTiket.filter((t) => t.status === "menunggu").length.toString();
    totalActiveCount.textContent = semuaTiket.filter((t) => t.status === "dipanggil").length.toString();
    const tanda = JSON.stringify([jenisAktif, semuaTiket]);
    if (!paksa && tanda === tandaTerakhir)
        return;
    tandaTerakhir = tanda;
    container.replaceChildren();
    if (jenisAktif.length === 0) {
        container.append(el("p", "no-ticket-message", "Tidak ada jenis antrian aktif saat ini. Atur melalui Dashboard Admin."));
        return;
    }
    for (const jenis of jenisAktif) {
        container.append(buatKartu(jenis, semuaTiket));
    }
}
// ==================== MULAI ====================
function start(session) {
    const nama = session.firstName || "Operator";
    operatorName.textContent = nama;
    operatorRole.textContent = `Role: ${String(session.role).toUpperCase()}`;
    operatorAvatar.textContent = nama.substring(0, 2).toUpperCase();
    btnLogout.addEventListener("click", logout);
    render(true);
    updateClock();
    window.setInterval(updateClock, 1000);
    // Polling: sesi dicek ulang + tampilan diperbarui
    window.setInterval(() => {
        if (!pastikanLogin())
            return;
        render();
    }, INTERVAL_POLLING);
    // Data/sesi berubah di tab lain
    window.addEventListener("storage", (event) => {
        if (event.key === KEYS.session && event.newValue === null) {
            logout(); // logout di tab lain: ikut keluar
            return;
        }
        if (event.key === null || event.key === KEYS.jenisAntrian || event.key === KEYS.tiket) {
            render();
        }
    });
    // Halaman dipulihkan dari cache (tombol Back setelah logout)
    window.addEventListener("pageshow", () => {
        pastikanLogin();
    });
}
const session = pastikanLogin();
if (session !== null)
    start(session);
//# sourceMappingURL=operator.js.map