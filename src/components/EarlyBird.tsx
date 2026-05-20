import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export default function EarlyBird() {
  return (
    <section className="py-24 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto rounded-3xl p-1 bg-gradient-to-br from-yellow-500/20 via-neutral-900 to-purple-500/20"
      >
        <div className="bg-neutral-950 h-full w-full rounded-[23px] px-8 py-12 md:px-12 md:py-16 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-neutral-900 hover:bg-neutral-800 transition-colors border border-yellow-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">
            Soutenir le projet
          </h2>
          
          <p className="text-neutral-400 text-lg mb-10 max-w-lg">
            Réservez votre accès en avant-première et obtenez des crédits de jeu bonus au lancement officiel de l'application.
          </p>

          <button className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[1px]">
            <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-purple-600 to-yellow-600 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-neutral-950 px-8 py-4 rounded-full transition-all duration-300 group-hover:bg-neutral-950/80 flex items-center justify-center gap-2">
              <span className="text-white font-medium">Obtenir le Pack</span>
              <span className="text-yellow-400 font-medium">0,99€</span>
            </div>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
