import { useQuery } from "@tanstack/react-query";
import { signedUrl } from "./storage";

/** Resolve uma signed URL para exibir um objeto de bucket privado. */
export function useSignedUrl(bucket: string, stored: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", bucket, stored],
    enabled: !!stored,
    staleTime: 50 * 60 * 1000, // renova antes de expirar (1h)
    queryFn: () => signedUrl(bucket, stored as string),
  });
}
