"use client";

import { useLabel } from "@/context/LabelContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import type { Kandidaat, Bedrijf } from "@/types";

export default function MatchingPage() {
  const { activeLabel } = useLabel();
  const [kandidaten, setKandidaten] = useState<Kandidaat[]>([]);
  const [bedrijven, setBedrijven] = useState<Bedrijf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeLabel) return;
    async function load() {
      setLoading(true);
      const [kRes, bRes] = await Promise.all([
        fetch(`/api/kandidaten?labelId=${activeLabel!.id}`),
        fetch(`/api/bedrijven?labelId=${activeLabel!.id}`),
      ]);
      setKandidaten(await kRes.json());
      setBedrijven(await bRes.json());
      setLoading(false);
    }
    load();
  }, [activeLabel]);

  if (loading) {
    return <div className="py-10 text-center text-gray-500">Laden...</div>;
  }

  const beschikbareKandidaten = kandidaten.filter((k) => k.status === "Beschikbaar");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Matching</h1>
      <p className="text-gray-600">
        Kies een richting: zoek bedrijven voor een kandidaat, of kandidaten voor een bedrijf.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Kandidaat &rarr; Bedrijven">
          <p className="mb-4 text-sm text-gray-500">
            Selecteer een kandidaat om te zien welke bedrijven passen.
          </p>
          {beschikbareKandidaten.length === 0 ? (
            <p className="text-sm text-gray-400">Geen beschikbare kandidaten</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {beschikbareKandidaten.map((k) => (
                <Link
                  key={k.id}
                  href={`/matching/kandidaat/${k.id}`}
                  className="flex items-center justify-between rounded-lg p-2.5 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {k.referentiecode}
                    </span>
                    <span className="text-sm text-gray-900">{k.naam}</span>
                  </div>
                  <span className="text-xs text-gray-400">{k.regio}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Bedrijf &rarr; Kandidaten">
          <p className="mb-4 text-sm text-gray-500">
            Selecteer een bedrijf om te zien welke kandidaten passen.
          </p>
          {bedrijven.length === 0 ? (
            <p className="text-sm text-gray-400">Geen bedrijven</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {bedrijven.map((b) => (
                <Link
                  key={b.id}
                  href={`/matching/bedrijf/${b.id}`}
                  className="flex items-center justify-between rounded-lg p-2.5 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {b.bedrijfsnaam}
                  </span>
                  <span className="text-xs text-gray-400">
                    {b.werkgebiedType === "Landelijk"
                      ? "Landelijk"
                      : b.zoektInRegios.join(", ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
