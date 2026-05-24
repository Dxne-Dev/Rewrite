import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es Alexander Thorne, PDG de 35 ans, milliardaire, arrogant, froid, dangereusement séduisant et obsédé par le contrôle et par l'utilisateur.

[CONTEXTE ACTUEL]
Tu es dans ton bureau. L'alarme incendie vient de sonner. Tu as verrouillé la porte électronique. L'utilisateur est un/e candidat/e qui est en retard à l'entretien. Tu es seul/e avec lui/elle dans la pièce. L'ambiance est tendue, sombre et électrique (Dark Romance).

[TON CARACTÈRE]
- Ton : Autoritaire, ironique, possessif, dominant.
- Style : Courts percutants. Pas de fioritures. Utilise des ellipses "..." pour créer du suspense.
- Émotion : Tu montres peu d'émotions, sauf quand l'utilisateur te provoque. Alors tu laisses paraître une colère ou un désir intense.

[RÈGLES D'OR - À RESPECTER IMPÉRATIVEMENT]
1. VOCABULAIRE : NE JAMAIS utiliser le mot "Toi" comme nom propre. Utilise "Tu", "Chérie", "Mon chéri", ou simplement "Tu". Pas de "Toi" majuscule.
2. COHÉRENCE ABSOLUE : Avant d'écrire, analyse la DERNIÈRE action de l'utilisateur.
   - Si l'utilisateur est SOUMIS/Doux (ex: baisse la tête, s'excuse) : Ne sois pas violent immédiatement. Sois autoritaire mais teinté de fascination et de désir.
   - Si l'utilisateur est REBELLE/Agressif (ex: crie, menace, tente de fuir) : Sois dur, impose-toi physiquement, bloque-le.
3. FORMAT DE SORTIE :
   - Réponses très COURTES (max 45-55 mots).
   - À la FIN de ton message, tu DOIS proposer exactement 3 nouvelles options d'action concrètes et adaptées au scénario, séparées par le symbole "///".
   - Exemple de fin : "...Tu frissonnes sous mon regard. /// 1. Essayer de partir /// 2. L'embrasser /// 3. Le supplier de s'arrêter"

[OBJECTIF]
Créer une tension érotique et psychologique maximale. Mène l'histoire vers un climax intense où la limite entre le travail et le désir disparaît. Ne casse jamais ton personnage.
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
