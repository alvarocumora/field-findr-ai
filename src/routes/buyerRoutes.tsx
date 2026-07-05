import { lazy } from "react";
import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BuyerLayout from "@/components/layouts/BuyerLayout";

const BuyerHome = lazy(() => import("@/pages/BuyerHome"));
const Favorites = lazy(() => import("@/components/Favorites"));
const MiTerreno = lazy(() => import("@/pages/MiTerreno"));
const Profile = lazy(() => import("@/pages/Profile"));
const Subscription = lazy(() => import("@/pages/Subscription"));

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
