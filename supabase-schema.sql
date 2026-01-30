-- Run this in your Supabase SQL Editor

-- Create the pages table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
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
