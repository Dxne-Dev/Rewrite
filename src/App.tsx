import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ChatDemo from './components/ChatDemo';
import EarlyBird from './components/EarlyBird';
import FormDrawer from './components/FormDrawer';
import Footer from './components/Footer';

export default function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <Header onOpenForm={() => setIsFormOpen(true)} />
      <main>
        <Hero onOpenForm={() => setIsFormOpen(true)} />
        <ChatDemo />
        <EarlyBird onOpenForm={() => setIsFormOpen(true)} />
      </main>
      <Footer />
      <FormDrawer open={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
