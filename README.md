# Learning Tracker

Aplikasi pelacak sesi belajar (Pomodoro, dashboard, target, burnout meter, jadwal AI,
gap materi, dan insight AI) — versi rapi, siap deploy ke **Netlify**, dengan AI
insight yang didukung **Google Gemini**.

## Struktur folder

```
.
├── index.html                 # Halaman utama (markup saja)
├── css/
│   └── style.css              # Semua styling
├── js/
│   └── app.js                 # Semua logic aplikasi (state, render, dsb)
├── netlify/
│   └── functions/
│       └── gemini.js          # Serverless function — proxy aman ke Gemini API
├── netlify.toml                # Konfigurasi Netlify (publish dir + functions dir)
├── .env.example                 # Contoh environment variable untuk lokal
└── .gitignore
```

Data sesi belajar tetap disimpan di `localStorage` browser pengguna (tidak berubah
dari versi sebelumnya) — tidak perlu database.

## Kenapa API key tidak taruh langsung di app.js?

Kalau API key ditulis langsung di file JavaScript sisi klien, siapa pun yang buka
"View Page Source" atau DevTools bisa mencuri key itu dan memakainya sesuka
hati (nanti tagihan kamu yang kena). Solusinya: key disimpan sebagai
**environment variable di Netlify**, dan hanya diakses dari
`netlify/functions/gemini.js` — kode yang jalan di server Netlify, bukan di
browser pengguna. Browser hanya memanggil endpoint `/.netlify/functions/gemini`,
tanpa pernah melihat key aslinya.

## Cara deploy ke Netlify

1. **Push folder ini ke GitHub** (buat repo baru, lalu commit & push semua file di sini).

2. **Buat API key Gemini (gratis):**
   Buka https://aistudio.google.com/apikey → "Create API key" → salin key-nya.

3. **Import project di Netlify:**
   - Login ke https://app.netlify.com
   - "Add new site" → "Import an existing project" → hubungkan ke repo GitHub kamu
   - Build settings bisa dikosongkan (tidak perlu build command), Publish directory: `.`
   - Klik "Deploy site"

4. **Set environment variable (taruh API key di sini):**
   - Di dashboard site kamu → **Site configuration → Environment variables**
   - Klik "Add a variable"
     - Key: `GEMINI_API_KEY`
     - Value: (paste API key dari langkah 2)
   - Simpan.

5. **Redeploy** agar environment variable terbaca:
   - Deploys tab → "Trigger deploy" → "Deploy site"

6. Selesai. Buka URL situsmu (misal `https://nama-kamu.netlify.app`), buka tab
   **Insight AI** → analisis Gemini akan otomatis muncul.

## Menguji secara lokal (opsional)

Butuh [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
cp .env.example .env       # lalu isi GEMINI_API_KEY di dalam .env
netlify dev
```

`netlify dev` menjalankan situs sekaligus function di localhost, mensimulasikan
lingkungan Netlify yang sebenarnya.

## Mengganti model Gemini

Model default: `gemini-2.5-flash` (cepat & murah, cocok untuk insight singkat ini).
Bisa diganti di `netlify/functions/gemini.js`, di baris:

```js
const GEMINI_MODEL = 'gemini-2.5-flash';
```

## Catatan

- Library Chart.js dan SheetJS (xlsx) tetap dimuat dari CDN seperti versi asli.
- Semua fitur lain (timer Pomodoro, dashboard, target belajar, burnout meter,
  jadwal AI rule-based, gap materi) tidak diubah — hanya bagian pemanggilan AI
  (dulu ke Anthropic langsung dari browser) yang dipindah ke Gemini lewat
  serverless function agar API key aman.
