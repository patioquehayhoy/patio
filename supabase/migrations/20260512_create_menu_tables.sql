CREATE TABLE IF NOT EXISTS menu_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fondita_id uuid REFERENCES fonditas(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES menu_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  price text,
  description text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS menu_sections_fondita_id_idx ON menu_sections(fondita_id);
CREATE INDEX IF NOT EXISTS menu_items_section_id_idx ON menu_items(section_id);
