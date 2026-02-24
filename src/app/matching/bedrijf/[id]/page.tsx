"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLabel } from "@/context/LabelContext";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import type { KandidaatMatch, MatchResultKandidaten, Bedrijf, EmailTemplate } from "@/types";

function MatchGroup({
  title,
  matches,
  selected,
  onToggle,
}: {
  title: string;
  matches: KandidaatMatch[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (matches.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Badge label={title} />
        <span className="text-gray-400">({matches.length})</span>
      </h3>
      <div className="space-y-2">
        {matches.map((m) => {
          const isIntroduced = m.introductieStatus && m.introductieStatus !== "Niet gestuurd";
          return (
            <div
              key={m.kandidaat.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                isIntroduced ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200 hover:border-blue-200"
              }`}
            >
              {!isIntroduced && (
                <input
                  type="checkbox"
                  checked={selected.has(m.kandidaat.id)}
                  onChange={() => onToggle(m.kandidaat.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/kandidaten/${m.kandidaat.id}`}
                    className="font-mono font-medium text-blue-600 hover:underline"
                  >
                    {m.kandidaat.referentiecode}
                  </Link>
                  <span className="text-sm text-gray-600">{m.kandidaat.regio}</span>
                  <span className="text-sm text-gray-400">
                    {m.kandidaat.lopendeProcesen} processen
                  </span>
                  {isIntroduced && <Badge label={m.introductieStatus!} />}
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {m.kandidaat.korteOmschrijving}
                </p>
                {m.aiReasoning && (
                  <div className="mt-1 text-xs text-gray-500">
                    AI: {m.aiReasoning}
                    {m.aiScore && (
                      <span className="ml-1 font-medium">({m.aiScore}/10)</span>
                    )}
                  </div>
                )}
                {m.warnings.length > 0 && (
                  <div className="mt-1">
                    {m.warnings.map((w, i) => (
                      <span key={i} className="text-xs text-orange-600">{w}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MatchBedrijfPage() {
  const params = useParams();
  const router = useRouter();
  const { activeLabel } = useLabel();
  const [bedrijf, setBedrijf] = useState<Bedrijf | null>(null);
  const [results, setResults] = useState<MatchResultKandidaten | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!activeLabel) return;

    async function load() {
      setLoading(true);
      const [bRes, matchRes, tRes] = await Promise.all([
        fetch(`/api/bedrijven/${params.id}`),
        fetch(`/api/matching/bedrijf/${params.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelId: activeLabel!.id, includeAiScoring: true }),
        }),
        fetch(`/api/templates?labelId=${activeLabel!.id}`),
      ]);

      if (!bRes.ok) {
        router.push("/matching");
        return;
      }

      setBedrijf(await bRes.json());
      setResults(await matchRes.json());
      setTemplates(await tRes.json());
      setLoading(false);
    }
    load();
  }, [params.id, activeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function generateEmail() {
    if (selected.size === 0 || !selectedTemplate || !bedrijf) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/email/genereer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          bedrijfId: bedrijf.id,
          kandidaatIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      setEmailSubject(data.onderwerpHtml);
      setEmailHtml(data.bodyHtml);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  async function markAsSent() {
    if (!bedrijf) return;
    await fetch("/api/email/verstuurd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bedrijfId: bedrijf.id,
        kandidaatIds: Array.from(selected),
      }),
    });
    setShowEmailModal(false);
    // Reload
    const matchRes = await fetch(`/api/matching/bedrijf/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId: activeLabel!.id, includeAiScoring: false }),
    });
    setResults(await matchRes.json());
    setSelected(new Set());
  }

  if (loading || !bedrijf || !results) {
    return <div className="py-10 text-center text-gray-500">Matching bezig...</div>;
  }

  const totalMatches =
    results.direct.length + results.mogelijk.length + results.breed.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matching" className="text-gray-400 hover:text-gray-600">
            &larr; Terug
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Kandidaten voor <span className="text-blue-600">{bedrijf.bedrijfsnaam}</span>
          </h1>
        </div>
        {selected.size > 0 && (
          <Button onClick={() => setShowEmailModal(true)}>
            Genereer introductiemail ({selected.size})
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {totalMatches} kandidaten gevonden &middot;{" "}
        {bedrijf.werkgebiedType === "Landelijk"
          ? "Landelijk"
          : bedrijf.zoektInRegios.join(", ")}
        {bedrijf.sector && ` \u00b7 ${bedrijf.sector}`}
      </p>

      <div className="space-y-8">
        <MatchGroup
          title="Direct"
          matches={results.direct}
          selected={selected}
          onToggle={toggleSelect}
        />
        <MatchGroup
          title="Mogelijk"
          matches={results.mogelijk}
          selected={selected}
          onToggle={toggleSelect}
        />
        <MatchGroup
          title="Breed"
          matches={results.breed}
          selected={selected}
          onToggle={toggleSelect}
        />
      </div>

      {totalMatches === 0 && (
        <div className="py-10 text-center text-gray-500">
          Geen matchende kandidaten gevonden
        </div>
      )}

      <Modal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Introductiemail genereren"
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecteer template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Kies een template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.templateNaam}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && !emailHtml && (
            <Button onClick={generateEmail} disabled={generating}>
              {generating ? "Genereren..." : "Genereer preview"}
            </Button>
          )}

          {emailHtml && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onderwerp
                </label>
                <div className="rounded-lg bg-gray-50 p-3 text-sm">{emailSubject}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview
                </label>
                <div
                  className="rounded-lg border border-gray-200 bg-white p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: emailHtml }}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigator.clipboard.writeText(emailHtml)}
                  variant="secondary"
                >
                  Kopieer HTML
                </Button>
                <Button onClick={markAsSent}>Markeer als verstuurd</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
