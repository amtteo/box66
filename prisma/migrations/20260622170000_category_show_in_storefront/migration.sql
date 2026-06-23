-- Kategória môže byť skrytá z nákupného menu (objednávka), ale viditeľná na prezentačnom menu.

ALTER TABLE "categories" ADD COLUMN "showInStorefront" BOOLEAN NOT NULL DEFAULT true;
