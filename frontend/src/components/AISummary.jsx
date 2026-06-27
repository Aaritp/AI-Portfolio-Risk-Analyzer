export default function AISummary({ summary }) {
  return (
    <div className="glass p-6 md:p-8 relative overflow-hidden">
      {/* Subtle glow in corner */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="eyebrow">AI risk assessment</span>
        </div>

        <p className="font-display text-base md:text-lg leading-relaxed text-secondary max-w-3xl">
          {summary}
        </p>

        <p className="text-2xs text-muted mt-5 pt-4 border-t border-white/[0.06]">
          Generated from quantitative metrics above · informational only, not financial advice
        </p>
      </div>
    </div>
  );
}
