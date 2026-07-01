"use client";

import { useEffect, useState } from "react";
import { fetchCapabilities, fetchPresets } from "@/lib/api";
import type { DisputePayload } from "@/lib/negotiation";
import { partyColor } from "@/lib/palette";

interface ItemRow {
  label: string;
  values: string[]; // one per party
}

interface FormState {
  parties: string[];
  items: ItemRow[];
  cashPool: string;
}

const BLANK: FormState = {
  parties: ["", ""],
  items: [
    { label: "", values: ["50", "50"] },
    { label: "", values: ["50", "50"] },
  ],
  cashPool: "0",
};

interface DisputeBuilderProps {
  onRun: (dispute: DisputePayload | null, live: boolean) => void;
  running: boolean;
}

export function DisputeBuilder({ onRun, running }: DisputeBuilderProps) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const [presets, setPresets] = useState<DisputePayload[] | null>(null);
  const [presetsError, setPresetsError] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetchPresets()
      .then(setPresets)
      .catch(() => setPresetsError(true));
    fetchCapabilities().then((c) => setLiveAvailable(c.liveQwen));
  }, []);

  const n = form.parties.length;

  const loadPreset = (preset: DisputePayload) => {
    setForm({
      parties: preset.parties.map((p) => p.name),
      items: preset.items.map((it) => ({
        label: it.label,
        values: preset.parties.map((p) =>
          String(preset.valuations[p.id]?.[it.id] ?? 50),
        ),
      })),
      cashPool: String(preset.cashPool ?? 0),
    });
    setFormError(null);
    setTab("custom");
  };

  const addParty = () => {
    if (n >= 6) return;
    setForm({
      ...form,
      parties: [...form.parties, ""],
      items: form.items.map((it) => ({ ...it, values: [...it.values, "50"] })),
    });
  };

  const removeParty = (idx: number) => {
    if (n <= 2) return;
    setForm({
      ...form,
      parties: form.parties.filter((_, i) => i !== idx),
      items: form.items.map((it) => ({
        ...it,
        values: it.values.filter((_, i) => i !== idx),
      })),
    });
  };

  const setItem = (idx: number, next: ItemRow) =>
    setForm({ ...form, items: form.items.map((it, i) => (i === idx ? next : it)) });

  const submit = () => {
    const items = form.items.filter((it) => it.label.trim());
    if (items.length < 1) {
      setFormError("Add at least one asset with a name.");
      return;
    }
    const payload: DisputePayload = {
      title: "Custom dispute",
      parties: form.parties.map((name, i) => ({
        id: `p${i}`,
        name: name.trim() || `Party ${i + 1}`,
      })),
      items: items.map((it, j) => ({ id: `item_${j}`, label: it.label.trim() })),
      valuations: Object.fromEntries(
        form.parties.map((_, i) => [
          `p${i}`,
          Object.fromEntries(
            items.map((it, j) => [`item_${j}`, Number(it.values[i]) || 0]),
          ),
        ]),
      ),
      cashPool: Number(form.cashPool) || 0,
    };
    setFormError(null);
    onRun(payload, live);
  };

  const gridCols = `minmax(0,1fr) repeat(${n}, 4rem) 1.75rem`;

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-raised/30 p-5 sm:p-6">
      <div className="mb-5 flex gap-1 rounded-full border border-ink-line bg-ink/50 p-1 text-sm">
        {(["presets", "custom"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-4 py-1.5 font-medium transition ${
              tab === t ? "bg-brass text-ink" : "text-parchment/60 hover:text-parchment"
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
                <p className="font-display text-lg text-parchment">{preset.title}</p>
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
                  onClick={() => onRun(preset, live)}
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
            onClick={() => onRun(null, live)}
            className="mt-1 text-sm text-parchment/50 underline-offset-4 hover:text-parchment hover:underline disabled:opacity-60"
          >
            Or run the flagship demo →
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Parties */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-parchment/45">
              Parties ({n})
            </p>
            <div className="space-y-2">
              {form.parties.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: partyColor(i) }}
                  />
                  <input
                    value={name}
                    onChange={(e) => {
                      const parties = [...form.parties];
                      parties[i] = e.target.value;
                      setForm({ ...form, parties });
                    }}
                    placeholder={`Party ${i + 1}`}
                    className="flex-1 rounded-lg border border-ink-line bg-ink/50 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none"
                    style={{ borderColor: undefined }}
                  />
                  {n > 2 && (
                    <button
                      type="button"
                      onClick={() => removeParty(i)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-parchment/40 transition hover:bg-tension/15 hover:text-tension"
                      aria-label="Remove party"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {n < 6 && (
              <button
                type="button"
                onClick={addParty}
                className="mt-2 text-sm text-brass hover:text-brass-bright"
              >
                + Add party
              </button>
            )}
          </div>

          {/* Valuation grid */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-parchment/45">
              What each asset is worth to each party ($k)
            </p>
            <div
              className="mb-1 grid gap-2 px-1 text-[10px] uppercase tracking-wide text-parchment/40"
              style={{ gridTemplateColumns: gridCols }}
            >
              <span>Asset</span>
              {form.parties.map((name, i) => (
                <span
                  key={i}
                  className="truncate text-center"
                  style={{ color: partyColor(i) }}
                >
                  {name.trim() || `P${i + 1}`}
                </span>
              ))}
              <span />
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <input
                    value={item.label}
                    onChange={(e) => setItem(idx, { ...item, label: e.target.value })}
                    placeholder={`Asset ${idx + 1}`}
                    className="rounded-lg border border-ink-line bg-ink/50 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:border-brass/60 focus:outline-none"
                  />
                  {form.parties.map((_, pi) => (
                    <input
                      key={pi}
                      type="number"
                      min={0}
                      value={item.values[pi]}
                      onChange={(e) => {
                        const values = [...item.values];
                        values[pi] = e.target.value;
                        setItem(idx, { ...item, values });
                      }}
                      className="w-full rounded-lg border border-ink-line bg-ink/50 px-2 py-2 text-center font-mono text-sm text-parchment focus:border-brass/60 focus:outline-none"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        items: form.items.filter((_, i) => i !== idx),
                      })
                    }
                    className="grid h-8 w-7 place-items-center rounded-lg text-parchment/40 transition hover:bg-tension/15 hover:text-tension"
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
                  items: [
                    ...form.items,
                    { label: "", values: form.parties.map(() => "50") },
                  ],
                })
              }
              className="mt-2 text-sm text-brass hover:text-brass-bright"
            >
              + Add asset
            </button>
          </div>

          <div className="flex items-end justify-between gap-4">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-parchment/45">
                Shared cash ($k, optional)
              </span>
              <input
                type="number"
                min={0}
                value={form.cashPool}
                onChange={(e) => setForm({ ...form, cashPool: e.target.value })}
                className="w-28 rounded-lg border border-ink-line bg-ink/50 px-3 py-2 font-mono text-sm text-parchment focus:border-brass/60 focus:outline-none"
              />
            </label>
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
            Different values are the whole point — they&rsquo;re why the parties
            disagree, and what the advocates negotiate over.
          </p>

          {formError && <p className="text-sm text-tension">{formError}</p>}
        </div>
      )}

      {/* Live Qwen toggle */}
      <label
        className={`mt-5 flex items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink/40 px-4 py-3 ${
          liveAvailable ? "cursor-pointer" : "opacity-60"
        }`}
      >
        <div>
          <p className="text-sm font-medium text-parchment">
            Voice advocates with live Qwen
          </p>
          <p className="text-xs text-parchment/45">
            {liveAvailable
              ? "Advocates & mediator speak in Qwen-generated language. Uses your quota."
              : "Add a DASHSCOPE_API_KEY on the backend to enable."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={live && liveAvailable}
          disabled={!liveAvailable}
          onChange={(e) => setLive(e.target.checked)}
          className="h-5 w-5 accent-brass"
        />
      </label>
    </div>
  );
}
