import { useInView } from "../hooks/useInView";

export default function Section({ title, subtitle, children, delay = 0 }) {
  const { ref, isInView } = useInView({ threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

  return (
    <section
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`py-6 transition-all duration-700 ease-out will-change-transform ${
        isInView ? "opacity-100 translate-y-0 animate-fadeSlideUp" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500" aria-hidden="true" />
        <div>
          <h2 className="font-display font-semibold text-[15px] text-ink leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-slate-300 mt-0.5 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
