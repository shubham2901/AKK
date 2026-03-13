export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto border-x-2 border-charcoal">
      <h1 className="font-heading text-charcoal text-4xl font-extrabold tracking-[-0.04em] leading-[0.85] uppercase text-center">
        Aaj Kya Khana Hai?
      </h1>
      <p className="font-sans text-charcoal/80 text-lg mt-4 text-center normal-case">
        What&apos;s for dinner tonight?
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <span className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-3 border-2 border-charcoal rounded-default shadow-small bg-bg-light">
          Vegetarian
        </span>
        <span className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-3 border-2 border-charcoal rounded-default shadow-small bg-bg-light">
          Quick
        </span>
        <span className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-3 border-2 border-charcoal rounded-default shadow-small bg-bg-light">
          North Indian
        </span>
      </div>

      <button
        type="button"
        className="mt-8 min-h-[44px] min-w-[44px] px-6 py-3 bg-primary border-2 border-charcoal shadow-medium rounded-default font-sans font-semibold text-charcoal active:translate-y-1 active:shadow-none transition-transform"
      >
        Find my recipe
      </button>
    </main>
  );
}
