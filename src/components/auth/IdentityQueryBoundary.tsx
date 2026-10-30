import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const createClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
    },
  });

/** Rotate the entire client when leaving an authenticated identity. Old async
 * callbacks retain the old client and cannot repopulate the next user's cache.
 * Guest -> login preserves public forms and the OAuth/recovery event listeners.
 */
export default function IdentityQueryBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const identity = user?.id ?? null;
  const [scope, setScope] = useState(() => ({
    identity,
    generation: 0,
    client: createClient(),
  }));
  let current = scope;
  if (scope.identity !== identity) {
    const leavingAccount = scope.identity !== null;
    current = {
      identity,
      generation: scope.generation + (leavingAccount ? 1 : 0),
      client: leavingAccount ? createClient() : scope.client,
    };
    // Adjust this component's state before descendants render with a new identity.
    setScope(current);
  }
  const client = current.client;
  useEffect(() => () => client.clear(), [client]);
  return (
    <QueryClientProvider key={current.generation} client={client}>
      {children}
    </QueryClientProvider>
  );
}
