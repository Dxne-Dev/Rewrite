export default function FormEmbed() {
  return (
    <section id="form" className="py-24 px-6 scroll-mt-28">
      <div className="max-w-5xl mx-auto bg-neutral-950/80 border border-purple-500/20 rounded-3xl p-6 md:p-10">
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-purple-400">Inscription</span>
          <h2 className="mt-4 text-4xl font-serif font-semibold text-white">Rejoignez la bêta</h2>
          <p className="mt-4 text-neutral-400 text-base md:text-lg max-w-2xl mx-auto">
            Remplissez le formulaire ci-dessous pour accéder à la version anticipée.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-900 bg-black/80">
          <iframe
            title="Formulaire d'inscription ReWrite"
            src="https://docs.google.com/forms/d/e/1FAIpQLSe2I7kVJhIzDu9vOd8dx9aRM6li3q2Ch_66bHj6JTiTQlXOZw/viewform?embedded=true"
            width="100%"
            height="1460"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className="w-full min-h-[1460px] bg-black"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black to-transparent" />
        </div>
      </div>
    </section>
  );
}
