import { createClient } from "@supabase/supabase-js";

import { config, logger } from "@/config/index.js";

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

const BUCKET_NAME = "images";

export const uploadImageFromUrl = async (
  imageUrl: string,
  filename: string,
): Promise<string> => {
  // Fetch the image from the URL
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/png";

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, imageBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    logger.error({ err: error }, "Failed to upload image to Supabase Storage");
    throw error;
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
};

export const deleteImage = async (filename: string): Promise<void> => {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filename]);

  if (error) {
    logger.error(
      { err: error },
      "Failed to delete image from Supabase Storage",
    );
    throw error;
  }
};
