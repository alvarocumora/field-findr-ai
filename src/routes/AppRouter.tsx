import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import ReferralAttributionTracker from "@/components/referrals/ReferralAttributionTracker";
import RouteGuard from "./RouteGuard";
import RouteSeo from "./RouteSeo";
import RoutePolicyGate from "./RoutePolicyGate";
import { PageLoader } from "./routeUtils";
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

const AppRouter = () => (
  <BrowserRouter>
    <ReferralAttributionTracker />
    <RootErrorBoundary>
      <RouteSeo />
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
              element={<Navigate to={alias.to} replace />}
            />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RootErrorBoundary>
  </BrowserRouter>
);

export default AppRouter;
