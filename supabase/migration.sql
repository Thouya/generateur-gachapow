-- ============================================
-- Générateur Gachapow — Schéma Supabase
-- ============================================
-- À exécuter dans l'éditeur SQL de Supabase
-- (Dashboard → SQL Editor → New Query → coller → Run)

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  csv_data JSONB DEFAULT '[]'::jsonb,
  csv_columns JSONB DEFAULT '[]'::jsonb,
  selected_card_type_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des types de cartes
CREATE TABLE IF NOT EXISTS card_types (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width INTEGER DEFAULT 300,
  height INTEGER DEFAULT 420,
  background_image TEXT DEFAULT '',
  illustration_image TEXT DEFAULT '',
  illustration_column TEXT DEFAULT '',
  overlay_image TEXT DEFAULT '',
  content_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des cartes générées
CREATE TABLE IF NOT EXISTS generated_cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  card_type_id TEXT NOT NULL REFERENCES card_types(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_card_types_project ON card_types(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_cards_project ON generated_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_cards_type ON generated_cards(card_type_id);

-- RLS : accès libre (pas d'authentification pour l'instant)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_projects" ON projects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_card_types" ON card_types FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_generated_cards" ON generated_cards FOR ALL TO anon USING (true) WITH CHECK (true);
