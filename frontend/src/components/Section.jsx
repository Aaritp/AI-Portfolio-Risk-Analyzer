export default function Section({ title, subtitle, children }) {
  return (
    <section className="py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="w-1 h-5 rounded-full bg-indigo-DEFAULT/80" aria-hidden="true" />
        <div>
          <h2 className="font-display font-semibold text-[15px] text-ink leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-muted mt-0.5 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
