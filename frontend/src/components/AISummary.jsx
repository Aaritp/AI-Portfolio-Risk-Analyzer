export default function AISummary({ summary }) {
  return (
    <div className="card p-6">
      <div className="eyebrow mb-3">AI risk assessment</div>
      <p className="font-display text-base leading-relaxed text-ink-secondary">{summary}</p>
      <p className="text-2xs text-muted mt-4 pt-4 border-t border-border-base">
        Generated from the quantitative metrics above · informational only, not financial advice
      </p>
    </div>
  );
}
