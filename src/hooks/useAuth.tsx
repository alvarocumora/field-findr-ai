import { toast } from "sonner";
import { clearReservationDraft } from "@/lib/reservationDraft";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: {
      first_name?: string;
      last_name?: string;
      account_type?: string;
    },
  ) => Promise<{ session: Session | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const identity = useRef<string | null>(null);
  const applySession = useCallback((next: Session | null) => {
    const nextIdentity = next?.user.id ?? null;
    if (identity.current && identity.current !== nextIdentity)
      clearReservationDraft();
    identity.current = nextIdentity;
    setSession(next);
    setUser(next?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      receivedEvent = true;
      applySession(session);
    });

    // The initial read must never overwrite a newer SIGNED_OUT/SIGNED_IN event.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (active && !receivedEvent) applySession(error ? null : session);
      })
      .catch(() => {
        if (active && !receivedEvent) applySession(null);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: {
      first_name?: string;
      last_name?: string;
      account_type?: string;
    },
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: metadata,
      },
    });
    // session === null with no error means email confirmation is required —
    // callers must tell the user to check their inbox instead of "log in now".
    return { session: data?.session ?? null, error };
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) toast.error("No pudimos cerrar tu sesión. Reintenta.");
      return { error };
    } catch (cause) {
      const error =
        cause instanceof Error
          ? cause
          : new Error("No pudimos cerrar tu sesión");
      toast.error("No pudimos cerrar tu sesión. Reintenta.");
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
