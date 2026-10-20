import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import AccountTypeOnboarding from "@/components/auth/AccountTypeOnboarding";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import RouteGuard from "./RouteGuard";
import RouteSeo from "./RouteSeo";
import RoutePolicyGate from "./RoutePolicyGate";
import ReferralAttributionCapture from "@/components/referrals/ReferralAttributionCapture";
import { PageLoader } from "./routeUtils";
import { resolveAliasDestination } from "./aliasDestination";
import {
  routeAliases,
  routeManifest,
  type RouteAccess,
  type RouteEntry,
  type RouteLayout,
} from "./routeManifest";

/**
 * Router derivado 100% del manifiesto: las rutas se agrupan por
 * (acceso, layout) y cada grupo comparte un único guard + layout padre.
 */
type GroupKey = `${RouteAccess}|${RouteLayout}`;

const groups = routeManifest.reduce<Record<GroupKey, RouteEntry[]>>((acc, entry) => {
  const key: GroupKey = `${entry.access}|${entry.layout}`;
  (acc[key] ||= []).push(entry);
  return acc;
}, {} as Record<GroupKey, RouteEntry[]>);

/** An alias must preserve deep links, search filters and anchor context. */
const AliasRedirect = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  return <Navigate to={resolveAliasDestination(to, search, hash)} replace />;
};

const AppRouter = () => (
  <BrowserRouter>
    <RootErrorBoundary>
      <RouteSeo />
      <ReferralAttributionCapture />
      <AccountTypeOnboarding />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {Object.entries(groups).map(([key, entries]) => {
            const [access, layout] = key.split("|") as [RouteAccess, RouteLayout];
            return (
              <Route
                key={key}
                element={<RouteGuard access={access} layout={layout} />}
              >
                {entries.map((entry) => (
                  <Route
                    key={entry.id}
                    path={entry.path}
                    element={
                      entry.policy ? (
                        <RoutePolicyGate policy={entry.policy}>
                          {entry.element}
                        </RoutePolicyGate>
                      ) : entry.element
                    }
                  />
                ))}
              </Route>
            );
          })}

          {routeAliases.map((alias) => (
            <Route
              key={`alias-${alias.from}`}
              path={alias.from}
              element={<AliasRedirect to={alias.to} />}
            />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RootErrorBoundary>
  </BrowserRouter>
);

export default AppRouter;
