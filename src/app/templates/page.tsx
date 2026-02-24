"use client";

import { useLabel } from "@/context/LabelContext";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import type { EmailBlok, EmailTemplate } from "@/types";

const BLOK_TYPES = [
  { value: "statisch", label: "Statisch" },
  { value: "kandidatenlijst", label: "Kandidatenlijst" },
  { value: "handtekening", label: "Handtekening" },
];

const VARIABELEN = [
  "contactpersoon",
  "bedrijfsnaam",
  "kandidaat_lijst",
  "mijn_naam",
  "mijn_telefoon",
  "afzender_naam",
  "regio",
  "datum",
  "tijd",
];

interface TemplateWithBlokken extends EmailTemplate {
  blokken: Array<{ id: string; blokId: string; volgorde: number; blok: EmailBlok }>;
}

export default function TemplatesPage() {
  const { activeLabel } = useLabel();
  const [blokken, setBlokken] = useState<EmailBlok[]>([]);
  const [templates, setTemplates] = useState<TemplateWithBlokken[]>([]);
  const [loading, setLoading] = useState(true);

  // Block form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<EmailBlok | null>(null);
  const [blockNaam, setBlockNaam] = useState("");
  const [blockType, setBlockType] = useState("statisch");
  const [blockHtml, setBlockHtml] = useState("");

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateNaam, setTemplateNaam] = useState("");
  const [templateOnderwerp, setTemplateOnderwerp] = useState("");
  const [templateBlokIds, setTemplateBlokIds] = useState<string[]>([]);

  async function loadAll() {
    if (!activeLabel) return;
    setLoading(true);
    const [bRes, tRes] = await Promise.all([
      fetch(`/api/templates/blokken?labelId=${activeLabel.id}`),
      fetch(`/api/templates?labelId=${activeLabel.id}`),
    ]);
    setBlokken(await bRes.json());
    setTemplates(await tRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [activeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLabel) return;

    if (editingBlock) {
      await fetch("/api/templates/blokken", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBlock.id,
          bloknaam: blockNaam,
          type: blockType,
          bodyHtml: blockHtml,
        }),
      });
    } else {
      await fetch("/api/templates/blokken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labelId: activeLabel.id,
          bloknaam: blockNaam,
          type: blockType,
          bodyHtml: blockHtml,
          variabelen: VARIABELEN.filter((v) => blockHtml.includes(`{{${v}}}`)),
        }),
      });
    }

    resetBlockForm();
    loadAll();
  }

  function resetBlockForm() {
    setShowBlockForm(false);
    setEditingBlock(null);
    setBlockNaam("");
    setBlockType("statisch");
    setBlockHtml("");
  }

  function editBlock(blok: EmailBlok) {
    setEditingBlock(blok);
    setBlockNaam(blok.bloknaam);
    setBlockType(blok.type);
    setBlockHtml(blok.bodyHtml);
    setShowBlockForm(true);
  }

  async function deleteBlock(id: string) {
    if (!confirm("Blok verwijderen?")) return;
    await fetch(`/api/templates/blokken?id=${id}`, { method: "DELETE" });
    loadAll();
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLabel) return;

    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        labelId: activeLabel.id,
        templateNaam,
        onderwerpTemplate: templateOnderwerp,
        blokIds: templateBlokIds,
      }),
    });

    setShowTemplateForm(false);
    setTemplateNaam("");
    setTemplateOnderwerp("");
    setTemplateBlokIds([]);
    loadAll();
  }

  if (loading) {
    return <div className="py-10 text-center text-gray-500">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">E-mail Templates</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Blokken</h2>
            <Button size="sm" onClick={() => setShowBlockForm(true)}>
              + Blok
            </Button>
          </div>

          {blokken.length === 0 ? (
            <p className="text-sm text-gray-500">Geen blokken</p>
          ) : (
            <div className="space-y-3">
              {blokken.map((blok) => (
                <Card key={blok.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {blok.bloknaam}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          {blok.type}
                        </span>
                      </div>
                      <div className="mt-1 max-h-20 overflow-hidden text-xs text-gray-500">
                        {blok.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 120)}...
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editBlock(blok)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => deleteBlock(blok.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Templates</h2>
            <Button
              size="sm"
              onClick={() => setShowTemplateForm(true)}
              disabled={blokken.length === 0}
            >
              + Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">Geen templates</p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <Card key={template.id}>
                  <div className="font-medium text-gray-900">
                    {template.templateNaam}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Onderwerp: {template.onderwerpTemplate}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.blokken.map((tb) => (
                      <span
                        key={tb.id}
                        className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {tb.volgorde}. {tb.blok.bloknaam}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variabelen reference */}
      <Card title="Beschikbare variabelen">
        <div className="flex flex-wrap gap-2">
          {VARIABELEN.map((v) => (
            <code
              key={v}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      </Card>

      {/* Block form modal */}
      <Modal
        open={showBlockForm}
        onClose={resetBlockForm}
        title={editingBlock ? "Blok bewerken" : "Blok toevoegen"}
        size="lg"
      >
        <form onSubmit={saveBlock} className="space-y-4">
          <Input
            label="Bloknaam"
            value={blockNaam}
            onChange={(e) => setBlockNaam(e.target.value)}
            required
          />
          <Select
            label="Type"
            options={BLOK_TYPES}
            value={blockType}
            onChange={(e) => setBlockType(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTML Body
            </label>
            <textarea
              value={blockHtml}
              onChange={(e) => setBlockHtml(e.target.value)}
              rows={8}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="<p>Beste {{contactpersoon}},</p>"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={resetBlockForm}>
              Annuleren
            </Button>
            <Button type="submit">Opslaan</Button>
          </div>
        </form>
      </Modal>

      {/* Template form modal */}
      <Modal
        open={showTemplateForm}
        onClose={() => setShowTemplateForm(false)}
        title="Template toevoegen"
        size="lg"
      >
        <form onSubmit={saveTemplate} className="space-y-4">
          <Input
            label="Templatenaam"
            value={templateNaam}
            onChange={(e) => setTemplateNaam(e.target.value)}
            required
          />
          <Input
            label="Onderwerp (met variabelen)"
            value={templateOnderwerp}
            onChange={(e) => setTemplateOnderwerp(e.target.value)}
            placeholder="bijv. Kandidaat introductie voor {{bedrijfsnaam}}"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blokken (selecteer in gewenste volgorde)
            </label>
            <div className="space-y-2">
              {blokken.map((blok) => {
                const index = templateBlokIds.indexOf(blok.id);
                const isSelected = index !== -1;
                return (
                  <label
                    key={blok.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setTemplateBlokIds(templateBlokIds.filter((id) => id !== blok.id));
                        } else {
                          setTemplateBlokIds([...templateBlokIds, blok.id]);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{blok.bloknaam}</span>
                      <span className="ml-2 text-xs text-gray-500">({blok.type})</span>
                    </div>
                    {isSelected && (
                      <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                        {index + 1}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTemplateForm(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={templateBlokIds.length === 0}>
              Opslaan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
