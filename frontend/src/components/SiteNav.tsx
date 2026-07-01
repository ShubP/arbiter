"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ink-line/60 bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brass/15 text-brass transition group-hover:bg-brass/25">
            ⚖
          </span>
          <span className="font-display text-lg tracking-tight text-parchment">
            Arbiter
          </span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  active
                    ? "bg-ink-raised text-parchment"
                    : "text-parchment/60 hover:text-parchment"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ShubP/arbiter"
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm text-parchment/60 transition hover:text-parchment sm:inline"
          >
            GitHub
          </a>
          <Link
            href="/demo"
            className="rounded-full bg-brass px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-brass-bright"
          >
            Convene
          </Link>
        </div>
      </nav>
    </header>
  );
}
