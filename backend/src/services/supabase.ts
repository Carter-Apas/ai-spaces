import { createClient } from "@supabase/supabase-js";

import { config } from "@/config/index.js";

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export interface Page {
  id: string;
  slug: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export const upsertPage = async (
  slug: string,
  content: string
): Promise<Page> => {
  const { data, error } = await supabase
    .from("pages")
    .upsert(
      {
        slug,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Page;
};

export const getPage = async (slug: string): Promise<Page | null> => {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data as Page | null;
};
