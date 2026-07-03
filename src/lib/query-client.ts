import { isServer, QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The mock API returns a fully random dataset per request: implicit
        // refetches would shift the whole view under the user.
        staleTime: Infinity,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// Server: fresh client per request (no cross-user leakage).
// Browser: singleton, so the hydrated cache survives re-renders.
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
