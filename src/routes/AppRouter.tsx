import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import { adminRoutes } from "./adminRoutes";
import { agentRoutes } from "./agentRoutes";
import { buyerRoutes } from "./buyerRoutes";
import { legacyRedirects } from "./legacyRedirects";
import { publicRoutes } from "./publicRoutes";
import { PageLoader } from "./routeUtils";

const AppRouter = () => (
  <BrowserRouter>
    <RootErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {publicRoutes}
          {buyerRoutes}
          {agentRoutes}
          {adminRoutes}
          {legacyRedirects}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RootErrorBoundary>
  </BrowserRouter>
);

export default AppRouter;
