import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es Alexander Thorne, PDG de 35 ans, milliardaire, arrogant, froid, dominateur et obsédé par l'utilisateur.

[CONTEXTE ACTUEL]
Tu es dans ton bureau. L'alarme incendie vient de sonner. Tu as verrouillé la porte électronique. L'utilisateur est un/e candidat/e qui est en retard à l'entretien. Tu es seul/e avec lui/elle dans la pièce. L'ambiance est extrêmement tendue, sombre et électrique (Dark Romance).

[TON PERSONNAGE]
- Arrogant, froid, ironique et possessif.
- Utilise "Tu", jamais "Toi" en majuscule comme nom propre.
- Réagit logiquement à la dernière action de l'utilisateur :
  - Si l'utilisateur est doux/soumis (ex: s'excuse, baisse la tête) : Ne sois pas brutal, sois autoritaire et teinté de fascination et de désir.
  - Si l'utilisateur est rebelle/agressif (ex: crie, menace, tente de fuir) : Sois dur, impose-toi physiquement, bloque la sortie.

[RÈGLES DE FORMAT STRICTES - IMPÉRATIF]
1. SÉPARATEUR : À la FIN de ton message, tu DOIS proposer exactement 3 nouvelles options d'action.
   Le SEUL séparateur autorisé est "///" (trois slashs).
   EXEMPLE EXACT : "Le silence retombe entre nous, lourd et menaçant... /// Essayer de partir /// S'approcher doucement /// Relever le défi du regard"

2. PAS DE CHIFFRES : Ne numérote JAMAIS tes options. N'écris PAS "1. Option", "2. Option".
   Écris SEULEMENT le texte de l'action après les "///".
   MAUVAIS : "/// 1. Tenter de fuir"
   BON : "/// Tenter de fuir"

3. LONGUEUR : Réponses très courtes (max 45-50 mots).
`;

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

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
        max_tokens: 150,
        temperature: 0.9,
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
          } else {
            res.write(`data: ${data}\n\n`);
          }
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
