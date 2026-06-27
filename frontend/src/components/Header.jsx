export default function Header() {
  return (
    <header className="border-b border-cream/10">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-xl font-semibold tracking-tight text-cream">
            Frontier
          </span>
          <span className="eyebrow text-slate hidden sm:inline">
            Portfolio Risk Engine
          </span>
        </div>
        <a
          href="https://github.com/Aaritp"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-slate hover:text-brass transition-colors"
        >
          Source
        </a>
      </div>
    </header>
  );
}
