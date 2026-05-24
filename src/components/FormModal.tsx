type FormModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function FormModal({ open, onClose }: FormModalProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto">
        <div
          className="relative w-full max-w-6xl max-h-[calc(100vh-4rem)] overflow-hidden rounded-[2rem] border border-purple-500/20 bg-neutral-950 shadow-[0_0_60px_rgba(0,0,0,0.65)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800"
          >
            Fermer
          </button>

          <div className="p-6 pb-0 text-center">
            <span className="text-xs uppercase tracking-[0.35em] text-purple-400">Inscription</span>
            <h2 className="mt-4 text-4xl font-serif font-semibold text-white">
              Rejoignez la bêta
            </h2>
            <p className="mt-4 text-neutral-400 text-base md:text-lg max-w-2xl mx-auto">
              Remplissez le formulaire ci-dessous pour accéder à la version anticipée.
            </p>
          </div>

          <div className="h-[calc(100%-170px)] overflow-hidden rounded-b-[2rem] bg-black/80 border-t border-neutral-900">
            <iframe
              title="Formulaire d'inscription ReWrite"
              src="https://docs.google.com/forms/d/e/1FAIpQLSe2I7kVJhIzDu9vOd8dx9aRM6li3q2Ch_66bHj6JTiTQlXOZw/viewform?embedded=true"
              width="100%"
              height="100%"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="h-full w-full bg-black"
            />
          </div>
        </div>
      </div>
    </>
  );
}
