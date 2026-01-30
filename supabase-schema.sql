-- Run this in your Supabase SQL Editor

-- Create the pages table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'html' CHECK (content_type IN ('html', 'image')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON pages
  FOR SELECT USING (true);

-- Allow authenticated inserts and updates (adjust as needed)
CREATE POLICY "Allow service role full access" ON pages
  FOR ALL USING (true);

-- Enable realtime for the pages table
ALTER PUBLICATION supabase_realtime ADD TABLE pages;

-- Create an index on slug for faster lookups
CREATE INDEX idx_pages_slug ON pages(slug);

-- ============================================
-- MIGRATION: Add content_type to existing table
-- Run this if you already have the pages table:
-- ============================================
-- ALTER TABLE pages ADD COLUMN content_type TEXT DEFAULT 'html' CHECK (content_type IN ('html', 'image'));

-- ============================================
-- STORAGE: Create bucket for images
-- Run this in Supabase SQL Editor:
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Allow public read access to images
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Allow service role to upload images
CREATE POLICY "Service role upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow service role to delete images
CREATE POLICY "Service role delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');
