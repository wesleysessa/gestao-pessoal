import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Perfil do usuário logado (id, nome de exibição, e-mail). */
export function useCurrentProfile() {
  return useQuery({
    queryKey: ["current-profile"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      const name = data.user.email ?? data.user.id.slice(0, 8);
      return { id: data.user.id, name, email: data.user.email ?? null };
    },
  });
}
