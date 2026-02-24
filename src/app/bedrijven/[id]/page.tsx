"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import BedrijfForm from "@/components/bedrijven/BedrijfForm";
import type { Bedrijf, IntroductieTracking, ActieLog, Kandidaat, Label } from "@/types";

interface BedrijfDetail extends Bedrijf {
  introducties: (IntroductieTracking & { kandidaat: Kandidaat })[];
  actieLogs: ActieLog[];
  label: Label;
}

export default function BedrijfDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bedrijf, setBedrijf] = useState<BedrijfDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newLogText, setNewLogText] = useState("");

  async function loadBedrijf() {
    const res = await fetch(`/api/bedrijven/${params.id}`);
    if (!res.ok) {
      router.push("/bedrijven");
      return;
    }
    const data = await res.json();
    setBedrijf(data);
    setLoading(false);
  }

  useEffect(() => {
    loadBedrijf();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addLog() {
    if (!newLogText.trim() || !bedrijf) return;
    await fetch("/api/actie-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bedrijfId: bedrijf.id,
        actie: newLogText,
      }),
    });
    setNewLogText("");
    loadBedrijf();
  }

  async function handleDelete() {
    if (!bedrijf) return;
    if (!confirm(`Weet je zeker dat je ${bedrijf.bedrijfsnaam} wilt verwijderen?`)) return;
    await fetch(`/api/bedrijven/${bedrijf.id}`, { method: "DELETE" });
    router.push("/bedrijven");
  }

  if (loading || !bedrijf) {
    return <div className="py-10 text-center text-gray-500">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bedrijven" className="text-gray-400 hover:text-gray-600">
            &larr; Terug
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{bedrijf.bedrijfsnaam}</h1>
          <Badge label={bedrijf.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/matching/bedrijf/${bedrijf.id}`}>
            <Button variant="secondary">Zoek kandidaten</Button>
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
        <div className="space-y-6 lg:col-span-2">
          <Card title="Gegevens">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Contactpersoon</dt>
                <dd className="font-medium">{bedrijf.contactpersoon}</dd>
              </div>
              <div>
                <dt className="text-gray-500">E-mail</dt>
                <dd className="font-medium">{bedrijf.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Telefoon</dt>
                <dd className="font-medium">{bedrijf.telefoon || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Werkgebied</dt>
                <dd className="font-medium">
                  {bedrijf.werkgebiedType === "Landelijk"
                    ? "Landelijk"
                    : bedrijf.zoektInRegios.join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Sector</dt>
                <dd className="font-medium">{bedrijf.sector || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Aangemaakt</dt>
                <dd className="font-medium">
                  {new Date(bedrijf.aangemaaktOp).toLocaleDateString("nl-NL")}
                </dd>
              </div>
            </dl>
          </Card>

          {bedrijf.bekendeMerken.length > 0 && (
            <Card title="Bekende merken">
              <div className="flex flex-wrap gap-2">
                {bedrijf.bekendeMerken.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {bedrijf.notities && (
            <Card title="Notities">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{bedrijf.notities}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Ge\u00efntroduceerde kandidaten">
            {bedrijf.introducties.length === 0 ? (
              <p className="text-sm text-gray-500">Nog geen introducties</p>
            ) : (
              <div className="space-y-3">
                {bedrijf.introducties.map((intro) => (
                  <div
                    key={intro.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <Link
                      href={`/kandidaten/${intro.kandidaatId}`}
                      className="text-sm font-medium text-blue-600 hover:underline font-mono"
                    >
                      {intro.kandidaat.referentiecode}
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
              <Button size="sm" onClick={addLog}>+</Button>
            </div>
            {bedrijf.actieLogs.length === 0 ? (
              <p className="text-sm text-gray-500">Geen activiteit</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bedrijf.actieLogs.map((log) => (
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

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Bedrijf bewerken"
        size="lg"
      >
        <BedrijfForm
          initialData={bedrijf as unknown as Record<string, unknown>}
          isEdit
          onSuccess={() => {
            setEditing(false);
            loadBedrijf();
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </div>
  );
}
