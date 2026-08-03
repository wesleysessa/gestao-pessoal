import type { Database } from "@/integrations/supabase/types";

export type CheckinAcademia = Database["public"]["Tables"]["academia_checkins"]["Row"];
