import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  type: 'narrator' | 'incoming' | 'outgoing' | 'choices';
  text?: string;
  choices?: string[];
}

type ChatDemoProps = {
  isBetaUnlocked: boolean;
  onOpenForm: () => void;
};

// Initial choices shown to the user at the start
const INITIAL_CHOICES = [
  "Je relève le menton, soutenant son regard sans reculer.",
  "Je baisse les yeux, murmurant des excuses étouffées.",
  "Je fais un pas en arrière : « Il ne me touchait pas ! »",
];

async function streamGroqResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 300 }),
    });

    if (!response.ok || !response.body) {
      onError('Erreur serveur');
      return;
    }

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
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // skip malformed JSON
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // skip malformed JSON
        }
      }
    }
    onDone();
  } catch (err) {
    onError('Erreur de connexion');
  }
}

export default function ChatDemo({ isBetaUnlocked, onOpenForm }: ChatDemoProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  // API history sent to Groq (role/content only)
  const [apiHistory, setApiHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDemoEnded, setIsDemoEnded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [headerStatus, setHeaderStatus] = useState('En ligne');
  const [streamingText, setStreamingText] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamingText]);

  // Init on unlock with premium sequential typing animations and delays
  useEffect(() => {
    if (isBetaUnlocked) {
      // If we are transitioning from the 3 static preview messages, play the live unlock animation
      const isLiveUnlock = messages.length === 3 && !messages.some(m => m.type === 'choices');

      if (isLiveUnlock) {
        // Clear and show only the first narrator text to start the sequence
        setMessages([
          {
            id: 'n1',
            role: 'assistant',
            type: 'narrator',
            text: "La bibliothèque privée d'Adrian. L'odeur d'ambre et de bois brûlé est étouffante. Le silence dure depuis dix minutes. Adrian vous fixe sans un mot.",
          }
        ]);

        // 1. After 1s, show Adrian starts typing
        const t1 = setTimeout(() => {
          setIsTyping(true);
          setHeaderStatus('Écrit...');
        }, 1000);

        // 2. After 2.6s, post the first message
        const t2 = setTimeout(() => {
          setIsTyping(false);
          setHeaderStatus('En ligne');
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg1',
              role: 'assistant',
              type: 'incoming',
              text: "Adrian est assis, sa chemise blanche entrouverte, les manches retroussées. Sur ses genoux repose votre téléphone portable à l'écran brisé.",
            }
          ]);
        }, 2600);

        // 3. After 3.6s, Adrian starts typing again
        const t3 = setTimeout(() => {
          setIsTyping(true);
          setHeaderStatus('Écrit...');
        }, 3600);

        // 4. After 5.2s, post the second message and show the choices
        const t4 = setTimeout(() => {
          setIsTyping(false);
          setHeaderStatus('En ligne');
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg2',
              role: 'assistant',
              type: 'incoming',
              text: "Il pose enfin le téléphone sur la table de bois sombre avec un bruit sec. Ses yeux d'acier se plantent dans les vôtres. « Tu as cru que quelqu'un d'autre que moi avait le droit de te toucher ? »",
            },
            {
              id: 'choices1',
              role: 'assistant',
              type: 'choices',
              choices: INITIAL_CHOICES,
            }
          ]);
          setApiHistory([
            {
              role: 'assistant',
              content: "La bibliothèque privée d'Adrian. L'odeur d'ambre et de bois brûlé est étouffante. Le silence dure depuis dix minutes. Adrian vous fixe sans un mot. Adrian est assis, sa chemise blanche entrouverte, les manches retroussées. Sur ses genoux repose votre téléphone portable à l'écran brisé. Il pose enfin le téléphone sur la table de bois sombre avec un bruit sec. Ses yeux d'acier se plantent dans les vôtres. « Tu as cru que quelqu'un d'autre que moi avait le droit de te toucher ? »",
            },
          ]);
        }, 5200);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      } else {
        // Instant load on direct page load (e.g. reload when already unlocked)
        setMessages([
          {
            id: 'n1',
            role: 'assistant',
            type: 'narrator',
            text: "La bibliothèque privée d'Adrian. L'odeur d'ambre et de bois brûlé est étouffante. Le silence dure depuis dix minutes. Adrian vous fixe sans un mot.",
          },
          {
            id: 'msg1',
            role: 'assistant',
            type: 'incoming',
            text: "Adrian est assis, sa chemise blanche entrouverte, les manches retroussées. Sur ses genoux repose votre téléphone portable à l'écran brisé.",
          },
          {
            id: 'msg2',
            role: 'assistant',
            type: 'incoming',
            text: "Il pose enfin le téléphone sur la table de bois sombre avec un bruit sec. Ses yeux d'acier se plantent dans les vôtres. « Tu as cru que quelqu'un d'autre que moi avait le droit de te toucher ? »",
          },
          {
            id: 'choices1',
            role: 'assistant',
            type: 'choices',
            choices: INITIAL_CHOICES,
          },
        ]);
        setApiHistory([
          {
            role: 'assistant',
            content: "La bibliothèque privée d'Adrian. L'odeur d'ambre et de bois brûlé est étouffante. Le silence dure depuis dix minutes. Adrian vous fixe sans un mot. Adrian est assis, sa chemise blanche entrouverte, les manches retroussées. Sur ses genoux repose votre téléphone portable à l'écran brisé. Il pose enfin le téléphone sur la table de bois sombre avec un bruit sec. Ses yeux d'acier se plantent dans les vôtres. « Tu as cru que quelqu'un d'autre que moi avait le droit de te toucher ? »",
          },
        ]);
      }
    } else {
      // Static preview behind blur
      setMessages([
        {
          id: 'n1',
          role: 'assistant',
          type: 'narrator',
          text: "La bibliothèque privée d'Adrian. L'odeur d'ambre et de bois brûlé est étouffante. Le silence dure depuis dix minutes.",
        },
        {
          id: 'msg1',
          role: 'assistant',
          type: 'incoming',
          text: "Adrian est assis, sa chemise blanche entrouverte, les manches retroussées. Sur ses genoux repose votre téléphone portable à l'écran brisé.",
        },
        {
          id: 'msg2',
          role: 'assistant',
          type: 'incoming',
          text: "Il pose enfin le téléphone sur la table de bois sombre avec un bruit sec. Ses yeux d'acier se plantent dans les vôtres. « Tu as cru que quelqu'un d'autre que moi avait le droit de te toucher ? »",
        },
      ]);
    }
  }, [isBetaUnlocked]);

  const sendMessage = async (userText: string) => {
    if (isTyping || isDemoEnded) return;

    const outId = 'out-' + Date.now();
    const currentProgress = progress + 1;

    // Add user message, remove choices
    setMessages((prev) => [
      ...prev.filter((m) => m.type !== 'choices'),
      { id: outId, role: 'user', type: 'outgoing', text: userText },
    ]);

    const newHistory: { role: 'user' | 'assistant'; content: string }[] = [
      ...apiHistory,
      { role: 'user', content: userText },
    ];
    setApiHistory(newHistory);
    setProgress(currentProgress);

    if (currentProgress >= 10) {
      setIsDemoEnded(true);
      setHeaderStatus('Démo terminée');
      return;
    }

    // Show typing
    setIsTyping(true);
    setHeaderStatus('Écrit...');

    // Small delay before streaming starts
    await new Promise((r) => setTimeout(r, 600));

    // We will use two separate IDs for narration and dialogue to stream into them
    const narrationId = 'narr-' + Date.now();
    const dialogueId = 'diag-' + Date.now();
    
    setIsTyping(false);

    let fullText = '';

    await streamGroqResponse(
      newHistory,
      // onChunk
      (chunk) => {
        fullText += chunk;
        
        // Parse the tags
        const narrationMatch = fullText.match(/\[NARRATION\]([\s\S]*?)(?=\[DIALOGUE\]|(\/\/\/)|$)/i);
        const dialogueMatch = fullText.match(/\[DIALOGUE\]([\s\S]*?)(?=(\/\/\/)|$)/i);

        let narrationText = narrationMatch ? narrationMatch[1].trim() : '';
        let dialogueText = dialogueMatch ? dialogueMatch[1].trim() : '';

        // Fallback: if no tags are detected yet but there is text, 
        // and we haven't reached the dialogue part yet, show it as dialogue
        if (!narrationText && !dialogueText && fullText.trim()) {
          dialogueText = fullText.split('///')[0].trim();
        }

        setMessages((prev) => {
          let newMessages = [...prev];
          
          // Handle Narration
          if (narrationText) {
            const existingNarrIdx = newMessages.findIndex(m => m.id === narrationId);
            if (existingNarrIdx === -1) {
              newMessages.push({ id: narrationId, role: 'assistant', type: 'narrator', text: narrationText });
            } else {
              newMessages[existingNarrIdx] = { ...newMessages[existingNarrIdx], text: narrationText };
            }
          }

          // Handle Dialogue
          if (dialogueText) {
            const existingDiagIdx = newMessages.findIndex(m => m.id === dialogueId);
            if (existingDiagIdx === -1) {
              newMessages.push({ id: dialogueId, role: 'assistant', type: 'incoming', text: dialogueText });
            } else {
              newMessages[existingDiagIdx] = { ...newMessages[existingDiagIdx], text: dialogueText };
            }
          }

          return newMessages;
        });
      },
      // onDone
      () => {
        setHeaderStatus('En ligne');
        
        setApiHistory((prev) => [
          ...prev,
          { role: 'assistant', content: fullText },
        ]);

        // Parse dynamic choices from the response using '///'
        let choicesList: string[] = [];
        if (fullText.includes('///')) {
          choicesList = fullText
            .split('///')
            .slice(1)
            .map((opt) => opt.trim().replace(/^[0-9]+[\.\-\)\s]+/, '').trim())
            .filter(Boolean);
        }

        // Fallback options
        if (choicesList.length < 2) {
          choicesList = [
            "Je reste silencieuse.",
            "Je détourne le regard.",
            "Je réponds avec défi.",
          ];
        }

        // Add follow-up choices after a short pause
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: 'choices-' + Date.now(),
              role: 'assistant',
              type: 'choices',
              choices: choicesList,
            },
          ]);
        }, 800);
      },
      // onError
      (err) => {
        setHeaderStatus('En ligne');
        setMessages((prev) => [
          ...prev,
          { id: 'err-' + Date.now(), role: 'assistant', type: 'incoming', text: `[Erreur: ${err}]` }
        ]);
      }
    );
  };

  const handleChoice = (choice: string) => {
    sendMessage(choice);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    const text = inputValue.trim();
    setInputValue('');
    sendMessage(text);
  };

  return (
    <section className="py-16 px-4 md:px-6 relative flex flex-col items-center bg-black/60">
      <div className="w-full max-w-5xl h-[650px] rounded-2xl border border-app-border overflow-hidden flex bg-app-bg text-[15px] shadow-2xl relative z-10">

        {/* Blur Unlock Overlay */}
        <div
          className={`absolute inset-0 bg-neutral-950/40 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-6 text-center transition-all duration-1000 ease-in-out ${
            isBetaUnlocked ? 'opacity-0 pointer-events-none scale-95 blur-md' : 'opacity-100 scale-100'
          }`}
        >
          <div className="max-w-md bg-neutral-950/80 border border-purple-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col items-center gap-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-purple-500/30 flex items-center justify-center relative shadow-[0_0_20px_rgba(168,85,247,0.2)] shrink-0">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping opacity-60" />
              <svg className="w-6 h-6 text-purple-400 relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <div className="flex flex-col gap-2 relative z-10">
              <h3 className="text-xl md:text-2xl font-serif font-medium text-white tracking-wide">
                Prêt à réécrire l'histoire ?
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Découvrez l'expérience interactive en direct. Rejoignez notre bêta fermée gratuite pour déverrouiller le simulateur de dialogue.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenForm}
              className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-medium py-3.5 px-8 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] cursor-pointer overflow-hidden relative z-10 shrink-0"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]" />
              <span className="relative z-10">Tester la démo</span>
              <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden sm:flex w-[280px] min-w-[280px] bg-app-sidebar border-r border-app-border flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-app-border shrink-0">
            <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-app-text-dim mb-3.5">
              En lecture
            </div>
            <div className="w-full aspect-[2/3] rounded-lg overflow-hidden relative bg-gradient-to-br from-[#1a0a0a] via-[#2d1515] to-[#1a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] book-cover-texture flex flex-col items-center justify-center p-6">
              <div className="absolute top-2.5 right-2.5 bg-app-gold text-black text-[8px] font-bold tracking-[1px] uppercase py-[3px] px-[7px] rounded-[3px] z-20">
                BETA
              </div>
              <img
                alt="Le PDG Book Cover"
                className="absolute inset-0 w-full h-full object-cover z-10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZrYb8t1PZEqfrLSg8VQ-Whx7GlY634Uro6kZer_L4fBHFrY02KfLcmUF8lV5-ABtRcf0ZOfpm4EigugB1mz02yPB88hrELK9NUp_bFt3BPuj0N0BpSgrUkySAqqcuCaOrr29UszVz25J2eogvs6mbXrUXsgnnxFNMTFvUAJcGH1IpwqwPMWDIRl86iL8D6jmAFd3Iumg1Uiazd4lLqm246fAQca4gUlgPtL7XgxtvYufpLiWgWmJIaQjmX5xRAAD-eOzrLv1591E"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
            <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-app-text-dim mb-2.5">
              Synopsis
            </div>
            <div className="text-[13px] leading-[1.65] text-app-text-sec italic">
              Adrian Vance s'est octroyé le droit de régenter votre vie. Hier soir, vous avez bravé son autorité pour un simple rendez-vous galant. La sanction a été immédiate : rapatriée de force. Maintenant, seule face à lui dans sa bibliothèque, chaque mot peut vous sauver ou vous perdre. Succomberez-vous à son emprise ?
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              <span className="bg-[rgba(10,132,255,0.15)] text-app-blue text-[10px] font-medium py-[3px] px-2.5 rounded-full border border-[rgba(10,132,255,0.2)]">
                Romance
              </span>
              <span className="bg-[rgba(10,132,255,0.15)] text-app-blue text-[10px] font-medium py-[3px] px-2.5 rounded-full border border-[rgba(10,132,255,0.2)]">
                Thriller
              </span>
              <span className="bg-[rgba(10,132,255,0.15)] text-app-blue text-[10px] font-medium py-[3px] px-2.5 rounded-full border border-[rgba(10,132,255,0.2)]">
                Interactif
              </span>
            </div>
          </div>

          <div className="px-5 py-3.5 border-t border-app-border shrink-0">
            <div className="flex justify-between text-[10px] text-app-text-dim tracking-[0.5px] mb-2">
              <span>Progression</span>
              <span id="depthLabel">{progress} / 10</span>
            </div>
            <div className="w-full h-[3px] bg-app-border rounded-sm overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-app-blue to-[#30d158] rounded-sm transition-all duration-500"
                style={{ width: `${progress * 10}%` }}
              ></div>
            </div>
          </div>
        </aside>

        {/* Chat Panel */}
        <main className="flex-1 flex flex-col min-w-0 bg-app-bg relative">
          {/* Chat Header */}
          <header className="flex items-center justify-between px-5 h-14 bg-[rgba(28,28,30,0.85)] backdrop-blur-[20px] border-b border-app-border shrink-0 relative z-20">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(10,132,255,0.3)] to-transparent"></div>
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#1a0a0a] to-[#4a1a1a] flex items-center justify-center text-base border border-white/10 shrink-0">
                🥀
              </div>
              <div className="flex flex-col gap-[1px]">
                <h1 className="text-[15px] font-semibold text-app-text tracking-[0.2px] leading-tight">
                  Adrian Vance
                </h1>
                <span className="text-[11px] text-app-text-dim leading-tight flex items-center gap-1.5">
                  {headerStatus === 'Écrit...' && (
                    <span className="inline-flex gap-[3px]">
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                  <span>{headerStatus}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-[13px] font-bold tracking-[3px] uppercase text-app-text-dim">
                RE<span className="text-app-blue">WRITE</span>
              </div>
              <div className="text-[9px] font-semibold tracking-[1px] text-app-gold bg-[rgba(255,214,10,0.1)] border border-[rgba(255,214,10,0.2)] py-[2px] px-1.5 rounded ml-1">
                BETA
              </div>
            </div>
          </header>

          {/* Message Feed */}
          <div
            ref={feedRef}
            className="flex-1 overflow-y-auto px-4 pt-5 pb-3 flex flex-col gap-1.5 no-scrollbar scroll-smooth"
          >
            <div className="text-center text-[11px] text-app-text-dim my-3 font-medium">
              Aujourd'hui
            </div>

            {messages.map((msg) => {
              if (msg.type === 'narrator') {
                return (
                  <div
                    key={msg.id}
                    className="self-center max-w-[75%] bg-[rgba(58,58,60,0.5)] border border-app-border rounded-xl px-3.5 py-2.5 text-[13px] italic text-app-text-sec leading-relaxed text-center my-1.5 animate-bubble-in"
                  >
                    <span>{msg.text}</span>
                  </div>
                );
              }

              if (msg.type === 'incoming') {
                return (
                  <div key={msg.id} className="flex flex-col gap-[1px] items-start animate-bubble-in">
                    <div className="bubble incoming max-w-[70%] py-2.5 px-3.5 rounded-[18px] text-[15px] leading-[1.45] text-app-text">
                      {msg.text ? <span>{msg.text}</span> : (
                        <span className="flex gap-1 items-center">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              if (msg.type === 'outgoing') {
                return (
                  <div key={msg.id} className="flex flex-col gap-[1px] items-end animate-bubble-in">
                    <div className="bubble outgoing max-w-[70%] py-2.5 px-3.5 rounded-[18px] text-[15px] leading-[1.45] text-app-text">
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }
              if (msg.type === 'choices' && msg.choices) {
                return (
                  <div key={msg.id} className="self-start w-full max-w-[82%] my-2 flex flex-col gap-[7px] animate-bubble-in">
                    <div className="text-[11px] text-app-text-dim px-1 font-medium">
                      Choisissez une réponse rapide ou écrivez librement ↓
                    </div>
                    {msg.choices.map((choice, i) => (
                      <button
                        key={i}
                        onClick={() => handleChoice(choice)}
                        disabled={isTyping}
                        className="w-full bg-app-sidebar border border-app-border rounded-[18px] py-3 px-4 text-[14px] text-app-blue cursor-pointer transition-all duration-150 text-left flex items-start gap-3 hover:bg-[rgba(10,132,255,0.12)] hover:border-[rgba(10,132,255,0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-default whitespace-normal break-words leading-relaxed"
                      >
                        <span className="text-[11px] font-bold text-app-text-dim mt-0.5 min-w-[16px]">
                          0{i + 1}
                        </span>
                        <span className="flex-1 whitespace-normal break-words">
                          {choice}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              }              return null;
            })}

            {/* Typing indicator (while waiting for first chunk) */}
            {isTyping && (
              <div className="flex items-center gap-2.5 py-1 animate-bubble-in">
                <div className="w-7 h-7 rounded-full bg-[#1a0a0a] flex items-center justify-center text-[13px] shrink-0 border border-white/10">
                  🥀
                </div>
                <div className="bg-app-border rounded-[18px] rounded-bl-[4px] py-2.5 px-4 flex gap-1 items-center bubble incoming">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar or CTA */}
           {isDemoEnded ? (
             <div className="px-6 py-8 bg-[rgba(28,28,30,0.9)] backdrop-blur-[20px] border-t border-app-border shrink-0 animate-bubble-in">
              <div className="max-w-md mx-auto flex flex-col items-center text-center gap-5">
                <div className="w-12 h-12 rounded-full bg-app-blue/10 border border-app-blue/30 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(10,132,255,0.2)]">
                  ✨
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-white tracking-wide">Merci d'avoir testé cette Bêta !</h4>
                  <p className="text-app-text-dim text-[13px] leading-relaxed">
                    L'aventure ne fait que commencer. La version finale avec des centaines de scénarios et une IA encore plus immersive sort très bientôt.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={onOpenForm}
                    className="w-full bg-app-blue hover:bg-app-blue/90 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(10,132,255,0.3)] hover:shadow-[0_6px_20px_rgba(10,132,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Rejoindre la liste d'attente
                  </button>
                  <p className="text-[11px] text-app-text-dim italic">
                    Remplissez le formulaire pour être recontacté en priorité.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="flex items-end gap-2.5 px-4 py-3 bg-[rgba(28,28,30,0.85)] backdrop-blur-[20px] border-t border-app-border shrink-0"
            >
              <div className="flex-1 flex items-end bg-[#2c2c2e] rounded-[20px] border border-app-border px-3.5 py-2 gap-2 transition-colors duration-200 focus-within:border-[rgba(10,132,255,0.4)]">
                <textarea
                  className="flex-1 bg-transparent border-none outline-none text-app-text text-[15px] resize-none min-h-[22px] max-h-[120px] leading-[1.4] no-scrollbar p-0 placeholder:text-app-text-dim focus:ring-0"
                  id="msgInput"
                  placeholder={isTyping ? 'Adrian répond...' : 'Réponds…'}
                  rows={1}
                  value={inputValue}
                  disabled={isTyping}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-8 h-8 rounded-full bg-app-blue border-none flex items-center justify-center cursor-pointer shrink-0 transition-all duration-150 hover:bg-[#0071e3] hover:scale-105 active:scale-95 disabled:bg-app-sidebar disabled:text-app-text-dim disabled:cursor-default disabled:hover:scale-100"
                id="sendBtn"
              >
                <Send className="w-[15px] h-[15px] text-white" />
              </button>
            </form>
          )}
        </main>
      </div>

      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
    </section>
  );
}
