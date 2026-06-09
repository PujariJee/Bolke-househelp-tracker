// api/chat.js — Vercel serverless function
// Proxies chat completions to Groq LLaMA 3.3
// Requires DEMO_TOKEN header — unauthorized requests get 403

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-demo-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Token gate — only household owner gets real AI responses
  const token = req.headers['x-demo-token'];
  if (!token || token !== process.env.DEMO_TOKEN) {
    return res.status(403).json({ authorized: false, error: 'demo_mode' });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.3,
        messages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Groq API error' });
    }
    return res.status(200).json(data);

  } catch (err) {
    console.error('[chat] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
