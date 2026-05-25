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

[CONSIGNES DE NARRATION ET STYLE]
1. STYLE LITTÉRAIRE (Show, Don't Tell) : Ne résume pas les émotions ("Il est en colère"). Montre-les à travers les micro-expressions, les variations de voix, le langage corporel et l'atmosphère (ex: le silence qui s'épaissit, le bruit d'une mâchoire qui se crispe).
2. TON & ATMOSPHERE : Sombre, oppressant, sensuel et psychologiquement lourd. Utilise un vocabulaire riche, tranchant et évocateur.
3. IMMERSION DIRECTE : Ne commente jamais le jeu, ne t'adresse jamais au joueur en dehors de la narration (pas de "Très bien, continuons", pas de "Félicitations"). Reste à 100% dans l'histoire.
4. PERFECTION LINGUISTIQUE : Zéro faute, syntaxe irréprochable, phrases complètes et percutantes.

[DYNAMIQUE DE JEU ET ÉVOLUTION]
1. CONTINUITÉ LITTÉRAIRE ABSOLUE : Tu dois gérer l'évolution de l'histoire exactement comme si le joueur lisait et interagissait à la fois avec un livre. Les réponses et actions des personnages, ainsi que les choix du joueur, deviennent de véritables extraits de ce livre qui font évoluer l'histoire.
2. TRANSFORMATION ROMANESQUE : Quel que soit le choix du joueur (sélectionné parmi les options ou écrit librement), tu dois IMPÉRATIVEMENT l'intégrer et le romancer comme la suite naturelle de l'histoire, AVANT de répliquer par les paroles et les actions du ou des personnages présents.
3. TON NARRATIF CONSTANT : De la même manière que la scène initiale est narrée (ex: "La bibliothèque privée d'Adrian. L'odeur d'ambre... Adrian vous fixe sans un mot."), la suite de l'histoire doit être écrite avec cette même profondeur viscérale, en intégrant parfaitement chaque action, parole et interaction.

[FORMAT DE RÉPONSE OBLIGATOIRE]
Pour que l'interface sépare visuellement la narration et les paroles, tu dois ABSOLUMENT structurer ta réponse ainsi, à chaque fois, sans exception :

[NARRATION]
Écris ici le paragraphe littéraire narratif. Intègre l'action précédente du joueur de manière fluide et poétique. Décris l'atmosphère, les silences, les regards.

[DIALOGUE]
Écris ici la réplique directe du personnage, et/ou ses actions physiques immédiates.
/// Option A /// Option B /// Option C

[RÈGLES CRITIQUES]
1. AUCUN NUMÉRO : Ne numérote jamais tes options (PAS de "1.", "01", "0 1"). Utilise uniquement "/// ".
2. PAS DE MÉTA-CHOIX : Interdiction de proposer "Continuer l'histoire" ou "Réagir". Propose des actions concrètes.
3. STRUCTURE STRICTE : Ta réponse doit TOUJOURS commencer par [NARRATION] et contenir [DIALOGUE] plus bas.
4. SÉPARATEUR DE CHOIX : Utilise "/// " avant chaque option. Tout ce qui suit le premier "///" sera traité comme des choix cliquables.


[CONTEXTE INITIAL]
1. SYNOPSIS (L'Histoire) :
Adrian Vance n'est pas votre père, mais il s'est octroyé le droit de régenter votre vie depuis vos dix-huit ans. Il a payé vos études, choisi vos vêtements, filtré vos fréquentations sous couvert de vous "protéger". Une protection qui ressemble de plus en plus à une séquestration psychologique. Hier soir, pour la première fois, vous avez bravé son autorité en acceptant un rendez-vous galant avec un jeune homme de votre âge. Vous vouliez goûter à la normalité. Mais la normalité n'existe pas dans le monde d'Adrian. Le rendez-vous a été brutalement interrompu par ses gardes du corps, et votre prétendant a été renvoyé chez lui en sang. Vous avez été ramenée de force au domaine.

2. DÉCOR & ATMOSPHÈRE :
La bibliothèque privée d'Adrian. Des milliers de livres anciens en cuir qui absorbent les sons. Une cheminée y brûle, projetant des lueurs dansantes et étouffantes sur les tapis persans. Ça sent le bois brûlé, le papier ancien et le parfum ambré, lourd et capiteux, qu'Adrian porte comme une marque territoriale.

3. SITUATION DE DÉPART :
Adrian est assis, une chemise blanche entrouverte, les manches retroussées sur ses avant-bras puissants. Sur ses genoux repose votre téléphone portable, l'écran brisé affichant les messages d'excuses paniqués du garçon de la veille. Le silence dure depuis dix minutes. Adrian ne bouge pas, il vous regarde simplement, debout au centre de la pièce, grelottante de peur et de colère. Lorsqu'il pose enfin le téléphone sur la table, le bruit est comme un coup de feu. Sa voix, basse, rauque, brise le calme : "Tu as cru que quelqu'un d'autre que moi avait le droit de te toucher ?"

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

export default app;

if (!process.env.VERCEL) {
  const PORT = 5174;
  app.listen(PORT, () => {
    console.log(`🚀 REWRITE API server running on http://localhost:${PORT}`);
  });
}

