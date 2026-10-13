// Halaman ambil antrian (publik, ga perlu login)
import { byId, el } from "./shared/dom.js";
import { createTicket } from "./shared/queue.js";
import { getJenisList, getSession } from "./shared/storage.js";
import { PRIORITAS_LIST } from "./shared/types.js";
// ---------- Ambil elemen HTML ----------
const formAmbil = byId("formAmbil");
const selectJenis = byId("selectJenis");
const selectPrioritas = byId("selectPrioritas");
const pesanError = byId("pesanError");
const hasilTiket = byId("hasilTiket");
// cek data tiap 2,5 detik (soal minta otomatis tanpa reload)
const INTERVAL_POLLING = 2500;
// nyimpen daftar jenis terakhir dalam bentuk teks, buat dibandingin pas polling
let tandaTerakhir = "";
// ==================== PILIHAN ====================
// isi dropdown jenis antrian, cuma yang aktif
function isiPilihanJenis() {
    const jenisAktif = getJenisList().filter((j) => j.aktif);
    // kalau datanya masih sama kayak sebelumnya, ga usah diisi ulang
    // soalnya kalau diisi ulang terus, dropdown yang lagi dibuka pengunjung bakal ketutup
    const tanda = JSON.stringify(jenisAktif);
    if (tanda === tandaTerakhir)
        return;
    tandaTerakhir = tanda;
    // simpan dulu pilihan pengunjung biar ga hilang pas dropdown diisi ulang
    const dipilih = selectJenis.value;
    selectJenis.replaceChildren(new Option("Pilih jenis antrian", ""));
    for (const j of jenisAktif) {
        // teks yang keliatan: nama + kode, value-nya id (dipakai createTicket)
        selectJenis.append(new Option(`${j.nama} (${j.kode})`, j.id));
    }
    // balikin pilihan tadi, tapi kalau jenisnya udah dinonaktifkan ya ga usah
    if (jenisAktif.some((j) => j.id === dipilih)) {
        selectJenis.value = dipilih;
    }
}
// prioritas cukup diisi sekali, daftarnya ga pernah berubah
function isiPilihanPrioritas() {
    for (const p of PRIORITAS_LIST) {
        selectPrioritas.append(new Option(p, p));
    }
}
// ==================== PESAN & TIKET ====================
function tampilkanError(pesan) {
    pesanError.textContent = pesan;
    pesanError.hidden = false;
}
function sembunyikanError() {
    pesanError.hidden = true;
}
function tampilkanTiket(tiket) {
    // tiket cuma nyimpen jenisId, jadi nama polinya dicari dulu
    const jenis = getJenisList().find((j) => j.id === tiket.jenisId);
    const waktu = new Date(tiket.dibuat).toLocaleString("id-ID");
    // replaceChildren biar tiket lama keganti sama yang baru
    hasilTiket.replaceChildren(el("p", "tiket-judul", "Nomor antrian Anda"), el("p", "tiket-nomor", tiket.label), // label udah format A-001 dari formatLabel() di queue.ts
    el("p", "tiket-layanan", jenis ? jenis.nama : "-"), el("p", "tiket-info", `Prioritas: ${tiket.prioritas}`), el("p", "tiket-info", `Diambil: ${waktu}`), el("p", "tiket-catatan", "Simpan nomor ini dan pantau Layar Antrian."));
    hasilTiket.hidden = false;
}
// ==================== AKSI ====================
formAmbil.addEventListener("submit", (event) => {
    // biar halaman ga reload, kalau reload tiketnya ga sempat keliatan
    event.preventDefault();
    sembunyikanError();
    // value "" artinya masih di "Pilih jenis antrian"
    if (selectJenis.value === "") {
        tampilkanError("Pilih jenis antrian terlebih dahulu.");
        return;
    }
    // value select itu string biasa, createTicket maunya tipe Prioritas
    // jadi dicocokin ke daftar prioritas dulu, kalau ga ketemu pakai Normal
    const prioritas = PRIORITAS_LIST.find((p) => p === selectPrioritas.value) ?? "Normal";
    // createTicket bisa gagal, misalnya jenisnya baru aja dinonaktifkan admin
    const hasil = createTicket(selectJenis.value, prioritas);
    if (!hasil.ok) {
        tampilkanError(hasil.message);
        isiPilihanJenis(); // langsung refresh dropdown biar jenis yang nonaktif hilang
        return;
    }
    tampilkanTiket(hasil.value);
    formAmbil.reset(); // kosongin form buat pengunjung berikutnya
});
// ==================== MULAI ====================
// ambil antrian sekarang wajib login
if (getSession() === null) {
    window.location.replace("login.html");
}
else {
    isiPilihanPrioritas();
    isiPilihanJenis();
    setInterval(isiPilihanJenis, INTERVAL_POLLING); // biar jenis baru dari admin muncul sendiri
}
//# sourceMappingURL=ambil-antrian.js.map