"use client";

import { useState } from "react";
import { useLabel } from "@/context/LabelContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TagInput from "@/components/ui/TagInput";
import { BEDRIJF_STATUSSEN, PROVINCIES_NL } from "@/types";

const WERKGEBIED_TYPES = [
  { value: "Landelijk", label: "Landelijk" },
  { value: "Specifieke regio", label: "Specifieke regio" },
  { value: "Op locatie", label: "Op locatie (kantoor)" },
];

interface BedrijfFormProps {
  initialData?: Record<string, unknown>;
  onSuccess: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function BedrijfForm({
  initialData,
  onSuccess,
  onCancel,
  isEdit = false,
}: BedrijfFormProps) {
  const { activeLabel } = useLabel();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [bedrijfsnaam, setBedrijfsnaam] = useState((initialData?.bedrijfsnaam as string) || "");
  const [contactpersoon, setContactpersoon] = useState(
    (initialData?.contactpersoon as string) || ""
  );
  const [email, setEmail] = useState((initialData?.email as string) || "");
  const [telefoon, setTelefoon] = useState((initialData?.telefoon as string) || "");
  const [status, setStatus] = useState((initialData?.status as string) || "Prospect");
  const [zoektInRegios, setZoektInRegios] = useState<string[]>(
    (initialData?.zoektInRegios as string[]) || []
  );
  const [werkgebiedType, setWerkgebiedType] = useState(
    (initialData?.werkgebiedType as string) || "Landelijk"
  );
  const [sector, setSector] = useState((initialData?.sector as string) || "");
  const [bekendeMerken, setBekendeMerken] = useState<string[]>(
    (initialData?.bekendeMerken as string[]) || []
  );
  const [notities, setNotities] = useState((initialData?.notities as string) || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLabel) return;
    setSaving(true);
    setError("");

    const payload = {
      labelId: activeLabel.id,
      bedrijfsnaam,
      contactpersoon,
      email,
      telefoon: telefoon || null,
      status,
      zoektInRegios,
      werkgebiedType,
      sector: sector || null,
      bekendeMerken,
      notities: notities || null,
    };

    try {
      const url = isEdit
        ? `/api/bedrijven/${initialData?.id}`
        : "/api/bedrijven";
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
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Bedrijfsnaam *"
          value={bedrijfsnaam}
          onChange={(e) => setBedrijfsnaam(e.target.value)}
          required
        />
        <Input
          label="Contactpersoon *"
          value={contactpersoon}
          onChange={(e) => setContactpersoon(e.target.value)}
          required
        />
        <Input
          label="E-mail *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Telefoon"
          value={telefoon}
          onChange={(e) => setTelefoon(e.target.value)}
        />
        <Select
          label="Status"
          options={BEDRIJF_STATUSSEN.map((s) => ({ value: s, label: s }))}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Select
          label="Werkgebied type"
          options={WERKGEBIED_TYPES}
          value={werkgebiedType}
          onChange={(e) => setWerkgebiedType(e.target.value)}
        />
      </div>

      {werkgebiedType === "Specifieke regio" && (
        <TagInput
          label="Zoekt in regio's"
          tags={zoektInRegios}
          onChange={setZoektInRegios}
          suggestions={[...PROVINCIES_NL]}
          placeholder="bijv. Zuid-Holland, Utrecht..."
        />
      )}

      <Input
        label="Sector"
        value={sector}
        onChange={(e) => setSector(e.target.value)}
        placeholder="bijv. deurtechniek, heftrucks"
      />

      <TagInput
        label="Bekende merken"
        tags={bekendeMerken}
        onChange={setBekendeMerken}
        placeholder="bijv. ASSA ABLOY, H\u00f6rmann..."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notities
        </label>
        <textarea
          value={notities}
          onChange={(e) => setNotities(e.target.value)}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder='bijv. "via Herman van H\u00f6rmann", "willen verbeterd voorstel"'
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
