import { motion } from 'motion/react';
import { MessageCircle, Battery, Wifi, Signal } from 'lucide-react';

export default function ChatDemo() {
  return (
    <section className="py-24 px-6 relative flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative"
      >
        {/* Phone Frame */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-[3rem] p-2 shadow-2xl relative z-10">
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800/50 rounded-[2.5rem] overflow-hidden h-[600px] flex flex-col relative">
            
            {/* Status Bar */}
            <div className="h-12 w-full flex items-center justify-between px-6 pt-2 text-neutral-400">
              <span className="text-xs font-semibold tracking-wider">03:14</span>
              <div className="flex items-center space-x-2">
                <Signal className="w-4 h-4" />
                <Wifi className="w-4 h-4" />
                <Battery className="w-5 h-5" />
              </div>
            </div>

            {/* Chat Header */}
            <div className="flex flex-col items-center pb-4 border-b border-neutral-800/50">
              <div className="w-16 h-16 rounded-full bg-neutral-800 border border-purple-500/30 overflow-hidden mb-2 relative">
                <img 
                  src="https://images.unsplash.com/photo-1542080681-b52d382432af?q=80&w=200&h=200&auto=format&fit=crop" 
                  alt="Mysterious character" 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <h3 className="font-serif text-lg text-white font-medium">Ashton</h3>
              <p className="text-xs text-purple-400">En ligne</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-5 flex flex-col justify-end space-y-6">
              
              {/* NPC Message */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-start"
              >
                <div className="bg-neutral-800 text-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm leading-relaxed border border-neutral-700/50">
                  Je ne peux pas être avec toi, c'est trop dangereux.
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 ml-1">Livre originel</span>
              </motion.div>

              {/* Player Option Message */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="flex flex-col items-end"
              >
                <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] text-sm leading-relaxed relative shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                  Ferme-la et embrasse-moi.
                </div>
                <div className="flex items-center gap-1.5 mt-2 mr-1">
                  <MessageCircle className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] uppercase tracking-wider text-purple-400 font-medium">
                    Option Joueur (Déviation de l'histoire)
                  </span>
                </div>
              </motion.div>

            </div>

            {/* Input Bar */}
            <div className="h-16 border-t border-neutral-800/50 flex items-center px-4 bg-neutral-900/50">
              <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-full h-10 px-4 flex items-center text-neutral-500 text-sm">
                Écrire un message...
              </div>
            </div>
          </div>
        </div>

        {/* Ambient background glow for phone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[300px] max-h-[500px] bg-purple-600/10 rounded-[3rem] blur-[80px] -z-10" />
      </motion.div>
    </section>
  );
}
