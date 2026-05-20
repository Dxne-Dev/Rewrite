import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <span className="inline-block py-1 px-3 rounded-full bg-neutral-900 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider uppercase mb-6">
          Bientôt disponible
        </span>
        <h1 className="text-5xl md:text-7xl font-serif font-medium text-white tracking-tight mb-8 leading-tight">
          Ne lisez plus vos livres préférés. <br />
          <span className="italic text-purple-400">Vivez-les.</span>
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          Entrez dans l'histoire, discutez en direct avec les personnages et découvrez ce qu'il se passerait si vous preniez les décisions. Suivrez-vous le scénario ou rééscrirez-vous le destin ?
        </p>

        <div className="relative inline-block">
          {/* Infinite Expanding Radar Pulse Waves */}
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-500/30 -z-10"
            animate={{
              scale: [1, 1.5],
              opacity: [0.8, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-600/20 -z-10"
            animate={{
              scale: [1, 1.8],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 2,
              delay: 0.8,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />

          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(168, 85, 247, 0.8)"
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-medium py-4 px-8 rounded-full transition-all duration-300 overflow-hidden cursor-pointer"
          >
            {/* Sliding light gleam effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_ease-in-out_infinite]" />
            
            <span className="relative z-10">Rejoindre la Bêta Gratuite</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
