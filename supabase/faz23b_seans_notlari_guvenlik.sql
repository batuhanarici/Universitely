-- Faz 23b: Seans takip RPC'lerinde anonim çalıştırma yetkisini kapat.
-- Supabase rol ACL'lerinde PUBLIC geri alma işlemi anon rolünü her ortamda açıkça kapsamayıp
-- linter uyarısı bırakabildiği için anon ayrıca belirtilir.

revoke execute on function public.takip_maddesi_durum_guncelle(uuid, text) from anon;
revoke execute on function public.takip_maddesi_durum_guncelle(uuid, text) from public;
grant execute on function public.takip_maddesi_durum_guncelle(uuid, text) to authenticated;

revoke execute on function public.takip_maddesini_goreve_donustur(uuid) from anon;
revoke execute on function public.takip_maddesini_goreve_donustur(uuid) from public;
grant execute on function public.takip_maddesini_goreve_donustur(uuid) to authenticated;

revoke execute on function public.takip_maddesi_bildirimi_olustur() from anon;
revoke execute on function public.takip_maddesi_bildirimi_olustur() from public;
