"use client";

import { useLabel } from "@/context/LabelContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Kandidaat, Bedrijf, ActieLog } from "@/types";

interface KandidaatWithIntros extends Kandidaat {
  introducties: Array<{ status: string; bedrijf: Bedrijf }>;
}

export default function DashboardPage() {
  const { activeLabel, loading: labelLoading } = useLabel();
  const [kandidaten, setKandidaten] = useState<KandidaatWithIntros[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActieLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeLabel) return;

    async function load() {
      setLoading(true);
      try {
        const [kRes, logRes] = await Promise.all([
          fetch(`/api/kandidaten?labelId=${activeLabel!.id}`),
          fetch(`/api/actie-log?limit=10`),
        ]);
        const kData = await kRes.json();
        const logData = await logRes.json();
        setKandidaten(kData);
        setRecentLogs(logData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeLabel]);

  if (labelLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Laden...</div>
      </div>
    );
  }

  if (!activeLabel) {
    return <div className="text-gray-500">Geen label geselecteerd</div>;
  }

  const stilleKandidaten = kandidaten.filter(
    (k) => k.status === "Beschikbaar" && k.lopendeProcesen === 0
  );
  const drukkekandidaten = kandidaten.filter(
    (k) => k.status === "Beschikbaar" && k.lopendeProcesen >= 3
  );
  const onbeantwoord = kandidaten.filter((k) =>
    k.introducties?.some((i) => i.status === "Ge\u00efntroduceerd")
  );
  const recenteKandidaten = kandidaten.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/kandidaten?nieuw=true">
            <Button>+ Kandidaat toevoegen</Button>
          </Link>
          <Link href="/bedrijven?nieuw=true">
            <Button variant="secondary">+ Bedrijf toevoegen</Button>
          </Link>
        </div>
      </div>

      {/* Action alerts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Zitten stil" className={stilleKandidaten.length > 0 ? "border-orange-200" : ""}>
          {stilleKandidaten.length === 0 ? (
            <p className="text-sm text-gray-500">Alle kandidaten hebben lopende processen</p>
          ) : (
            <div className="space-y-2">
              {stilleKandidaten.slice(0, 5).map((k) => (
                <Link
                  key={k.id}
                  href={`/kandidaten/${k.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div>
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {k.referentiecode}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">{k.naam}</span>
                  </div>
                  <span className="text-xs text-gray-400">{k.regio}</span>
                </Link>
              ))}
              {stilleKandidaten.length > 5 && (
                <p className="text-xs text-gray-400">
                  +{stilleKandidaten.length - 5} meer
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Gaan snel weg (3+ processen)" className={drukkekandidaten.length > 0 ? "border-red-200" : ""}>
          {drukkekandidaten.length === 0 ? (
            <p className="text-sm text-gray-500">Geen kandidaten met 3+ processen</p>
          ) : (
            <div className="space-y-2">
              {drukkekandidaten.slice(0, 5).map((k) => (
                <Link
                  key={k.id}
                  href={`/kandidaten/${k.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div>
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {k.referentiecode}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">{k.naam}</span>
                  </div>
                  <Badge label={`${k.lopendeProcesen} processen`} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Onbeantwoorde introducties" className={onbeantwoord.length > 0 ? "border-yellow-200" : ""}>
          {onbeantwoord.length === 0 ? (
            <p className="text-sm text-gray-500">Geen openstaande introducties</p>
          ) : (
            <div className="space-y-2">
              {onbeantwoord.slice(0, 5).map((k) => (
                <Link
                  key={k.id}
                  href={`/kandidaten/${k.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div>
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {k.referentiecode}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">{k.naam}</span>
                  </div>
                  <Badge label="Ge\u00efntroduceerd" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent candidates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recente kandidaten">
          {recenteKandidaten.length === 0 ? (
            <p className="text-sm text-gray-500">Nog geen kandidaten</p>
          ) : (
            <div className="space-y-2">
              {recenteKandidaten.map((k) => (
                <Link
                  key={k.id}
                  href={`/kandidaten/${k.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {k.referentiecode}
                    </span>
                    <span className="text-sm text-gray-900">{k.naam}</span>
                    <span className="text-xs text-gray-400">{k.regio}</span>
                  </div>
                  <Badge label={k.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recente activiteit">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500">Nog geen activiteit</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-2 rounded-lg p-2 text-sm">
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(log.datum).toLocaleDateString("nl-NL")}
                  </span>
                  <span className="text-gray-700">{log.actie}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
