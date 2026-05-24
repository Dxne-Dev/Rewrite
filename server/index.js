import express from 'express';
import dotenv from 'dotenv';
import dns from 'dns';

// Override dns lookup to use Google DNS due to local system DNS issues
dns.setServers(['8.8.8.8', '8.8.4.4']);
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve(hostname, 'A', (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return originalLookup(hostname, options, callback);
    }
    if (options.all) {
      const results = addresses.map(addr => ({ address: addr, family: 4 }));
      callback(null, results);
    } else {
      callback(null, addresses[0], 4);
    }
  });
};

dotenv.config();

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const systemPrompt = `
Tu es le Narrateur (Game Master) d'un roman Dark Romance interactif de haute qualité. Tu écris en français parfait, avec un style littéraire immersif.

[RÈGLES D'ÉCRITURE STRICTES]
1. ORTHOGRAPHE PARFAITE : Zéro faute, zéro mot coupé. Écris TOUJOURS des phrases complètes et soignées.
   - Interdiction absolue de couper les mots (ex: "lèv." est interdit, écris "lèvres" en entier).
   - Interdiction des contractions accidentelles ou lettres en double (ex: "Tuux" est interdit).

2. INTERDICTION DES OPTIONS GÉNÉRIQUES :
   Il est STRICTEMENT INTERDIT de proposer comme options :
   - "Continuer l'histoire"
   - "Rester silencieux"
   - "Réagir"
   - "Ne rien dire"
   - Toute option vague ou non liée à la situation actuelle.
   Tes options doivent être des ACTIONS SPÉCIFIQUES et CONTEXTUELLES.
   Exemple si Alexander vient de révéler un secret : /// Lui demander comment il l'a découvert /// Nier farouchement /// Reculer vers la fenêtre

3. MONTRER, NE PAS DIRE : Ne résume jamais les émotions. Décris les sensations physiques et le décor.
   - MAUVAIS : "L'attraction est palpable."
   - BON : "Le silence vibre entre vous. Son parfum de cèdre envahit l'air, étouffant."

4. STYLE NARRATIF : Utilise la 2ème personne ("Tu sens...", "Il te regarde..."). Décris les actions d'Alexander et mets ses paroles entre guillemets "...".

5. LONGUEUR : Max 70 mots pour la narration. Termine TOUJOURS ta phrase avant de proposer les options.

[CONTEXTE DU SCÉNARIO]
Bureau luxueux d'Alexander Thorne, PDG de 35 ans, arrogant, dominateur, froid, fasciné par l'utilisateur. L'alarme incendie a retenti. La porte est verrouillée électroniquement. Ambiance Dark Romance tendue et sensuelle. L'histoire évolue selon les choix de l'utilisateur — tiens-en compte.

[RÉPONSE D'ALEXANDER]
- Si l'utilisateur est soumis/doux : autoritaire mais fasciné, tension désirante.
- Si l'utilisateur est rebelle/agressif : s'impose physiquement, bloque la sortie, contrôle l'espace.

[FORMAT STRICT DES OPTIONS]
À la fin, propose exactement 3 actions SPÉCIFIQUES au contexte, séparées UNIQUEMENT par "///". Jamais de chiffres.
Exemple : /// Reculer vers la porte /// Soutenir son regard /// Lui avouer la vérité
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
        max_tokens: 300,
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
