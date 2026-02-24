"use client";

import { useLabel } from "@/context/LabelContext";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { RELATIE_TYPES } from "@/types";
import type { Bedrijfsrelatie } from "@/types";

export default function RelatiesPage() {
  const { activeLabel } = useLabel();
  const [relaties, setRelaties] = useState<Bedrijfsrelatie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New relation form
  const [moederbedrijf, setMoederbedrijf] = useState("");
  const [verwantBedrijf, setVerwantBedrijf] = useState("");
  const [type, setType] = useState("Dochter");
  const [isGlobal, setIsGlobal] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadRelaties() {
    const params = activeLabel ? `?labelId=${activeLabel.id}` : "";
    const res = await fetch(`/api/relaties${params}`);
    setRelaties(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadRelaties();
  }, [activeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addRelatie(e: React.FormEvent) {
    e.preventDefault();
    if (!moederbedrijf || !verwantBedrijf) return;
    setSaving(true);

    await fetch("/api/relaties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moederbedrijf,
        verwantBedrijf,
        type,
        labelId: isGlobal ? null : activeLabel?.id,
      }),
    });

    setMoederbedrijf("");
    setVerwantBedrijf("");
    setSaving(false);
    loadRelaties();
  }

  async function deleteRelatie(id: string) {
    if (!confirm("Weet je zeker dat je deze relatie wilt verwijderen?")) return;
    await fetch(`/api/relaties?id=${id}`, { method: "DELETE" });
    loadRelaties();
  }

  const filtered = relaties.filter(
    (r) =>
      !search ||
      r.moederbedrijf.toLowerCase().includes(search.toLowerCase()) ||
      r.verwantBedrijf.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bedrijfsrelaties</h1>
      <p className="text-sm text-gray-500">
        Beheer moeder-dochter, zuster, en historische naam relaties tussen bedrijven.
        Deze worden gebruikt voor cascading uitsluitingen.
      </p>

      {/* Add form */}
      <form
        onSubmit={addRelatie}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="w-48">
          <Input
            label="Moederbedrijf"
            value={moederbedrijf}
            onChange={(e) => setMoederbedrijf(e.target.value)}
            placeholder="bijv. ASSA ABLOY"
            required
          />
        </div>
        <div className="w-48">
          <Input
            label="Verwant bedrijf"
            value={verwantBedrijf}
            onChange={(e) => setVerwantBedrijf(e.target.value)}
            placeholder="bijv. Nassau Door"
            required
          />
        </div>
        <div className="w-40">
          <Select
            label="Type"
            options={RELATIE_TYPES.map((t) => ({ value: t, label: t }))}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <input
            type="checkbox"
            id="global"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="global" className="text-sm text-gray-600">
            Geldt voor alle labels
          </label>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Toevoegen..." : "Toevoegen"}
        </Button>
      </form>

      {/* Search */}
      <div className="w-64">
        <Input
          placeholder="Zoek op bedrijfsnaam..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-gray-500">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          Geen relaties gevonden
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Moederbedrijf
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">
                  &rarr;
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Verwant bedrijf
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Scope
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.moederbedrijf}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">&rarr;</td>
                  <td className="px-4 py-3 text-gray-700">{r.verwantBedrijf}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.labelId ? "Dit label" : "Alle labels"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteRelatie(r.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
