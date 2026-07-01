"use client";

import { useEffect, useState } from "react";
import { fetchPresets } from "@/lib/api";
import type { DisputePayload } from "@/lib/negotiation";

interface ItemRow {
  label: string;
  a: string;
  b: string;
}

interface FormState {
  partyA: string;
  partyB: string;
  items: ItemRow[];
  cashPool: string;
}

const BLANK: FormState = {
  partyA: "",
  partyB: "",
  items: [
    { label: "", a: "50", b: "50" },
    { label: "", a: "50", b: "50" },
  ],
  cashPool: "0",
};

interface DisputeBuilderProps {
  onRun: (dispute: DisputePayload | null) => void;
  running: boolean;
}

export function DisputeBuilder({ onRun, running }: DisputeBuilderProps) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const [presets, setPresets] = useState<DisputePayload[] | null>(null);
  const [presetsError, setPresetsError] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPresets()
      .then(setPresets)
      .catch(() => setPresetsError(true));
  }, []);

  const loadPreset = (preset: DisputePayload) => {
    const [pa, pb] = preset.parties;
    setForm({
      partyA: pa.name,
      partyB: pb.name,
      items: preset.items.map((it) => ({
        label: it.label,
        a: String(preset.valuations[pa.id]?.[it.id] ?? 50),
        b: String(preset.valuations[pb.id]?.[it.id] ?? 50),
      })),
      cashPool: String(preset.cashPool ?? 0),
    });
    setFormError(null);
    setTab("custom");
  };

  const submit = () => {
    const items = form.items.filter((it) => it.label.trim());
    if (items.length < 1) {
      setFormError("Add at least one asset with a name.");
      return;
    }
    const payload: DisputePayload = {
      title: "Custom dispute",
      parties: [
        { id: "a", name: form.partyA.trim() || "Party A", side: "a" },
        { id: "b", name: form.partyB.trim() || "Party B", side: "b" },
      ],
      items: items.map((it, i) => ({ id: `item_${i}`, label: it.label.trim() })),
      valuations: {
        a: Object.fromEntries(items.map((it, i) => [`item_${i}`, Number(it.a) || 0])),
        b: Object.fromEntries(items.map((it, i) => [`item_${i}`, Number(it.b) || 0])),
      },
      cashPool: Number(form.cashPool) || 0,
    };
    setFormError(null);
    onRun(payload);
  };

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-raised/30 p-5 sm:p-6">
      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-full border border-ink-line bg-ink/50 p-1 text-sm">
        {(["presets", "custom"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-4 py-1.5 font-medium transition ${
              tab === t
                ? "bg-brass text-ink"
                : "text-parchment/60 hover:text-parchment"
            }`}
          >
            {t === "presets" ? "Pick a preset" : "Build your own"}
          </button>
        ))}
      </div>

      {tab === "presets" ? (
        <div className="space-y-3">
          {presetsError && (
            <div className="rounded-lg border border-ink-line bg-ink/40 p-4 text-sm text-parchment/60">
              Couldn&rsquo;t load presets (is the backend running?). You can still
              run the flagship demo below.
            </div>
          )}
          {presets?.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col gap-3 rounded-xl border border-ink-line bg-ink/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-parchment">
                  {preset.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-parchment/55">
                  {preset.description}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className="rounded-full border border-ink-line px-4 py-1.5 text-sm text-parchment/80 transition hover:border-parchment/40 hover:text-parchment"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={running}
                  onClick={() => onRun(preset)}
                  className="rounded-full bg-brass px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-brass-bright disabled:opacity-60"
                >
                  Convene
                </button>
              </div>
            </div>
          ))}
          {!presets && !presetsError && (
            <p className="text-sm text-parchment/40">Loading presets…</p>
          )}
          <button
            type="button"
            disabled={running}
            onClick={() => onRun(null)}
            className="mt-1 text-sm text-parchment/50 underline-offset-4 hover:text-parchment hover:underline disabled:opacity-60"
          >
            Or run the flagship demo →
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First party">
              <input
                value={form.partyA}
                onChange={(e) => setForm({ ...form, partyA: e.target.value })}
                placeholder="e.g. Ava"
                className="w-full rounded-lg border border-ink-line bg-ink/50 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:border-party-a/60 focus:outline-none"
              />
            </Field>
            <Field label="Second party">
              <input
                value={form.partyB}
                onChange={(e) => setForm({ ...form, partyB: e.target.value })}
                placeholder="e.g. Ben"
                className="w-full rounded-lg border border-ink-line bg-ink/50 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:border-party-b/60 focus:outline-none"
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 grid grid-cols-[1fr_5rem_5rem_2rem] gap-2 px-1 text-[11px] uppercase tracking-wide text-parchment/40">
              <span>Asset</span>
              <span className="text-party-a">Worth to A</span>
              <span className="text-party-b">Worth to B</span>
              <span />
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_5rem_5rem_2rem] items-center gap-2"
                >
                  <input
                    value={item.label}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[i] = { ...item, label: e.target.value };
                      setForm({ ...form, items });
                    }}
                    placeholder={`Asset ${i + 1}`}
                    className="rounded-lg border border-ink-line bg-ink/50 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:border-brass/60 focus:outline-none"
                  />
                  <NumberInput
                    value={item.a}
                    onChange={(v) => {
                      const items = [...form.items];
                      items[i] = { ...item, a: v };
                      setForm({ ...form, items });
                    }}
                  />
                  <NumberInput
                    value={item.b}
                    onChange={(v) => {
                      const items = [...form.items];
                      items[i] = { ...item, b: v };
                      setForm({ ...form, items });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        items: form.items.filter((_, j) => j !== i),
                      })
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-parchment/40 transition hover:bg-tension/15 hover:text-tension"
                    aria-label="Remove asset"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  items: [...form.items, { label: "", a: "50", b: "50" }],
                })
              }
              className="mt-2 text-sm text-brass hover:text-brass-bright"
            >
              + Add asset
            </button>
          </div>

          <div className="flex items-end justify-between gap-4">
            <Field label="Shared cash to divide ($k, optional)">
              <NumberInput
                value={form.cashPool}
                onChange={(v) => setForm({ ...form, cashPool: v })}
                wide
              />
            </Field>
            <button
              type="button"
              disabled={running}
              onClick={submit}
              className="rounded-full bg-brass px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-brass-bright disabled:opacity-60"
            >
              {running ? "Negotiating…" : "Convene the table"}
            </button>
          </div>

          <p className="text-xs leading-relaxed text-parchment/40">
            Enter what each asset is worth to each side (in $ thousands). Different
            values are the whole point — they&rsquo;re why the two sides disagree,
            and what the advocates negotiate over.
          </p>

          {formError && <p className="text-sm text-tension">{formError}</p>}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-parchment/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  wide,
}: {
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-ink-line bg-ink/50 px-3 py-2 font-mono text-sm text-parchment focus:border-brass/60 focus:outline-none ${
        wide ? "w-28" : "w-full"
      }`}
    />
  );
}
