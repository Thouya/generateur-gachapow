-- ============================================
-- Migration : ajout de l'authentification
-- ============================================
-- À exécuter APRÈS migration.sql si déjà appliqué
-- (Dashboard → SQL Editor → New Query → coller → Run)

-- Ajouter user_id aux projets
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Supprimer les anciennes policies permissives
DROP POLICY IF EXISTS "allow_all_projects" ON projects;
DROP POLICY IF EXISTS "allow_all_card_types" ON card_types;
DROP POLICY IF EXISTS "allow_all_generated_cards" ON generated_cards;
DROP POLICY IF EXISTS "allow_all_history" ON card_type_history;

-- Nouvelles policies : chaque utilisateur ne voit que ses données
CREATE POLICY "user_projects" ON projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_card_types" ON card_types
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "user_generated_cards" ON generated_cards
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "user_history" ON card_type_history
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
