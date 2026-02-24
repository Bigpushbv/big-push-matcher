"use client";

import { useState } from "react";
import { useLabel } from "@/context/LabelContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TagInput from "@/components/ui/TagInput";
import { KANDIDAAT_STATUSSEN, REISBEREIDHEID_OPTIES, PROVINCIES_NL } from "@/types";

const SPECIALISMEN_SUGGESTIES = [
  "sectionaaldeuren",
  "snelloopdeuren",
  "docking",
  "branddeuren",
  "overheaddeuren",
  "roldeuren",
  "heftrucks",
  "reachtrucks",
  "orderpickers",
  "elektrotechniek",
  "werktuigbouwkunde",
  "montage",
  "service",
  "projectleiding",
];

interface KandidaatFormProps {
  initialData?: Record<string, unknown>;
  onSuccess: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function KandidaatForm({
  initialData,
  onSuccess,
  onCancel,
  isEdit = false,
}: KandidaatFormProps) {
  const { activeLabel } = useLabel();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [naam, setNaam] = useState((initialData?.naam as string) || "");
  const [woonplaats, setWoonplaats] = useState((initialData?.woonplaats as string) || "");
  const [regio, setRegio] = useState((initialData?.regio as string) || "");
  const [korteOmschrijving, setKorteOmschrijving] = useState(
    (initialData?.korteOmschrijving as string) || ""
  );
  const [specialismen, setSpecialismen] = useState<string[]>(
    (initialData?.specialismen as string[]) || []
  );
  const [uitsluitingen, setUitsluitingen] = useState<string[]>(
    (initialData?.uitsluitingen as string[]) || []
  );
  const [relatedWarning, setRelatedWarning] = useState<{
    company: string;
    related: string[];
  } | null>(null);
  const [reisbereidheid, setReisbereidheid] = useState(
    (initialData?.reisbereidheid as string) || "Gemiddeld"
  );
  const [status, setStatus] = useState(
    (initialData?.status as string) || "Beschikbaar"
  );
  const [salariseis, setSalariseis] = useState((initialData?.salariseis as string) || "");
  const [zoekprofiel, setZoekprofiel] = useState((initialData?.zoekprofiel as string) || "");
  const [concurrentiebedingTekst, setConcurrentiebedingTekst] = useState(
    (initialData?.concurrentiebedingTekst as string) || ""
  );
  const [concurrentiebedingVerloopt, setConcurrentiebedingVerloopt] = useState(
    (initialData?.concurrentiebedingVerloopt as string) || ""
  );
  const [anoniemCvLink, setAnoniemCvLink] = useState(
    (initialData?.anoniemCvLink as string) || ""
  );
  const [uitgebreidCvLink, setUitgebreidCvLink] = useState(
    (initialData?.uitgebreidCvLink as string) || ""
  );
  const [notities, setNotities] = useState((initialData?.notities as string) || "");

  async function checkExclusion(company: string) {
    try {
      const res = await fetch("/api/exclusion-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company,
          labelId: activeLabel?.id,
        }),
      });
      const data = await res.json();
      if (data.related && data.related.length > 0) {
        setRelatedWarning({ company, related: data.related });
      }
    } catch {
      // silently fail
    }
  }

  function handleAddExclusion(newTags: string[]) {
    const added = newTags.filter((t) => !uitsluitingen.includes(t));
    setUitsluitingen(newTags);
    if (added.length > 0) {
      checkExclusion(added[added.length - 1]);
    }
  }

  function addRelatedExclusions() {
    if (!relatedWarning) return;
    const newExclusions = [
      ...uitsluitingen,
      ...relatedWarning.related.filter((r) => !uitsluitingen.includes(r)),
    ];
    setUitsluitingen(newExclusions);
    setRelatedWarning(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLabel) return;
    setSaving(true);
    setError("");

    const payload = {
      labelId: activeLabel.id,
      naam,
      woonplaats,
      regio,
      korteOmschrijving,
      specialismen,
      uitsluitingen,
      reisbereidheid,
      status,
      salariseis: salariseis || null,
      zoekprofiel: zoekprofiel || null,
      concurrentiebedingTekst: concurrentiebedingTekst || null,
      concurrentiebedingVerloopt: concurrentiebedingVerloopt || null,
      anoniemCvLink: anoniemCvLink || null,
      uitgebreidCvLink: uitgebreidCvLink || null,
      notities: notities || null,
    };

    try {
      const url = isEdit
        ? `/api/kandidaten/${initialData?.id}`
        : "/api/kandidaten";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Er ging iets mis");
        return;
      }

      onSuccess();
    } catch {
      setError("Er ging iets mis bij het opslaan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Naam *" value={naam} onChange={(e) => setNaam(e.target.value)} required />
        <Input
          label="Woonplaats *"
          value={woonplaats}
          onChange={(e) => setWoonplaats(e.target.value)}
          required
        />
        <Select
          label="Regio (provincie) *"
          options={PROVINCIES_NL.map((p) => ({ value: p, label: p }))}
          value={regio}
          onChange={(e) => setRegio(e.target.value)}
          placeholder="Selecteer regio"
        />
        <Select
          label="Reisbereidheid"
          options={REISBEREIDHEID_OPTIES.map((r) => ({ value: r, label: r }))}
          value={reisbereidheid}
          onChange={(e) => setReisbereidheid(e.target.value)}
        />
        <Select
          label="Status"
          options={KANDIDAAT_STATUSSEN.map((s) => ({ value: s, label: s }))}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Input
          label="Salariseis"
          value={salariseis}
          onChange={(e) => setSalariseis(e.target.value)}
          placeholder="bijv. \u20ac3.500 - \u20ac4.000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Korte omschrijving
        </label>
        <textarea
          value={korteOmschrijving}
          onChange={(e) => setKorteOmschrijving(e.target.value)}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="2-3 zinnen, anoniem, geen naam/leeftijd/exacte jaren"
        />
      </div>

      <TagInput
        label="Specialismen"
        tags={specialismen}
        onChange={setSpecialismen}
        suggestions={SPECIALISMEN_SUGGESTIES}
        placeholder="bijv. sectionaaldeuren, docking..."
      />

      <div>
        <TagInput
          label="Uitsluitingen (bedrijven)"
          tags={uitsluitingen}
          onChange={handleAddExclusion}
          placeholder="bijv. ASSA ABLOY..."
        />
        {relatedWarning && (
          <div className="mt-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              Je sluit <strong>{relatedWarning.company}</strong> uit. Wil je ook
              deze verwante bedrijven uitsluiten?
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {relatedWarning.related.map((r) => (
                <span
                  key={r}
                  className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800"
                >
                  {r}
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addRelatedExclusions}
              >
                Ja, voeg toe
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setRelatedWarning(null)}
              >
                Nee, bedankt
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Concurrentiebeding
          </label>
          <textarea
            value={concurrentiebedingTekst}
            onChange={(e) => setConcurrentiebedingTekst(e.target.value)}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Vrije tekst over concurrentiebeding"
          />
        </div>
        <Input
          label="Concurrentiebeding verloopt"
          type="date"
          value={concurrentiebedingVerloopt}
          onChange={(e) => setConcurrentiebedingVerloopt(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Zoekprofiel
        </label>
        <textarea
          value={zoekprofiel}
          onChange={(e) => setZoekprofiel(e.target.value)}
          rows={2}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Gewenste functie, regio, wensen"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Anoniem CV link"
          value={anoniemCvLink}
          onChange={(e) => setAnoniemCvLink(e.target.value)}
          placeholder="Google Drive link"
        />
        <Input
          label="Uitgebreid CV link"
          value={uitgebreidCvLink}
          onChange={(e) => setUitgebreidCvLink(e.target.value)}
          placeholder="Google Drive link"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notities
        </label>
        <textarea
          value={notities}
          onChange={(e) => setNotities(e.target.value)}
          rows={2}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Opslaan..." : isEdit ? "Opslaan" : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
}
