import { BrowserRouter, Route, Routes } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import { adminRoutes } from "./adminRoutes";
import { agentRoutes } from "./agentRoutes";
import { buyerRoutes } from "./buyerRoutes";
import { legacyRedirects } from "./legacyRedirects";
import { publicRoutes } from "./publicRoutes";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {publicRoutes}
      {buyerRoutes}
      {agentRoutes}
      {adminRoutes}
      {legacyRedirects}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
