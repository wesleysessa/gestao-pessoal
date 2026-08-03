import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  desmarcarCheckinAcademia,
  listCheckinsAcademia,
  marcarCheckinAcademiaHoje,
} from "./service";

const KEY = ["academia-checkins"];

export function useCheckinsAcademia() {
  return useQuery({ queryKey: KEY, queryFn: listCheckinsAcademia });
}

export function useMarcarCheckinAcademiaHoje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarCheckinAcademiaHoje,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDesmarcarCheckinAcademia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desmarcarCheckinAcademia(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
