import { useEffect } from 'react';

type FormDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function FormDrawer({ open, onClose }: FormDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
          <header className="flex items-center justify-between gap-4 p-5">
            <div>
              <span className="text-xs uppercase tracking-[0.35em] text-purple-400">Inscription</span>
              <h3 className="mt-1 text-2xl font-serif font-semibold text-white">Rejoignez la bêta</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800"
              aria-label="Fermer le formulaire"
            >
              Fermer
            </button>
          </header>

          <div className="flex-1 overflow-auto p-5">
            <div className="rounded-xl overflow-hidden border border-neutral-900 bg-black/80">
              <iframe
                title="Formulaire d'inscription ReWrite"
                src="https://docs.google.com/forms/d/e/1FAIpQLSe2I7kVJhIzDu9vOd8dx9aRM6li3q2Ch_66bHj6JTiTQlXOZw/viewform?embedded=true"
                width="100%"
                height="820"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="w-full h-[820px] bg-black"
              />
            </div>

            <p className="mt-4 text-center text-sm text-neutral-400">Remplissez le formulaire pour accéder à la bêta — tout reste sur cette page.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
