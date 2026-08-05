-- Universitely Faz 5: E-posta hatirlatma ayari
-- ogrenci_profilleri tablosuna email_bildirim kolonu ekler
-- Kullanim: Supabase > SQL Editor > New query > yapistir > RUN

alter table ogrenci_profilleri
  add column if not exists email_bildirim boolean not null default false;
