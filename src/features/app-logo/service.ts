import { supabase } from "@/integrations/supabase/client";

export const LOGO_BUCKET = "app-logo";

/** URL pública do logo atual (com cache-bust pela data de modificação), ou null se nunca trocou. */
export async function getLogoAtual(userId: string) {
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).list(userId);
  if (error) throw error;
  const arquivo = data?.find((f) => f.name.startsWith("logo."));
  if (!arquivo) return null;
  const path = `${userId}/${arquivo.name}`;
  const {
    data: { publicUrl },
  } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const versao = arquivo.updated_at ?? arquivo.created_at ?? "";
  return `${publicUrl}?v=${encodeURIComponent(versao)}`;
}

export async function trocarLogo(userId: string, file: File) {
  const { data: existentes } = await supabase.storage.from(LOGO_BUCKET).list(userId);
  const antigos = (existentes ?? [])
    .filter((f) => f.name.startsWith("logo."))
    .map((f) => `${userId}/${f.name}`);
  if (antigos.length > 0) {
    await supabase.storage.from(LOGO_BUCKET).remove(antigos);
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/logo.${ext}`;
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
}
