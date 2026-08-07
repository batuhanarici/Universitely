import { supabase } from "./supabase";

const BUCKET = "avatars";

function avatarYolu(userId: string): string {
  return `${userId}/avatar`;
}

export async function avatarYukle(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı.");
  const yol = avatarYolu(user.id);
  const secenekler: { upsert: boolean; cacheControl: string; contentType?: string } = {
    upsert: true,
    cacheControl: "3600",
  };
  if (file.type) secenekler.contentType = file.type;
  const { error } = await supabase.storage.from(BUCKET).upload(yol, file, secenekler);
  if (error) throw error;
  return yol;
}

export async function avatarSil(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.storage.from(BUCKET).remove([avatarYolu(user.id)]);
}

export function avatarPublicUrl(yol: string | null | undefined): string | null {
  if (!yol) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(yol);
  return data.publicUrl;
}
