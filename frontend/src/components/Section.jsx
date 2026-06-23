export default function Section({ title, subtitle, children, flush }) {
  return (
    <section className="py-8">
      <div className="mb-4">
        <h2 className="font-display font-semibold text-base text-ink leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5 max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
