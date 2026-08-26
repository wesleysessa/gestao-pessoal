-- "Escopo" do evento: pessoal (padrão, nunca sai daqui) ou profissional
-- (replica como compromisso na Agenda Comercial do Home & Tech — projeto
-- Supabase separado). compromisso_ht_id guarda o vínculo com o registro lá
-- (sem FK de verdade, é outro banco — validado só na aplicação).
alter table public.agenda_eventos
  add column escopo text not null default 'pessoal' check (escopo in ('pessoal', 'profissional')),
  add column compromisso_ht_id uuid;
