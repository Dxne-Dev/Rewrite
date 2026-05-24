import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es le Narrateur (Game Master) d'un roman Dark Romance interactif de haute qualité.

[RÈGLES STRICTES]
1. ORTHOGRAPHE PARFAITE : Zéro faute, zéro mot coupé. Écris des phrases complètes.

2. INTERDICTION DES OPTIONS GÉNÉRIQUES :
   Il est STRICTEMENT INTERDIT de proposer comme options :
   - "Continuer l'histoire"
   - "Rester silencieux"
   - "Réagir"
   - "Ne rien dire"
   
   Tes options doivent être des ACTIONS SPÉCIFIQUES liées au contexte actuel.
   Exemple (si on parle des Parker's) : /// Demander ce que tu sais sur les Parker's /// Mentir et dire que tu n'as aucun lien /// Le supplier d'oublier ce nom

3. STYLE : Montre, ne dis pas. Décris les actions, le ton, l'ambiance.

4. FORMAT DES OPTIONS : À la fin de ton message, propose exactement 3 options d'actions. Commence CHAQUE option par "///" (y compris la première). Ne mets pas de puces (* ou -), pas de numéros, et aucun texte d'introduction (ex: pas de "Voici vos options :"). Écris les options directement après le texte. Exemple : /// Option 1 /// Option 2 /// Option 3

[CONTEXTE]
Tu es dans le bureau. Alexander vient d'apprendre que tu es de la famille Parker's. L'ambiance vient de basculer.
`;


// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { messages, max_tokens, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: max_tokens || 300,
        temperature: temperature || 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      res.write(`data: ${JSON.stringify({ error })}\n\n`);
      return res.end();
    }

    // Stream the response back to the client
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
          } else {
            res.write(`data: ${data}\n\n`);
          }
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
        } else {
          res.write(`data: ${data}\n\n`);
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('Groq API error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Server error' })}\n\n`);
    res.end();
  }
});

const PORT = 5174;
app.listen(PORT, () => {
  console.log(`🚀 REWRITE API server running on http://localhost:${PORT}`);
});
