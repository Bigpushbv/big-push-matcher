"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLabel } from "@/context/LabelContext";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import type { BedrijfMatch, MatchResultBedrijven, Kandidaat, EmailTemplate } from "@/types";

function MatchGroup({
  title,
  matches,
  selected,
  onToggle,
}: {
  title: string;
  matches: BedrijfMatch[];
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
              key={m.bedrijf.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                isIntroduced ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200 hover:border-blue-200"
              }`}
            >
              {!isIntroduced && (
                <input
                  type="checkbox"
                  checked={selected.has(m.bedrijf.id)}
                  onChange={() => onToggle(m.bedrijf.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/bedrijven/${m.bedrijf.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {m.bedrijf.bedrijfsnaam}
                  </Link>
                  <Badge label={m.bedrijf.status} />
                  {isIntroduced && <Badge label={m.introductieStatus!} />}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {m.bedrijf.contactpersoon} &middot;{" "}
                  {m.bedrijf.werkgebiedType === "Landelijk"
                    ? "Landelijk"
                    : m.bedrijf.zoektInRegios.join(", ")}
                  {m.bedrijf.sector && ` \u00b7 ${m.bedrijf.sector}`}
                </div>
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
                      <span key={i} className="text-xs text-orange-600">
                        {w}
                      </span>
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

export default function MatchKandidaatPage() {
  const params = useParams();
  const router = useRouter();
  const { activeLabel } = useLabel();
  const [kandidaat, setKandidaat] = useState<Kandidaat | null>(null);
  const [results, setResults] = useState<MatchResultBedrijven | null>(null);
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
      const [kRes, matchRes, tRes] = await Promise.all([
        fetch(`/api/kandidaten/${params.id}`),
        fetch(`/api/matching/kandidaat/${params.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelId: activeLabel!.id, includeAiScoring: true }),
        }),
        fetch(`/api/templates?labelId=${activeLabel!.id}`),
      ]);

      if (!kRes.ok) {
        router.push("/matching");
        return;
      }

      setKandidaat(await kRes.json());
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

  async function generateEmails() {
    if (selected.size === 0 || !selectedTemplate || !kandidaat) return;
    setGenerating(true);

    // For each selected company, generate an email
    const bedrijfId = Array.from(selected)[0]; // For now, one at a time
    try {
      const res = await fetch("/api/email/genereer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          bedrijfId,
          kandidaatIds: [kandidaat.id],
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
    if (!kandidaat) return;
    for (const bedrijfId of selected) {
      await fetch("/api/email/verstuurd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedrijfId,
          kandidaatIds: [kandidaat.id],
        }),
      });
    }
    setShowEmailModal(false);
    // Reload matches
    const matchRes = await fetch(`/api/matching/kandidaat/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId: activeLabel!.id, includeAiScoring: false }),
    });
    setResults(await matchRes.json());
    setSelected(new Set());
  }

  if (loading || !kandidaat || !results) {
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
            Matches voor{" "}
            <span className="font-mono text-blue-600">{kandidaat.referentiecode}</span>{" "}
            {kandidaat.naam}
          </h1>
        </div>
        {selected.size > 0 && (
          <Button onClick={() => setShowEmailModal(true)}>
            Genereer e-mails ({selected.size})
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {totalMatches} bedrijven gevonden &middot; {kandidaat.regio} &middot; Reisbereidheid:{" "}
        {kandidaat.reisbereidheid}
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
          Geen matchende bedrijven gevonden
        </div>
      )}

      {/* Email generation modal */}
      <Modal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="E-mail genereren"
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
            <Button onClick={generateEmails} disabled={generating}>
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
                  onClick={() => {
                    navigator.clipboard.writeText(emailHtml);
                  }}
                  variant="secondary"
                >
                  Kopieer HTML
                </Button>
                <Button onClick={markAsSent}>
                  Markeer als verstuurd
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
