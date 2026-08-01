import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLogoAtual, trocarLogo } from "./service";
import { useCurrentProfile } from "@/features/auth/use-current-profile";

const KEY = ["app-logo"];

export function useAppLogo() {
  const { data: profile } = useCurrentProfile();
  return useQuery({
    queryKey: [...KEY, profile?.id],
    queryFn: () => getLogoAtual(profile!.id),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrocarAppLogo() {
  const qc = useQueryClient();
  const { data: profile } = useCurrentProfile();
  return useMutation({
    mutationFn: (file: File) => trocarLogo(profile!.id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
