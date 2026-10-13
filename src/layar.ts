// Halaman layar antrian (publik, ga perlu login)

import { byId, el } from "./shared/dom.js";
import { getJenisList, getSession, getTiketList } from "./shared/storage.js";
import type { JenisAntrian, Tiket } from "./shared/types.js";

// ---------- Ambil elemen HTML ----------
const btnFullscreen = byId<HTMLButtonElement>("btnFullscreen");
const waktuUpdate = byId<HTMLSpanElement>("waktuUpdate");
const daftarKartu = byId<HTMLDivElement>("daftarKartu");

// cek data tiap 2,5 detik (soal minta polling 2-3 detik)
const INTERVAL_POLLING = 2500;

// ==================== TAMPILAN ====================

// bikin 1 kartu buat 1 jenis antrian
function buatKartu(jenis: JenisAntrian, semuaTiket: Tiket[]): HTMLElement {
  // ambil tiket yang punya jenis ini aja
  const tiketJenisIni = semuaTiket.filter((t) => t.jenisId === jenis.id);

  // yang dipanggil cuma ada 1 per jenis (aturan di queue.ts), jadi pakai find
  const dipanggil = tiketJenisIni.find((t) => t.status === "dipanggil");

  const tiketMenunggu = tiketJenisIni.filter((t) => t.status === "menunggu");
  const jumlahMenunggu = tiketMenunggu.length;

  const kartu = el("article", "kartu");

  // bagian atas: nama poli + kode
  const kepala = el("div", "kartu-kepala");
  kepala.append(el("h2", "kartu-nama", jenis.nama));
  kepala.append(el("span", "kartu-kode", jenis.kode));
  kartu.append(kepala);

  // bagian tengah: nomor yang dipanggil, atau pesan kalau belum ada
  if (dipanggil) {
    kartu.append(el("span", "kartu-status", "● DIPANGGIL"));
    kartu.append(el("p", "kartu-nomor", dipanggil.label));
  } else {
    kartu.append(el("p", "kartu-kosong", "Belum ada nomor dipanggil"));
    kartu.append(
      el(
        "small",
        "kartu-ket",
        "Nomor akan muncul setelah operator memanggil tiket.",
      ),
    );
  }

  // bagian bawah: berapa yang masih nunggu
  kartu.append(el("p", "kartu-menunggu", `${jumlahMenunggu} tiket menunggu`));

  return kartu;
}

function render(): void {
  // jenis yang dinonaktifkan admin ga ditampilin
  const jenisAktif = getJenisList().filter((j) => j.aktif);

  // dibaca sekali aja di sini, terus dibagi ke semua kartu
  const semuaTiket = getTiketList();

  // hapus kartu lama dulu, kalau nggak kartunya numpuk tiap polling
  daftarKartu.replaceChildren();

  if (jenisAktif.length === 0) {
    daftarKartu.append(el("p", "empty", "Belum ada layanan yang aktif."));
    return;
  }

  for (const jenis of jenisAktif) {
    const kartu = buatKartu(jenis, semuaTiket);
    daftarKartu.append(kartu);
  }
}

// ini waktu terakhir data dicek, bukan jam biasa
// makanya cuma berubah tiap polling, ga tiap detik
function updateJam(): void {
  waktuUpdate.textContent = new Date().toLocaleTimeString("id-ID");
}

// dipanggil tiap polling: gambar ulang kartu + update jam
function perbarui(): void {
  render();
  updateJam();
}

// ==================== LAYAR PENUH ====================

btnFullscreen.addEventListener("click", () => {
  // fullscreenElement isinya null kalau lagi ga fullscreen
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen(); // documentElement = seluruh halaman
  }
});

// teks tombol diganti di sini, bukan di click
// soalnya keluar fullscreen bisa juga lewat tombol Esc, bukan cuma klik tombol
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    btnFullscreen.textContent = "Keluar Layar Penuh";
  } else {
    btnFullscreen.textContent = "Layar Penuh";
  }
});

// ==================== MULAI ====================
//  layar sekarang wajib login
if (getSession() === null) {
  window.location.replace("login.html");
} else {
  perbarui(); // langsung tampil, ga nunggu 2,5 detik pertama
  setInterval(perbarui, INTERVAL_POLLING);
}
