-- Enable PostgreSQL trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for faster fuzzy search on recipes
CREATE INDEX IF NOT EXISTS recipes_title_trgm_idx ON recipes USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipes_description_trgm_idx ON recipes USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipes_cuisine_type_trgm_idx ON recipes USING GIN (cuisine_type gin_trgm_ops);

-- Add GIN index for ingredient names
CREATE INDEX IF NOT EXISTS ingredients_name_trgm_idx ON ingredients USING GIN (name gin_trgm_ops);

-- Made with Bob
