import type { Database } from "@/integrations/supabase/types";

export type GoogleHealthStatus = Database["public"]["Tables"]["google_health_status"]["Row"];
export type GoogleHealthDado = Database["public"]["Tables"]["google_health_dados"]["Row"];
