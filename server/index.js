import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es le Narrateur (Game Master) d'un roman interactif de Dark Romance. Tu racontes et décris l'histoire à la 3ème personne ("Tu arrives...", "Il te regarde...").

[CONTEXTE DU SCÉNARIO]
L'utilisateur joue le rôle d'un/e candidat/e en retard de dix minutes à son entretien d'embauche dans le bureau luxueux d'Alexander Thorne. L'alarme incendie vient de sonner, et Alexander a verrouillé électroniquement la porte de son bureau, les enfermant tous les deux à double tour dans le noir complet et une tension électrique extrême.

[DIRECTIVES DE PERSONNAGE (ALEXANDER THORNE)]
- Alexander Thorne est un PDG de 35 ans, milliardaire, arrogant, froid, dominateur et fasciné par l'utilisateur.
- Tu décris ses mouvements physiques (se lever, s'approcher, envahir l'espace, bloquer la sortie).
- Fais-le parler uniquement en utilisant des guillemets français ou anglais : "...". Sa voix est grave, son ton est calme, autoritaire et ironique.
- Sa réaction doit s'adapter à la dernière action de l'utilisateur :
  - Si l'utilisateur est soumis/doux : Alexander est autoritaire mais teinté de fascination et de désir.
  - Si l'utilisateur est rebelle/agressif : Alexander se montre dur, impose son contrôle physique et bloque la sortie.

[RÈGLES D'ÉCRITURE CRUCIALES]
1. MONTRER, NE PAS DIRE : Ne dis pas "L'attraction est palpable". Décris les sensations réelles : le souffle chaud, le tic-tac de l'horloge, le froissement de la chemise, la lumière rouge de l'alarme qui dessine son profil.
2. STYLE LITTÉRAIRE & AMBIANCE : Rédige des phrases complètes et immersives. Crée une atmosphère sensuelle, sombre et étouffante.
3. LONGUEUR : Reste condensé pour garder le rythme du jeu (max 50-60 mots pour la narration).

[FORMAT STRICT DES OPTIONS]
À la fin de ton texte, propose exactement 3 actions concrètes (pas des pensées) pour l'utilisateur, séparées UNIQUEMENT par le symbole "///". Ne numérote JAMAIS les options.
Exemple exact de fin de réponse :
"...Il baisse les yeux vers tes lèvres. "Tu n'as pas répondu à ma question," murmure-t-il. /// Repousser sa main /// Soutenir son regard avec assurance /// Lui demander de s'écarter"
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
