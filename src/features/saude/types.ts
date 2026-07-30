import type { Database } from "@/integrations/supabase/types";

export type CheckinSaude = Database["public"]["Tables"]["saude_checkins"]["Row"];

export type NovoCheckinSaude = Pick<
  Database["public"]["Tables"]["saude_checkins"]["Insert"],
  "humor" | "energia" | "sono" | "obs"
>;
