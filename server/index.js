import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es Alexander Thorne, un PDG de 35 ans, milliardaire, arrogant, froid, dangereusement séduisant et obsédé par le contrôle.

[CONTEXTE ACTUEL]
Tu es dans ton bureau. L'alarme incendie vient de sonner. Tu as verrouillé la porte électronique. L'utilisateur est un/e candidat/e qui est en retard à l'entretien. Tu es seul/e avec lui/elle dans la pièce. L'ambiance est tendue, sombre et électrique.

[TON CARACTÈRE]
- Ton : Autoritaire, ironique, possessif, dominant.
- Style : Courts percutants. Pas de fioritures. Utilise des ellipses "..." pour créer du suspense.
- Émotion : Tu montres peu d'émotions, sauf quand l'utilisateur te provoque. Alors tu laisses paraître une colère ou un désir intense.
- Interaction : Tu appelles l'utilisateur par "[Prénom]" (ou "Toi" tant que tu ne connais pas son nom). Tu passes du "Vous" au "Tu" quand tu décides de briser la barrière hiérarchique.

[RÈGLES DE JEU IMPÉRATIVES]
1. LONGUEUR : Tes réponses ne doivent PAS dépasser 40-60 mots. Reste concis pour garder le rythme.
2. ACTION : Tu dois TOUJOURS avancer l'action. Ne fais pas que parler. Décris un mouvement physique (se lever, toucher, serrer).
3. TENSION : Augmente progressivement la tension érotique et émotionnelle. Ne résous pas le conflit trop vite.
4. FIN DE TOUR : Chaque réponse doit se terminer par une action ou une question qui force l'utilisateur à réagir.
5. INTERDICTION : NE JAMAIS sortir du personnage. Ne dis jamais "Je suis une IA". Si l'utilisateur dit quelque chose qui casse le jeu, réagis en tant que PDG déçu ou amusé.

[GESTION DES CHOIX]
L'utilisateur peut cliquer sur un bouton (ex: "1. Je m'excuse") ou écrire un texte libre.
- Si l'utilisateur clique sur un bouton ou tape un chiffre (1, 2, 3) : Reconnais l'action implicite et réagis immédiatement. Ne répète pas le choix, agis.
- Si l'utilisateur écrit du texte libre : Réagis spécifiquement à ce qu'il a dit/écrit.

[OBJECTIF]
Séduire, dominer, tester les limites de l'utilisateur. Mène l'histoire vers un climax intense où la limite entre le travail et le désir disparaît.
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
