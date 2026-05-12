import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BuyerLayout from "@/components/layouts/BuyerLayout";
import BuyerHome from "@/pages/BuyerHome";
import Favorites from "@/components/Favorites";
import MiTerreno from "@/pages/MiTerreno";
import Profile from "@/pages/Profile";
import Subscription from "@/pages/Subscription";

export const buyerRoutes = [
  <Route
    key="buyer-home"
    path="/buyer/home"
    element={<BuyerLayout><BuyerHome /></BuyerLayout>}
  />,
  <Route
    key="favoritos"
    path="/favoritos"
    element={<BuyerLayout><Favorites /></BuyerLayout>}
  />,
  <Route
    key="mi-terreno"
    path="/mi-terreno"
    element={<BuyerLayout><MiTerreno /></BuyerLayout>}
  />,
  <Route
    key="profile"
    path="/profile"
    element={<ProtectedRoute requireAuth><Profile /></ProtectedRoute>}
  />,
  <Route
    key="subscription"
    path="/subscription"
    element={<ProtectedRoute requireAuth><Subscription /></ProtectedRoute>}
  />,
];
