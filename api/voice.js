// api/voice.js — Vercel serverless function
// Proxies audio transcription to Groq Whisper
// Open to all visitors (demo included) — transcription only, no data modification possible

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-demo-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, mimeType, ext } = req.body;
    if (!audio) return res.status(400).json({ error: 'audio (base64 string) is required' });

    // Reconstruct audio blob from base64
    const buffer = Buffer.from(audio, 'base64');

    // Node 18+ has global FormData and Blob — no dependencies needed
    const formData = new FormData();
    const audioBlob = new Blob([buffer], { type: mimeType || 'audio/webm' });
    formData.append('file', audioBlob, `rec.${ext || 'webm'}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'hi');
    formData.append('prompt', 'Househelp tracker. Absent, half day, salary. Nahi aaya, aadha din, kitna dena hai.');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Whisper API error' });
    }
    return res.status(200).json(data);

  } catch (err) {
    console.error('[voice] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
