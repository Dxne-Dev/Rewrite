import { useEffect, useState } from 'react';

type FormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function FormDrawer({ open, onClose, onSuccess }: FormDrawerProps) {
  const [loadCount, setLoadCount] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Reset states when drawer is opened
      setLoadCount(0);
      setIframeLoading(true);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleIframeLoad = () => {
    if (!open) return;
    setLoadCount((prev) => {
      const next = prev + 1;
      if (next === 1) {
        setIframeLoading(false);
      }
      return next;
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full sm:w-[560px] max-w-full transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!open}
      >
        <div
          className="relative flex h-full w-full flex-col bg-neutral-950 border-l border-neutral-900/60 shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 p-5 shrink-0">
            <div>
              <span className="text-xs uppercase tracking-[0.35em] text-purple-400">Inscription</span>
              <h3 className="mt-1 text-2xl font-serif font-semibold text-white">Rejoignez la bêta</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800 cursor-pointer"
              aria-label="Fermer le formulaire"
            >
              Fermer
            </button>
          </header>

          <div className="flex-1 flex flex-col min-h-0 p-5 gap-4">
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-neutral-900 bg-black/80 flex flex-col relative">
              {iframeLoading && open && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <p className="text-xs text-neutral-400">Chargement du formulaire...</p>
                </div>
              )}
              {open && (
                <iframe
                  title="Formulaire d'inscription ReWrite"
                  src="https://docs.google.com/forms/d/e/1FAIpQLSe2I7kVJhIzDu9vOd8dx9aRM6li3q2Ch_66bHj6JTiTQlXOZw/viewform?embedded=true"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  onLoad={handleIframeLoad}
                  className="w-full h-full flex-1 bg-black"
                  scrolling="yes"
                />
              )}
            </div>

            {loadCount >= 2 && (
              <div className="flex flex-col items-center gap-3 mt-2 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-center text-sm text-neutral-300 font-medium">
                  Merci pour vos réponses ! Vous pouvez maintenant accéder à la démo.
                </p>
                <button
                  onClick={onSuccess}
                  className="w-full py-4 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[15px] transition-all cursor-pointer text-center shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
                >
                  Déverrouiller la démo
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
