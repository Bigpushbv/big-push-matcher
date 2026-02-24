"use client";

import { useLabel } from "@/context/LabelContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import KandidaatForm from "@/components/kandidaten/KandidaatForm";
import type { Kandidaat } from "@/types";
import { KANDIDAAT_STATUSSEN, PROVINCIES_NL } from "@/types";

export default function KandidatenPage() {
  const { activeLabel } = useLabel();
  const [kandidaten, setKandidaten] = useState<Kandidaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regioFilter, setRegioFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadKandidaten() {
    if (!activeLabel) return;
    setLoading(true);
    const params = new URLSearchParams({ labelId: activeLabel.id });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (regioFilter) params.set("regio", regioFilter);

    const res = await fetch(`/api/kandidaten?${params}`);
    const data = await res.json();
    setKandidaten(data);
    setLoading(false);
  }

  useEffect(() => {
    loadKandidaten();
  }, [activeLabel, statusFilter, regioFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadKandidaten();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kandidaten</h1>
        <Button onClick={() => setShowForm(true)}>+ Kandidaat toevoegen</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-64">
          <Input
            placeholder="Zoek op naam, code, plaats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            options={KANDIDAAT_STATUSSEN.map((s) => ({ value: s, label: s }))}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Alle statussen"
          />
        </div>
        <div className="w-40">
          <Select
            options={PROVINCIES_NL.map((p) => ({ value: p, label: p }))}
            value={regioFilter}
            onChange={(e) => setRegioFilter(e.target.value)}
            placeholder="Alle regio's"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-gray-500">Laden...</div>
      ) : kandidaten.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          Geen kandidaten gevonden
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Naam</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Woonplaats</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Regio</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Specialismen</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Processen</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kandidaten.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/kandidaten/${k.id}`}
                      className="font-mono font-medium text-blue-600 hover:underline"
                    >
                      {k.referentiecode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{k.naam}</td>
                  <td className="px-4 py-3 text-gray-600">{k.woonplaats}</td>
                  <td className="px-4 py-3 text-gray-600">{k.regio}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.specialismen.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                        >
                          {s}
                        </span>
                      ))}
                      {k.specialismen.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{k.specialismen.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{k.lopendeProcesen}</td>
                  <td className="px-4 py-3">
                    <Badge label={k.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/matching/kandidaat/${k.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Zoek matches
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Kandidaat toevoegen"
        size="xl"
      >
        <KandidaatForm
          onSuccess={() => {
            setShowForm(false);
            loadKandidaten();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
