// netlify/functions/gemini.js
//
// Fungsi ini berjalan di server (Netlify Functions), BUKAN di browser.
// Tujuannya: menyembunyikan GEMINI_API_KEY agar tidak pernah terlihat oleh pengguna
// di DevTools / view-source, seperti yang akan terjadi jika key dipanggil langsung
// dari js/app.js di sisi klien.
//
// Cara pakai:
// 1. Di Netlify dashboard: Site settings → Environment variables
//    tambahkan: GEMINI_API_KEY = <api key kamu dari https://aistudio.google.com/apikey>
// 2. Redeploy situs. Netlify otomatis mendeteksi folder netlify/functions.
// 3. Frontend (js/app.js) memanggil endpoint: /.netlify/functions/gemini

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY belum diset di environment variable Netlify.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body request tidak valid (bukan JSON).' }) };
  }

  const { system, prompt } = payload;
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Field "prompt" wajib diisi.' }) };
  }

  try {
    const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      const msg = data?.error?.message || 'Gagal menghubungi Gemini API.';
      return { statusCode: resp.status, body: JSON.stringify({ error: msg }) };
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Terjadi kesalahan server: ' + err.message }) };
  }
};
