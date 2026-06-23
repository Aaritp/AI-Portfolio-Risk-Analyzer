export default function AISummary({ summary }) {
  return (
    <div className="card card-hover p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-DEFAULT/0 via-indigo-DEFAULT/40 to-indigo-DEFAULT/0" />
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-7 h-7 rounded-lg bg-indigo-subtle flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-DEFAULT fill-none stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </span>
        <span className="eyebrow">AI risk assessment</span>
      </div>
      <p className="font-display text-[17px] leading-relaxed text-ink-secondary text-pretty">{summary}</p>
      <p className="text-2xs text-subtle mt-5 pt-4 border-t border-border-base">
        Generated from the quantitative metrics above · informational only, not financial advice
      </p>
    </div>
  );
}
