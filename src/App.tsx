import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ChatDemo from './components/ChatDemo';
import EarlyBird from './components/EarlyBird';
import FormDrawer from './components/FormDrawer';
import Footer from './components/Footer';

export default function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBetaUnlocked, setIsBetaUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rewrite_beta_unlocked') === 'true';
    }
    return false;
  });
  const demoSectionRef = useRef<HTMLDivElement>(null);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setIsBetaUnlocked(true);
    localStorage.setItem('rewrite_beta_unlocked', 'true');

    // Smooth scroll to the demo section
    setTimeout(() => {
      if (demoSectionRef.current) {
        demoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <Header onOpenForm={() => setIsFormOpen(true)} />
      <main>
        <Hero onOpenForm={() => setIsFormOpen(true)} />
        
        <div ref={demoSectionRef} id="demo-section">
          <ChatDemo isBetaUnlocked={isBetaUnlocked} onOpenForm={() => setIsFormOpen(true)} />
        </div>

        <EarlyBird onOpenForm={() => setIsFormOpen(true)} />
      </main>
      <Footer />
      <FormDrawer open={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={handleFormSuccess} />
    </div>
  );
}
