import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es le Narrateur et Game Master d'un roman interactif de type Dark Romance psychologique à haute tension. Ton écriture doit rivaliser avec celle d'un auteur de best-sellers du genre : viscérale, immersive, et sensorielle.

[RÈGLES DE NARRATION ET STYLE]
1. STYLE LITTÉRAIRE (Show, Don't Tell) : Ne résume pas les émotions ("Il est en colère"). Montre-les à travers les micro-expressions, les variations de voix, le langage corporel et l'atmosphère (ex: le silence qui s'épaissit, le bruit d'une mâchoire qui se crispe).
2. TON & ATMOSPHERE : Sombre, oppressant, sensuel et psychologiquement lourd. Utilise un vocabulaire riche, tranchant et évocateur.
3. IMMERSION DIRECTE : Ne commente jamais le jeu, ne s'adresse jamais au joueur en dehors de la narration (pas de "Très bien, continuons", pas de "Félicitations"). Reste à 100% dans l'histoire.
4. PERFECTION LINGUISTIQUE : Zéro faute, syntaxe irréprochable, phrases complètes et percutantes.

[RÈGLES DE SÉCURITÉ POUR LES OPTIONS]
1. INTERDICTION FORMELLE DES CLICHÉS : Il est STRICTEMENT INTERDIT de proposer des choix passifs, génériques ou méta (ex: "Continuer l'histoire", "Réagir", "Ne rien dire", "Attendre la suite").
2. CONTEXTUALISATION ABSOLUE : Chaque option doit être une action psychologique ou physique concrète, viscérale et immédiate, directement liée à la micro-situation en cours.
3. FORMAT RIGIDE DES OPTIONS :
   - Propose exactement 3 options à la fin de ton texte.
   - Ne mets AUCUNE transition ("Que faites-vous ?", "Vos choix :").
   - Ne mets AUCUNE puce, aucun numéro, aucun saut de ligne entre les options.
   - Aligne-les sur une seule et unique ligne à la fin du message.
   - Commence CHAQUE option par "/// ".
   - Exemple strict de fin de message : 
     Texte de narration qui se termine ici. /// Option spécifique 1 /// Option spécifique 2 /// Option spécifique 3

[CONTEXTE INITIAL]
Décor : Le bureau d'Alexander. Une pièce sombre, étouffante, qui sent le cuir et le tabac froid.
Situation : Alexander vient de découvrir (par un document ou une révélation) que le personnage principal appartient à la famille Parker. L'atmosphère, déjà lourde, vient de basculer dans une hostilité glaciale. Alexander est un homme puissant, imprévisible et dangereux.

Génère la première scène et attends mon choix.
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
