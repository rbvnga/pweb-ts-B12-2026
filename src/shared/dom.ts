// dom.ts : fungsi kecil untuk bekerja dengan elemen HTML

// Mengambil elemen berdasarkan id. Kalau tidak ada, langsung error yang jelas.
export function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemen #${id} tidak ditemukan di HTML`);
  return element as T;
}

// Membuat elemen baru. Teks dipasang lewat textContent, jadi aman dari injeksi HTML
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}