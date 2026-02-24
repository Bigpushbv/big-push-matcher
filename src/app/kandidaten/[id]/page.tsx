"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import KandidaatForm from "@/components/kandidaten/KandidaatForm";
import type { Kandidaat, IntroductieTracking, ActieLog, Bedrijf, Label } from "@/types";

interface KandidaatDetail extends Kandidaat {
  introducties: (IntroductieTracking & { bedrijf: Bedrijf })[];
  actieLogs: ActieLog[];
  label: Label;
}

export default function KandidaatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [kandidaat, setKandidaat] = useState<KandidaatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newLogText, setNewLogText] = useState("");

  async function loadKandidaat() {
    const res = await fetch(`/api/kandidaten/${params.id}`);
    if (!res.ok) {
      router.push("/kandidaten");
      return;
    }
    const data = await res.json();
    setKandidaat(data);
    setLoading(false);
  }

  useEffect(() => {
    loadKandidaat();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addLog() {
    if (!newLogText.trim() || !kandidaat) return;
    await fetch("/api/actie-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kandidaatId: kandidaat.id,
        actie: newLogText,
      }),
    });
    setNewLogText("");
    loadKandidaat();
  }

  async function handleDelete() {
    if (!kandidaat) return;
    if (!confirm(`Weet je zeker dat je ${kandidaat.referentiecode} wilt verwijderen?`)) return;
    await fetch(`/api/kandidaten/${kandidaat.id}`, { method: "DELETE" });
    router.push("/kandidaten");
  }

  if (loading || !kandidaat) {
    return <div className="py-10 text-center text-gray-500">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/kandidaten" className="text-gray-400 hover:text-gray-600">
            &larr; Terug
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="font-mono text-blue-600">{kandidaat.referentiecode}</span>{" "}
            {kandidaat.naam}
          </h1>
          <Badge label={kandidaat.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/matching/kandidaat/${kandidaat.id}`}>
            <Button variant="secondary">Zoek matches</Button>
          </Link>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Bewerken
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Verwijderen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: details */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Gegevens">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Woonplaats</dt>
                <dd className="font-medium">{kandidaat.woonplaats}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Regio</dt>
                <dd className="font-medium">{kandidaat.regio}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Reisbereidheid</dt>
                <dd className="font-medium">{kandidaat.reisbereidheid}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Lopende processen</dt>
                <dd className="font-medium">{kandidaat.lopendeProcesen}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Salariseis</dt>
                <dd className="font-medium">{kandidaat.salariseis || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Aangemaakt</dt>
                <dd className="font-medium">
                  {new Date(kandidaat.aangemaaktOp).toLocaleDateString("nl-NL")}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Korte omschrijving">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {kandidaat.korteOmschrijving || "-"}
            </p>
          </Card>

          {kandidaat.specialismen.length > 0 && (
            <Card title="Specialismen">
              <div className="flex flex-wrap gap-2">
                {kandidaat.specialismen.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {kandidaat.uitsluitingen.length > 0 && (
            <Card title="Uitsluitingen">
              <div className="flex flex-wrap gap-2">
                {kandidaat.uitsluitingen.map((u, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-800"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {kandidaat.concurrentiebedingTekst && (
            <Card title="Concurrentiebeding">
              <p className="text-sm text-gray-700">{kandidaat.concurrentiebedingTekst}</p>
              {kandidaat.concurrentiebedingVerloopt && (
                <p className="mt-2 text-sm text-gray-500">
                  Verloopt: {new Date(kandidaat.concurrentiebedingVerloopt).toLocaleDateString("nl-NL")}
                </p>
              )}
            </Card>
          )}

          {kandidaat.zoekprofiel && (
            <Card title="Zoekprofiel">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{kandidaat.zoekprofiel}</p>
            </Card>
          )}

          <div className="flex gap-4 text-sm">
            {kandidaat.anoniemCvLink && (
              <a
                href={kandidaat.anoniemCvLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Anoniem CV &rarr;
              </a>
            )}
            {kandidaat.uitgebreidCvLink && (
              <a
                href={kandidaat.uitgebreidCvLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Uitgebreid CV &rarr;
              </a>
            )}
          </div>

          {kandidaat.notities && (
            <Card title="Notities">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{kandidaat.notities}</p>
            </Card>
          )}
        </div>

        {/* Right column: tracking + log */}
        <div className="space-y-6">
          <Card title="Introducties">
            {kandidaat.introducties.length === 0 ? (
              <p className="text-sm text-gray-500">Nog geen introducties</p>
            ) : (
              <div className="space-y-3">
                {kandidaat.introducties.map((intro) => (
                  <div
                    key={intro.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <Link
                      href={`/bedrijven/${intro.bedrijfId}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {intro.bedrijf.bedrijfsnaam}
                    </Link>
                    <Badge label={intro.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Actie-log">
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={newLogText}
                onChange={(e) => setNewLogText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLog()}
                placeholder="Notitie toevoegen..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <Button size="sm" onClick={addLog}>
                +
              </Button>
            </div>
            {kandidaat.actieLogs.length === 0 ? (
              <p className="text-sm text-gray-500">Geen activiteit</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {kandidaat.actieLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-xs text-gray-400 mt-0.5">
                      {new Date(log.datum).toLocaleDateString("nl-NL")}
                    </span>
                    <span className={log.automatisch ? "text-gray-500" : "text-gray-700"}>
                      {log.actie}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Kandidaat bewerken"
        size="xl"
      >
        <KandidaatForm
          initialData={kandidaat as unknown as Record<string, unknown>}
          isEdit
          onSuccess={() => {
            setEditing(false);
            loadKandidaat();
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </div>
  );
}
