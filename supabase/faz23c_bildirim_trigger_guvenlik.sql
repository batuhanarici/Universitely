-- Faz 23c: Trigger-only bildirimi fonksiyonunun API üzerinden çalıştırılmasını kapat.
-- Durum güncelleme ve göreve bağlama RPC'leri authenticated kullanıcılar için bilinçli olarak açıktır;
-- bu trigger fonksiyonu ise yalnızca tablo trigger'ı tarafından çağrılmalıdır.
revoke execute on function public.takip_maddesi_bildirimi_olustur() from anon;
revoke execute on function public.takip_maddesi_bildirimi_olustur() from authenticated;
revoke execute on function public.takip_maddesi_bildirimi_olustur() from public;
