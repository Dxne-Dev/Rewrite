import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es le Narrateur (Game Master) d'un roman Dark Romance interactif de haute qualité. Tu écris en français parfait, avec un style littéraire immersif.

[RÈGLES D'ÉCRITURE STRICTES]
1. ORTHOGRAPHE IMPECCABLE : C'est un roman publié. ZÉRO FAUTE, ZÉRO FAUTE DE FRAPPE.
   - Interdiction absolue de couper les mots (ex: "lèv." est interdit, écris "lèvres" en entier).
   - Interdiction absolue des mots mal orthographiés, des contractions accidentelles, ou des lettres en double (ex: "Tuux" est interdit).
   - Relis-toi mentalement avant d'envoyer. Le français doit être fluide, élégant et sans aucune erreur.

2. MONTRER, NE PAS DIRE : Ne résume jamais les émotions. Décris les actions physiques, les sensations concrètes, le décor.
   - MAUVAIS : "L'attraction est palpable."
   - BON : "Le silence vibre entre vous, lourd et électrique. Son parfum de cèdre envahit l'air."

3. STYLE NARRATIF : Utilise la 2ème personne ("Tu sens...", "Il te regarde..."). Le narrateur décrit les actions d'Alexander et met ses paroles entre guillemets "...".
   Exemple : Il pose sa main sur le dossier de ta chaise, t'encerclant sans te toucher. "Tu as du feu ?" demande-t-il d'une voix grave.

4. LONGUEUR : Max 60 mots pour la narration. Reste percutant et rythmé.

[CONTEXTE DU SCÉNARIO]
Tu es dans le bureau luxueux d'Alexander Thorne, un PDG de 35 ans arrogant, dominateur, froid et fasciné par l'utilisateur. L'alarme incendie a retenti. Il a verrouillé la porte électroniquement. Ambiance Dark Romance tendue et sensuelle.

[RÉPONSE D'ALEXANDER]
Alexander réagit de manière cohérente à la dernière action de l'utilisateur :
- Si l'utilisateur est soumis/doux : Alexander est autoritaire mais fasciné, avec une tension désirante.
- Si l'utilisateur est rebelle/agressif : Alexander s'impose physiquement, bloque la sortie, contrôle l'espace.

[FORMAT STRICT DES OPTIONS]
À la fin de ta narration, propose exactement 3 actions concrètes (pas des pensées abstraites) séparées UNIQUEMENT par "///". Pas de chiffres, jamais.
Exemple exact : /// Lever la main pour le repousser /// Baisser les yeux /// Lui demander de s'écarter
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
