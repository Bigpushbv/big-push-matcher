"use client";

import { useLabel } from "@/context/LabelContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import BedrijfForm from "@/components/bedrijven/BedrijfForm";
import type { Bedrijf } from "@/types";
import { BEDRIJF_STATUSSEN } from "@/types";

export default function BedrijvenPage() {
  const { activeLabel } = useLabel();
  const [bedrijven, setBedrijven] = useState<Bedrijf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadBedrijven() {
    if (!activeLabel) return;
    setLoading(true);
    const params = new URLSearchParams({ labelId: activeLabel.id });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/bedrijven?${params}`);
    const data = await res.json();
    setBedrijven(data);
    setLoading(false);
  }

  useEffect(() => {
    loadBedrijven();
  }, [activeLabel, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setTimeout(() => loadBedrijven(), 300);
    return () => clearTimeout(timeout);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bedrijven</h1>
        <Button onClick={() => setShowForm(true)}>+ Bedrijf toevoegen</Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-64">
          <Input
            placeholder="Zoek op naam, contactpersoon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={BEDRIJF_STATUSSEN.map((s) => ({ value: s, label: s }))}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Alle statussen"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">Laden...</div>
      ) : bedrijven.length === 0 ? (
        <div className="py-10 text-center text-gray-500">Geen bedrijven gevonden</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Bedrijfsnaam</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contactpersoon</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Werkgebied</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Sector</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bedrijven.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/bedrijven/${b.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {b.bedrijfsnaam}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.contactpersoon}</td>
                  <td className="px-4 py-3 text-gray-600">{b.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.werkgebiedType === "Landelijk"
                      ? "Landelijk"
                      : b.zoektInRegios.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.sector || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge label={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/matching/bedrijf/${b.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Zoek kandidaten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Bedrijf toevoegen"
        size="lg"
      >
        <BedrijfForm
          onSuccess={() => {
            setShowForm(false);
            loadBedrijven();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
