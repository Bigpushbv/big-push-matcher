// Re-export Prisma types for convenience
export type {
  Label,
  Kandidaat,
  Bedrijf,
  Bedrijfsrelatie,
  IntroductieTracking,
  ActieLog,
  EmailBlok,
  EmailTemplate,
  TemplateBlok,
} from "@/generated/prisma/client";

// Matching result types
export type MatchGroep = "Direct" | "Mogelijk" | "Breed";

export interface BedrijfMatch {
  bedrijf: import("@/generated/prisma/client").Bedrijf;
  groep: MatchGroep;
  aiScore?: number;
  aiReasoning?: string;
  introductieStatus?: string;
  warnings: string[];
}

export interface KandidaatMatch {
  kandidaat: import("@/generated/prisma/client").Kandidaat;
  groep: MatchGroep;
  aiScore?: number;
  aiReasoning?: string;
  introductieStatus?: string;
  warnings: string[];
}

export interface MatchResultBedrijven {
  direct: BedrijfMatch[];
  mogelijk: BedrijfMatch[];
  breed: BedrijfMatch[];
}

export interface MatchResultKandidaten {
  direct: KandidaatMatch[];
  mogelijk: KandidaatMatch[];
  breed: KandidaatMatch[];
}

// Email generation types
export interface EmailGenereerRequest {
  templateId: string;
  bedrijfId: string;
  kandidaatIds: string[];
  customParagraaf?: string;
  aangepasOmschrijvingen?: Record<string, string>; // kandidaatId → custom description
}

export interface EmailGenereerResult {
  onderwerpHtml: string;
  bodyHtml: string;
  kandidaatOmschrijvingen: Record<string, string>; // kandidaatId → AI-rewritten description
}

// Introduction tracking statuses
export const INTRODUCTIE_STATUSSEN = [
  "Niet gestuurd",
  "Geïntroduceerd",
  "Uitgenodigd",
  "Gesprek geweest",
  "Afgewezen door bedrijf",
  "Afgewezen door kandidaat",
  "Geplaatst",
] as const;

export type IntroductieStatus = (typeof INTRODUCTIE_STATUSSEN)[number];

// Candidate statuses
export const KANDIDAAT_STATUSSEN = [
  "Beschikbaar",
  "Niet beschikbaar",
  "In afwachting",
] as const;

export type KandidaatStatus = (typeof KANDIDAAT_STATUSSEN)[number];

// Company statuses
export const BEDRIJF_STATUSSEN = [
  "Actief contract",
  "In aansluiting",
  "Prospect",
] as const;

export type BedrijfStatus = (typeof BEDRIJF_STATUSSEN)[number];

// Travel willingness
export const REISBEREIDHEID_OPTIES = [
  "Laag",
  "Gemiddeld",
  "Hoog",
  "Landelijk",
] as const;

export type Reisbereidheid = (typeof REISBEREIDHEID_OPTIES)[number];

// Company relation types
export const RELATIE_TYPES = [
  "Dochter",
  "Zuster",
  "Historische naam",
  "Handelsnaam",
] as const;

export type RelatieType = (typeof RELATIE_TYPES)[number];

// Dutch provinces for region matching
export const PROVINCIES_NL = [
  "Groningen",
  "Friesland",
  "Drenthe",
  "Overijssel",
  "Flevoland",
  "Gelderland",
  "Utrecht",
  "Noord-Holland",
  "Zuid-Holland",
  "Zeeland",
  "Noord-Brabant",
  "Limburg",
] as const;

// German states for DE labels
export const BUNDESLAENDER_DE = [
  "Schleswig-Holstein",
  "Hamburg",
  "Niedersachsen",
  "Bremen",
  "Nordrhein-Westfalen",
  "Hessen",
  "Rheinland-Pfalz",
  "Baden-Württemberg",
  "Bayern",
  "Saarland",
  "Berlin",
  "Brandenburg",
  "Mecklenburg-Vorpommern",
  "Sachsen",
  "Sachsen-Anhalt",
  "Thüringen",
] as const;
