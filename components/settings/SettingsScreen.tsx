'use client'

import SettingsPreferencesContent from './SettingsPreferencesContent'

interface SettingsScreenProps {
  onBack: () => void
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col max-w-md mx-auto border-x-2 border-charcoal bg-bg-light">
      <header className="flex shrink-0 items-center gap-4 border-b-2 border-charcoal p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to discovery"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-charcoal bg-white hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-charcoal">arrow_back</span>
        </button>
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-charcoal">
          Settings
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
        <SettingsPreferencesContent className="mt-6" />
      </div>

      <div className="sticky bottom-0 border-t-2 border-charcoal bg-bg-light p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl border-2 border-charcoal bg-primary py-4 font-heading text-lg font-black uppercase tracking-widest text-white shadow-medium transition-transform active:translate-y-0.5"
        >
          Done
        </button>
      </div>
    </div>
  )
}
