import type { Database } from "@/integrations/supabase/types";

export type StreakEstado = Database["public"]["Functions"]["sync_streak"]["Returns"];
