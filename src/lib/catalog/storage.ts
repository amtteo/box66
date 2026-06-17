import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const CATALOG_BUCKET = "catalog";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export type ImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Je `value` použiteľný nahraný súbor (a nie prázdny input)? */
export function isUploadedFile(value: unknown): value is File {
  return value instanceof File && value.size > 0;
}

/**
 * Nahrá obrázok do bucketu `catalog` cez service-role klient (obchádza RLS)
 * a vráti verejnú URL. `folder` rozlišuje kategórie/produkty.
 */
export async function uploadCatalogImage(
  file: File,
  folder: string,
): Promise<ImageUploadResult> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Obrázok je príliš veľký (max. 4 MB)." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Nepodporovaný formát obrázka." };
  }

  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { ok: false, error: "Nahranie obrázka zlyhalo. Skús to znova." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CATALOG_BUCKET).getPublicUrl(path);

  return { ok: true, url: publicUrl };
}

/** Odvodí cestu objektu v rámci bucketu z jeho verejnej URL. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${CATALOG_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/** Zmaže obrázok podľa jeho verejnej URL (ak patrí do nášho bucketu). */
export async function deleteCatalogImageByUrl(url: string): Promise<void> {
  const path = pathFromPublicUrl(url);
  if (!path) return;
  const supabase = createAdminClient();
  await supabase.storage.from(CATALOG_BUCKET).remove([path]);
}
