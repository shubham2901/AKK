'use client'

interface EmptyDiscoveryStateProps {
  onResetFilters: () => void
  onShuffleAnyway: () => void
}

export default function EmptyDiscoveryState({
  onResetFilters,
  onShuffleAnyway,
}: EmptyDiscoveryStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32 pt-20">
      <div className="relative mb-10 flex h-64 w-64 items-center justify-center">
        <div className="absolute inset-0 scale-110 rotate-12 rounded-full bg-primary/20" aria-hidden />
        <svg
          className="relative z-10 h-full w-full drop-shadow-none"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="100" cy="110" r="70" fill="#e8612c" stroke="#1C1C1E" strokeWidth="4" />
          <path
            d="M70 50 Q70 20 100 20 Q130 20 130 50 L130 65 L70 65 Z"
            fill="white"
            stroke="#1C1C1E"
            strokeWidth="4"
          />
          <path d="M85 105 Q85 100 90 100" fill="none" stroke="#1C1C1E" strokeWidth="3" />
          <path d="M110 105 Q110 100 115 100" fill="none" stroke="#1C1C1E" strokeWidth="3" />
          <circle cx="88" cy="115" r="4" fill="#1C1C1E" />
          <circle cx="112" cy="115" r="4" fill="#1C1C1E" />
          <path
            d="M90 135 Q100 125 110 135"
            fill="none"
            stroke="#1C1C1E"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <ellipse cx="140" cy="130" rx="40" ry="15" fill="#fef08a" stroke="#1C1C1E" strokeWidth="4" />
        </svg>
      </div>

      <h2 className="font-heading text-center text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-charcoal">
        Hmm. Nothing here.
      </h2>
      <p className="mt-4 max-w-sm text-center font-sans text-base font-medium text-charcoal/70">
        Try resetting filters or shuffling — you might get luckier.
      </p>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-4">
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full rounded-xl border-2 border-charcoal bg-white py-4 font-heading text-lg font-black uppercase tracking-widest text-charcoal shadow-small transition-colors hover:bg-primary/10"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={onShuffleAnyway}
          className="w-full rounded-xl border-2 border-charcoal bg-primary py-4 font-heading text-lg font-black uppercase tracking-widest text-white shadow-medium transition-transform active:translate-y-0.5"
        >
          Shuffle anyway
        </button>
      </div>
    </div>
  )
}
