// layar.ts : Layar antrian publik (tanpa login)
import { byId, el } from "./shared/dom.js";
import { getJenisList, getTiketList } from "./shared/storage.js";
import type { JenisAntrian, Tiket } from "./shared/types.js";
// ---------- Ambil elemen HTML ----------
const btnFullscreen = byId<HTMLButtonElement>("btnFullscreen");
const waktuUpdate = byId<HTMLSpanElement>("waktuUpdate");
const daftarKartu = byId<HTMLDivElement>("daftarKartu");

// Jeda polling dalam milidetik (2500 ms = 2,5 detik, sesuai soal: 2–3 detik)
const INTERVAL_POLLING = 2500;

// ==================== TAMPILAN ====================
// Membuat SATU kartu untuk SATU jenis antrian
function buatKartu(jenis: JenisAntrian, semuaTiket: Tiket[]): HTMLElement {
  // 1. Ambil tiket milik jenis ini saja
  const milikJenis = semuaTiket.filter((t) => t.jenisId === jenis.id);

  // 2. Cari tiket yang sedang dipanggil
  const dipanggil = milikJenis.find((t) => t.status === "dipanggil");

  // 3. Hitung tiket yang masih menunggu
  const jumlahMenunggu = milikJenis.filter(
    (t) => t.status === "menunggu",
  ).length;

  // ----- Rakit kartunya -----
  const kartu = el("article", "kartu");

  // Kepala: nama layanan + badge kode
  const kepala = el("div", "kartu-kepala");
  kepala.append(
    el("h2", "kartu-nama", jenis.nama),
    el("span", "kartu-kode", jenis.kode),
  );
  kartu.append(kepala);

  // Tengah: nomor yang dipanggil, atau pesan kosong
  if (dipanggil) {
    kartu.append(
      el("span", "kartu-status", "● DIPANGGIL"),
      el("p", "kartu-nomor", dipanggil.label),
    );
  } else {
    kartu.append(
      el("p", "kartu-kosong", "Belum ada nomor dipanggil"),
      el(
        "small",
        "kartu-ket",
        "Nomor akan muncul setelah operator memanggil tiket.",
      ),
    );
  }

  // Kaki: jumlah yang menunggu
  kartu.append(el("p", "kartu-menunggu", `${jumlahMenunggu} tiket menunggu`));

  return kartu;
}

function render(): void {
  // Ambil data dari Local Storage
  const semuaJenis = getJenisList();
  const jenisAktif = semuaJenis.filter((j) => j.aktif);
  const semuaTiket = getTiketList();

  // Kosongkan wadah dulu
  daftarKartu.replaceChildren();

  // Kalau tidak ada layanan aktif, tampilkan pesan
  if (jenisAktif.length === 0) {
    daftarKartu.append(el("p", "empty", "Belum ada layanan yang aktif."));
    return;
  }

  // Buat satu kartu untuk setiap jenis aktif
  for (const j of jenisAktif) {
    daftarKartu.append(buatKartu(j, semuaTiket));
  }
}

// Tulis jam saat ini ke teks "Diperbarui ..."
function updateJam(): void {
  waktuUpdate.textContent = new Date().toLocaleTimeString("id-ID");
}

// Satu kali "putaran": gambar ulang kartu, lalu perbarui jam
function perbarui(): void {
  render();
  updateJam();
}

// ==================== LAYAR PENUH ====================

// Klik tombol: masuk layar penuh kalau belum, keluar kalau sudah
btnFullscreen.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

// Teks tombol selalu mengikuti keadaan (termasuk saat keluar lewat tombol Esc)
document.addEventListener("fullscreenchange", () => {
  btnFullscreen.textContent = document.fullscreenElement
    ? "Keluar Layar Penuh"
    : "Layar Penuh";
});

// ==================== MULAI ====================

perbarui(); // 1. tampilkan langsung saat halaman dibuka
setInterval(perbarui, INTERVAL_POLLING); // 2. lalu ulangi setiap 2,5 detik
