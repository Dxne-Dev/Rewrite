import { motion } from 'motion/react';

type HeaderProps = {
  onOpenForm: () => void;
};

export default function Header({ onOpenForm }: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 w-full z-50 border-b border-neutral-900/40 bg-black/40 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-wider text-white">
            Re<span className="text-purple-500">write</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>

        <nav className="flex items-center gap-6">
          <motion.button
            type="button"
            onClick={onOpenForm}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-xs tracking-widest font-semibold uppercase text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/20 rounded-full px-4 py-2 bg-purple-950/20"
          >
            Bêta
          </motion.button>
        </nav>
      </div>
    </motion.header>
  );
}
