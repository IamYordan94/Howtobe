-- Phase 4: Content Pipeline Schema
-- Run this in Supabase SQL Editor

-- Add new columns to lessons table
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generation_model TEXT;

-- Create source_cache table to avoid repeated API calls
CREATE TABLE IF NOT EXISTS source_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,
  source_name TEXT NOT NULL,  -- perplexity, wikipedia, openstax, khan, mit, gutenberg, pubmed
  level TEXT,                 -- beginner / intermediate / advanced (perplexity is level-specific)
  content TEXT,
  source_urls TEXT[] DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_source_cache_lookup 
  ON source_cache (subject_id, source_name, level);
