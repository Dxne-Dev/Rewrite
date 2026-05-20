import Header from './components/Header';
import Hero from './components/Hero';
import ChatDemo from './components/ChatDemo';
import EarlyBird from './components/EarlyBird';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <ChatDemo />
        <EarlyBird />
      </main>
      <Footer />
    </div>
  );
}
