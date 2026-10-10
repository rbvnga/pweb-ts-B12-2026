// index.ts : logika Dashboard Admin (index.html)
import { logout, requireAdmin } from "./shared/auth.js";
import { byId, el } from "./shared/dom.js";
import { addJenis, createTicket, deleteJenis, lewatiTiket, panggilTiket, resetAntrian, selesaiTiket, sortForDisplay, toggleJenis, } from "./shared/queue.js";
import { getJenisList, getTiketList, KEYS } from "./shared/storage.js";
import { PRIORITAS_LIST } from "./shared/types.js";
// ---------- Ambil elemen HTML ----------
const app = byId("app");
const navName = byId("navName");
const navRole = byId("navRole");
const btnLogout = byId("btnLogout");
const btnReset = byId("btnReset");
const notice = byId("notice");
const formJenis = byId("formJenis");
const inputKode = byId("inputKode");
const inputNama = byId("inputNama");
const jenisError = byId("jenisError");
const jenisList = byId("jenisList");
const formTiket = byId("formTiket");
const selectJenis = byId("selectJenis");
const selectPrioritas = byId("selectPrioritas");
const tiketList = byId("tiketList");
const STATUS_TEXT = {
    menunggu: "Menunggu",
    dipanggil: "Dipanggil",
    selesai: "Selesai",
    dilewati: "Dilewati",
};
// ---------- Pesan hasil aksi ----------
let noticeTimer;
function showNotice(message, kind = "ok") {
    notice.textContent = message;
    notice.className = `notice notice-${kind}`;
    notice.hidden = false;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
        notice.hidden = true;
    }, 4000);
}
// ==================== TAMPILAN ====================
function renderJenis() {
    const jenis = getJenisList();
    const tiket = getTiketList();
    jenisList.replaceChildren();
    if (jenis.length === 0) {
        jenisList.append(el("li", "empty", "Belum ada jenis antrian."));
        return;
    }
    for (const j of jenis) {
        const menunggu = tiket.filter((t) => t.jenisId === j.id && t.status === "menunggu").length;
        const item = el("li", j.aktif ? "jenis-item" : "jenis-item is-off");
        const title = el("div", "jenis-title");
        title.append(el("strong", "", j.nama), el("span", "jenis-kode", `(${j.kode})`));
        if (!j.aktif)
            title.append(el("span", "badge badge-off", "Nonaktif"));
        const info = el("div", "jenis-info");
        info.append(title, el("small", "", `${menunggu} menunggu`));
        const btnToggle = el("button", "btn btn-sm btn-outline", j.aktif ? "Nonaktifkan" : "Aktifkan");
        btnToggle.type = "button";
        btnToggle.addEventListener("click", () => {
            toggleJenis(j.id);
            render();
        });
        const btnHapus = el("button", "btn btn-sm btn-danger", "Hapus");
        btnHapus.type = "button";
        btnHapus.addEventListener("click", () => {
            const jumlah = tiket.filter((t) => t.jenisId === j.id).length;
            const pesan = `Hapus jenis antrian "${j.nama}" (${j.kode})?` +
                (jumlah > 0 ? `\n\n${jumlah} tiket milik jenis ini ikut terhapus.` : "");
            if (!confirm(pesan))
                return;
            deleteJenis(j.id);
            render();
            showNotice(`Jenis antrian "${j.nama}" dihapus.`);
        });
        const actions = el("div", "row-actions");
        actions.append(btnToggle, btnHapus);
        item.append(info, actions);
        jenisList.append(item);
    }
}
// Mengisi pilihan jenis. Hanya jenis AKTIF yang bisa dipilih.
function renderSelect() {
    const dipilih = selectJenis.value;
    const aktif = getJenisList().filter((j) => j.aktif);
    selectJenis.replaceChildren(new Option("Pilih jenis antrian", ""));
    for (const j of aktif) {
        selectJenis.append(new Option(`${j.nama} (${j.kode})`, j.id));
    }
    // Pertahankan pilihan sebelumnya kalau masih ada
    if (aktif.some((j) => j.id === dipilih))
        selectJenis.value = dipilih;
}
// Tombol aksi di baris tiket: jalankan aksi, tampilkan pesan bila gagal, lalu gambar ulang
function actionButton(text, aksi) {
    const button = el("button", "btn btn-sm btn-outline", text);
    button.type = "button";
    button.addEventListener("click", () => {
        const hasil = aksi();
        if (!hasil.ok)
            showNotice(hasil.message, "error");
        render();
    });
    return button;
}
function tiketRow(t) {
    const row = el("div", "tiket-row");
    row.append(el("strong", "tiket-label", t.label), el("span", `badge prio-${t.prioritas.toLowerCase()}`, t.prioritas), el("span", `badge status-${t.status}`, STATUS_TEXT[t.status]));
    const actions = el("div", "row-actions");
    if (t.status === "menunggu") {
        actions.append(actionButton("Panggil", () => panggilTiket(t.id)), actionButton("Lewati", () => lewatiTiket(t.id)));
    }
    else if (t.status === "dipanggil") {
        actions.append(actionButton("Selesai", () => selesaiTiket(t.id)));
    }
    row.append(actions);
    return row;
}
// Tiket dikelompokkan per jenis antrian
function renderTiket() {
    const jenis = getJenisList();
    const semuaTiket = getTiketList();
    tiketList.replaceChildren();
    if (semuaTiket.length === 0) {
        tiketList.append(el("p", "empty", "Belum ada tiket. Terbitkan tiket pertama di atas."));
        return;
    }
    for (const j of jenis) {
        const milikJenis = sortForDisplay(semuaTiket.filter((t) => t.jenisId === j.id));
        if (milikJenis.length === 0)
            continue;
        const group = el("div", "tiket-group");
        group.append(el("h3", "tiket-group-title", j.nama));
        for (const t of milikJenis)
            group.append(tiketRow(t));
        tiketList.append(group);
    }
}
function render() {
    renderJenis();
    renderSelect();
    renderTiket();
}
// ==================== AKSI PENGGUNA ====================
// Tambah jenis antrian
inputKode.addEventListener("input", () => {
    inputKode.value = inputKode.value.toUpperCase();
});
// Pesan error hilang begitu pengguna mulai mengetik lagi
for (const input of [inputKode, inputNama]) {
    input.addEventListener("input", () => {
        jenisError.hidden = true;
    });
}
formJenis.addEventListener("submit", (event) => {
    event.preventDefault();
    const hasil = addJenis(inputKode.value, inputNama.value);
    if (!hasil.ok) {
        jenisError.textContent = hasil.message;
        jenisError.hidden = false;
        return;
    }
    jenisError.hidden = true;
    formJenis.reset();
    inputKode.focus();
    render();
    showNotice(`Jenis antrian "${hasil.value.nama}" (${hasil.value.kode}) berhasil ditambahkan.`);
});
// Terbitkan tiket manual
formTiket.addEventListener("submit", (event) => {
    event.preventDefault();
    if (selectJenis.value === "") {
        showNotice("Pilih jenis antrian terlebih dahulu.", "error");
        return;
    }
    const prioritas = PRIORITAS_LIST.find((p) => p === selectPrioritas.value) ?? "Normal";
    const hasil = createTicket(selectJenis.value, prioritas);
    if (!hasil.ok) {
        showNotice(hasil.message, "error");
        render();
        return;
    }
    render();
    showNotice(`Tiket ${hasil.value.label} (${prioritas}) berhasil diterbitkan.`);
});
// Reset antrian
btnReset.addEventListener("click", () => {
    const yakin = confirm("Reset antrian?\n\nSemua tiket dihapus dan penomoran kembali ke 001.\nJenis antrian tidak ikut terhapus.");
    if (!yakin)
        return;
    resetAntrian();
    render();
    showNotice("Antrian direset. Penomoran dimulai lagi dari awal.");
});
// ==================== MULAI ====================
function start(session) {
    navName.textContent = session.firstName;
    navRole.textContent = session.role;
    btnLogout.addEventListener("click", logout);
    for (const p of PRIORITAS_LIST)
        selectPrioritas.append(new Option(p, p));
    render();
    app.hidden = false; // tampilkan halaman setelah lolos guard
    // Data berubah di tab lain (misalnya pengunjung ambil tiket): perbarui otomatis
    window.addEventListener("storage", (event) => {
        if (event.key === KEYS.session && event.newValue === null) {
            logout(); // logout di tab lain: ikut keluar
            return;
        }
        if (event.key === null || event.key === KEYS.jenisAntrian || event.key === KEYS.tiket) {
            render();
        }
    });
}
const session = requireAdmin();
if (session !== null)
    start(session);
//# sourceMappingURL=index.js.map