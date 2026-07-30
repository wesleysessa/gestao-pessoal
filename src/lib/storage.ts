import { supabase } from "@/integrations/supabase/client";

/**
 * Upload em bucket PRIVADO. Retorna o PATH do objeto (não a URL).
 * O path é o que deve ser guardado no banco; a exibição usa signed URL.
 */
export async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

/**
 * Extrai o path do objeto a partir do valor salvo.
 * Tolera valores legados (URL pública/assinada) e o novo formato (path puro).
 */
export function storagePath(bucket: string, stored: string): string {
  for (const marker of [`/object/public/${bucket}/`, `/object/sign/${bucket}/`]) {
    const i = stored.indexOf(marker);
    if (i >= 0) return stored.slice(i + marker.length).split("?")[0];
  }
  return stored; // já é um path
}

/** Gera uma signed URL (acesso temporário e autenticado) a partir do valor salvo. */
export async function signedUrl(
  bucket: string,
  stored: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath(bucket, stored), expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
