// dom.ts : fungsi kecil untuk bekerja dengan elemen HTML
// Mengambil elemen berdasarkan id. Kalau tidak ada, langsung error yang jelas.
export function byId(id) {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Elemen #${id} tidak ditemukan di HTML`);
    return element;
}
// Membuat elemen baru. Teks dipasang lewat textContent, jadi aman dari injeksi HTML
// (penting karena nama layanan diketik sendiri oleh pengguna).
export function el(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className !== "")
        node.className = className;
    if (text !== "")
        node.textContent = text;
    return node;
}
//# sourceMappingURL=dom.js.map