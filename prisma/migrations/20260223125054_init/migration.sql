-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "land" TEXT NOT NULL,
    "taal" TEXT NOT NULL,
    "vlag" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Actief',
    "huidigeVolgnummer" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kandidaat" (
    "id" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "referentiecode" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "woonplaats" TEXT NOT NULL,
    "regio" TEXT NOT NULL,
    "korteOmschrijving" TEXT NOT NULL,
    "specialismen" TEXT[],
    "uitsluitingen" TEXT[],
    "concurrentiebedingTekst" TEXT,
    "concurrentiebedingVerloopt" TIMESTAMP(3),
    "salariseis" TEXT,
    "zoekprofiel" TEXT,
    "reisbereidheid" TEXT NOT NULL DEFAULT 'Gemiddeld',
    "lopendeProcesen" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Beschikbaar',
    "anoniemCvLink" TEXT,
    "uitgebreidCvLink" TEXT,
    "notities" TEXT,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kandidaat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bedrijf" (
    "id" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "bedrijfsnaam" TEXT NOT NULL,
    "contactpersoon" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefoon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Prospect',
    "zoektInRegios" TEXT[],
    "werkgebiedType" TEXT NOT NULL DEFAULT 'Landelijk',
    "sector" TEXT,
    "bekendeMerken" TEXT[],
    "notities" TEXT,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bedrijf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bedrijfsrelatie" (
    "id" TEXT NOT NULL,
    "labelId" TEXT,
    "moederbedrijf" TEXT NOT NULL,
    "verwantBedrijf" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Bedrijfsrelatie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntroductieTracking" (
    "id" TEXT NOT NULL,
    "kandidaatId" TEXT NOT NULL,
    "bedrijfId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Niet gestuurd',
    "datumLaatstGewijzigd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notities" TEXT,

    CONSTRAINT "IntroductieTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActieLog" (
    "id" TEXT NOT NULL,
    "kandidaatId" TEXT,
    "bedrijfId" TEXT,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actie" TEXT NOT NULL,
    "automatisch" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActieLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailBlok" (
    "id" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "bloknaam" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variabelen" TEXT[],
    "volgorde" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailBlok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "templateNaam" TEXT NOT NULL,
    "onderwerpTemplate" TEXT NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateBlok" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "blokId" TEXT NOT NULL,
    "volgorde" INTEGER NOT NULL,

    CONSTRAINT "TemplateBlok_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Label_prefix_key" ON "Label"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "Kandidaat_referentiecode_key" ON "Kandidaat"("referentiecode");

-- CreateIndex
CREATE INDEX "Kandidaat_labelId_idx" ON "Kandidaat"("labelId");

-- CreateIndex
CREATE INDEX "Kandidaat_status_idx" ON "Kandidaat"("status");

-- CreateIndex
CREATE INDEX "Kandidaat_regio_idx" ON "Kandidaat"("regio");

-- CreateIndex
CREATE INDEX "Bedrijf_labelId_idx" ON "Bedrijf"("labelId");

-- CreateIndex
CREATE INDEX "Bedrijf_status_idx" ON "Bedrijf"("status");

-- CreateIndex
CREATE INDEX "Bedrijfsrelatie_moederbedrijf_idx" ON "Bedrijfsrelatie"("moederbedrijf");

-- CreateIndex
CREATE INDEX "Bedrijfsrelatie_verwantBedrijf_idx" ON "Bedrijfsrelatie"("verwantBedrijf");

-- CreateIndex
CREATE UNIQUE INDEX "IntroductieTracking_kandidaatId_bedrijfId_key" ON "IntroductieTracking"("kandidaatId", "bedrijfId");

-- CreateIndex
CREATE INDEX "ActieLog_kandidaatId_idx" ON "ActieLog"("kandidaatId");

-- CreateIndex
CREATE INDEX "ActieLog_bedrijfId_idx" ON "ActieLog"("bedrijfId");

-- CreateIndex
CREATE INDEX "ActieLog_datum_idx" ON "ActieLog"("datum");

-- CreateIndex
CREATE INDEX "EmailBlok_labelId_idx" ON "EmailBlok"("labelId");

-- CreateIndex
CREATE INDEX "EmailTemplate_labelId_idx" ON "EmailTemplate"("labelId");

-- AddForeignKey
ALTER TABLE "Kandidaat" ADD CONSTRAINT "Kandidaat_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bedrijf" ADD CONSTRAINT "Bedrijf_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bedrijfsrelatie" ADD CONSTRAINT "Bedrijfsrelatie_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductieTracking" ADD CONSTRAINT "IntroductieTracking_kandidaatId_fkey" FOREIGN KEY ("kandidaatId") REFERENCES "Kandidaat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductieTracking" ADD CONSTRAINT "IntroductieTracking_bedrijfId_fkey" FOREIGN KEY ("bedrijfId") REFERENCES "Bedrijf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActieLog" ADD CONSTRAINT "ActieLog_kandidaatId_fkey" FOREIGN KEY ("kandidaatId") REFERENCES "Kandidaat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActieLog" ADD CONSTRAINT "ActieLog_bedrijfId_fkey" FOREIGN KEY ("bedrijfId") REFERENCES "Bedrijf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailBlok" ADD CONSTRAINT "EmailBlok_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateBlok" ADD CONSTRAINT "TemplateBlok_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateBlok" ADD CONSTRAINT "TemplateBlok_blokId_fkey" FOREIGN KEY ("blokId") REFERENCES "EmailBlok"("id") ON DELETE CASCADE ON UPDATE CASCADE;
