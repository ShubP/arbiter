import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-line/60 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded bg-brass/15 text-sm text-brass">
              ⚖
            </span>
            <span className="font-display text-base text-parchment">Arbiter</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-parchment/50">
            Every side of a dispute gets its own AI advocate. They negotiate a
            settlement in under a minute — and the game-theory math proves it is
            fair.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-parchment/30">
              Explore
            </span>
            <Link href="/demo" className="text-parchment/60 hover:text-parchment">
              Live demo
            </Link>
            <Link href="/docs" className="text-parchment/60 hover:text-parchment">
              Docs
            </Link>
            <Link href="/about" className="text-parchment/60 hover:text-parchment">
              About
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-parchment/30">
              Project
            </span>
            <a
              href="https://github.com/ShubP/arbiter"
              target="_blank"
              rel="noreferrer"
              className="text-parchment/60 hover:text-parchment"
            >
              GitHub
            </a>
            <span className="text-parchment/40">MIT licensed</span>
            <span className="text-parchment/40">Qwen Cloud · Track 3</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
