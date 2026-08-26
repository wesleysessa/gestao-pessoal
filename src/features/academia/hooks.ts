import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  desmarcarCheckinAcademia,
  listCheckinsAcademia,
  marcarCheckinAcademiaData,
  marcarCheckinAcademiaHoje,
} from "./service";
import { hoje } from "@/lib/data";

const KEY = ["academia-checkins"];

export function useCheckinsAcademia() {
  return useQuery({ queryKey: KEY, queryFn: listCheckinsAcademia });
}

/** Se já houve check-in da academia hoje — usado no pill do cabeçalho. */
export function useFoiAcademiaHoje() {
  const { data: checkins = [] } = useCheckinsAcademia();
  return checkins.some((c) => c.data === hoje());
}

export function useMarcarCheckinAcademiaHoje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarCheckinAcademiaHoje,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarcarCheckinAcademiaData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: string) => marcarCheckinAcademiaData(data),
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
