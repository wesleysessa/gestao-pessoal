import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCheckins, upsertCheckinHoje } from "./service";
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
