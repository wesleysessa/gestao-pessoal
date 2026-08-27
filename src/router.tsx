import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      // Mantém os dados em memória por 24h mesmo sem tela nenhuma observando
      // — é o que permite reidratar do localStorage (ver __root.tsx) quando
      // o app abre offline.
      queries: { gcTime: 24 * 60 * 60 * 1000 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
