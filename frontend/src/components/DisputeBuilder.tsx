"use client";

import { useEffect, useState } from "react";
import {
  fetchCapabilities,
  fetchPresets,
  structureDispute,
} from "@/lib/api";
import type { DisputePayload } from "@/lib/negotiation";
import { partyColor } from "@/lib/palette";

interface ItemRow {
  label: string;
  values: string[]; // one per party
  lockedTo: number | null; // party index that must keep it, or null
}

interface FormState {
  parties: string[];
  items: ItemRow[];
  cashPool: string;
}

const BLANK: FormState = {
  parties: ["", ""],
  items: [
    { label: "", values: ["50", "50"], lockedTo: null },
    { label: "", values: ["50", "50"], lockedTo: null },
  ],
  cashPool: "0",
};

interface DisputeBuilderProps {
  onRun: (dispute: DisputePayload | null, live: boolean) => void;
  running: boolean;
}

export function DisputeBuilder({ onRun, running }: DisputeBuilderProps) {
  const [tab, setTab] = useState<"presets" | "custom" | "describe">("presets");
  const [presets, setPresets] = useState<DisputePayload[] | null>(null);
  const [presetsError, setPresetsError] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [live, setLive] = useState(false);
  const [describeText, setDescribeText] = useState("");
  const [describing, setDescribing] = useState(false);
  const [describeError, setDescribeError] = useState<string | null>(null);

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
      items: preset.items.map((it) => {
        const lockedPid = preset.constraints?.[it.id];
        const lockedIdx = lockedPid
          ? preset.parties.findIndex((p) => p.id === lockedPid)
          : -1;
        return {
          label: it.label,
          values: preset.parties.map((p) =>
            String(preset.valuations[p.id]?.[it.id] ?? 50),
          ),
          lockedTo: lockedIdx >= 0 ? lockedIdx : null,
        };
      }),
      cashPool: String(preset.cashPool ?? 0),
    });
    setFormError(null);
    setTab("custom");
  };

  const structure = async () => {
    if (!describeText.trim()) return;
    setDescribing(true);
    setDescribeError(null);
    try {
      const payload = await structureDispute(describeText.trim());
      loadPreset(payload); // fills the form and switches to the custom tab
    } catch (e) {
      setDescribeError((e as Error).message);
    } finally {
      setDescribing(false);
    }
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
        lockedTo:
          it.lockedTo === idx
            ? null
            : it.lockedTo !== null && it.lockedTo > idx
              ? it.lockedTo - 1
              : it.lockedTo,
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
    const constraints: Record<string, string> = {};
    items.forEach((it, j) => {
      if (it.lockedTo !== null) constraints[`item_${j}`] = `p${it.lockedTo}`;
    });
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
      constraints,
    };
    setFormError(null);
    onRun(payload, live);
  };

  const gridCols = `minmax(6rem,1fr) repeat(${n}, 3.2rem) 4.4rem 1.5rem`;
  const gridMinWidth = `${9 + n * 3.2 + 4.4 + 1.5}rem`;

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-raised/30 p-5 sm:p-6">
      <div className="mb-5 flex gap-1 rounded-full border border-ink-line bg-ink/50 p-1 text-sm">
        {(liveAvailable
          ? (["presets", "custom", "describe"] as const)
          : (["presets", "custom"] as const)
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
              tab === t ? "bg-brass text-ink" : "text-parchment/60 hover:text-parchment"
            }`}
          >
            {t === "presets"
              ? "Pick a preset"
              : t === "custom"
                ? "Build your own"
                : "Describe it"}
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
              className="card-lift flex flex-col gap-3 rounded-xl border border-ink-line bg-ink/40 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                  className="btn-lift rounded-full bg-brass px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-brass-bright disabled:opacity-60"
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
      ) : tab === "describe" ? (
        <div className="space-y-4">
          <p className="text-sm text-parchment/60">
            Describe the dispute in plain English — who&rsquo;s involved, what
            they&rsquo;re dividing, and what each side cares about. A Qwen intake
            agent turns it into a structured dispute you can review.
          </p>
          <textarea
            value={describeText}
            onChange={(e) => setDescribeText(e.target.value)}
            rows={6}
            placeholder="e.g. My sister and I are splitting our late dad's estate: the house, his car, and about $50k in savings. I care most about the house; she really wants the car…"
            className="w-full resize-none rounded-lg border border-ink-line bg-ink/50 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:border-brass/60 focus:outline-none"
          />
          <button
            type="button"
            disabled={describing || !describeText.trim()}
            onClick={structure}
            className="btn-lift rounded-full bg-brass px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-brass-bright disabled:opacity-60"
          >
            {describing ? "Structuring…" : "Structure with Qwen"}
          </button>
          {describeError && (
            <p className="text-sm text-tension">{describeError}</p>
          )}
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
            <div className="overflow-x-auto">
            <div
              className="mb-1 grid gap-2 px-1 text-[10px] uppercase tracking-wide text-parchment/40"
              style={{ gridTemplateColumns: gridCols, minWidth: gridMinWidth }}
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
              <span className="text-center">Keep</span>
              <span />
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: gridCols, minWidth: gridMinWidth }}
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
                  <select
                    value={item.lockedTo ?? ""}
                    onChange={(e) =>
                      setItem(idx, {
                        ...item,
                        lockedTo:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    title="Must this asset go to a specific party?"
                    className="rounded-lg border border-ink-line bg-ink/50 px-1 py-2 text-xs text-parchment focus:border-brass/60 focus:outline-none"
                  >
                    <option value="">—</option>
                    {form.parties.map((name, pi) => (
                      <option key={pi} value={pi}>
                        {name.trim() || `P${pi + 1}`}
                      </option>
                    ))}
                  </select>
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
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  items: [
                    ...form.items,
                    {
                      label: "",
                      values: form.parties.map(() => "50"),
                      lockedTo: null,
                    },
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
              className="btn-lift rounded-full bg-brass px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-brass-bright disabled:opacity-60"
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
