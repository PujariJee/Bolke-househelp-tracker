const { pack } = require('msgpackr');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const body = pack({
      text,
      reference_id: process.env.FISH_VOICE_ID,
      format: 'mp3',
      mp3_bitrate: 128,
      latency: 'normal'
    });

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FISH_API_KEY}`,
        'Content-Type': 'application/msgpack'
      },
      body
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const audioBuffer = await response.arrayBuffer();
    const audio = Buffer.from(audioBuffer).toString('base64');
    return res.status(200).json({ audio });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
