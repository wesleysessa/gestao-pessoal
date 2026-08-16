import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCheckins, updateCheckin, upsertCheckinHoje } from "./service";
import type { NovoCheckinSaude } from "./types";

const KEY = ["saude-checkins"];

export function useCheckins() {
  return useQuery({ queryKey: KEY, queryFn: listCheckins });
}

export function useUpsertCheckinHoje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovoCheckinSaude) => upsertCheckinHoje(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovoCheckinSaude }) =>
      updateCheckin(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
