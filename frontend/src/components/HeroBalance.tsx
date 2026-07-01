"use client";

import { useEffect, useState } from "react";
import { Balance } from "./Balance";

// A short loop that tells the whole story: one side ahead, the other
// over-corrects, then the scale levels and the seal stamps.
const STATES = [
  { a: 375, b: 60, certified: false },
  { a: 205, b: 280, certified: false },
  { a: 258, b: 258, certified: true },
  { a: 258, b: 258, certified: true },
];

export function HeroBalance() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % STATES.length), 2600);
    return () => clearInterval(id);
  }, []);

  const s = STATES[i];
  return (
    <div className="h-64 w-full">
      <Balance utilityA={s.a} utilityB={s.b} certified={s.certified} />
    </div>
  );
}
