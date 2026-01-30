import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export async function upsertPage(slug, content) {
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

  return data;
}

export async function getPage(slug) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}
