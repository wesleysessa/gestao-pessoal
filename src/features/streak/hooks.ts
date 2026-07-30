import { useQuery } from "@tanstack/react-query";
import { syncStreak } from "./service";

export function useStreak() {
  return useQuery({ queryKey: ["streak"], queryFn: syncStreak, staleTime: 5 * 60 * 1000 });
}
