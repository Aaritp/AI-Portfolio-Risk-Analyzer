import { useReveal } from "../hooks/useReveal";

export default function Section({ title, subtitle, children, delay = 0 }) {
  const [ref, visible] = useReveal();

  return (
    <section
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} py-12`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-6">
        <h2 className="font-display font-semibold text-xl text-primary accent-line">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-secondary mt-1.5 max-w-2xl ml-[27px]">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
