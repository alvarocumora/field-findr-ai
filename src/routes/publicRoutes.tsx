import { Route } from "react-router-dom";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Tools from "@/pages/Tools";
import Explorar from "@/pages/Explorar";
import PropertyDetail from "@/pages/PropertyDetail";
import ProjectDetail from "@/pages/ProjectDetail";
import Install from "@/pages/Install";
import Pricing from "@/pages/Pricing";
import Referrals from "@/pages/Referrals";
import IntelligentSearch from "@/components/IntelligentSearch";
import RegionLanding from "@/pages/RegionLanding";
import CountryLanding from "@/pages/CountryLanding";
import CityLanding from "@/pages/CityLanding";
import Contact from "@/pages/Contact";
import Comparar from "@/pages/Comparar";
import Alertas from "@/pages/Alertas";
import Blog from "@/pages/Blog";
import Oportunidades from "@/pages/Oportunidades";
import BuyerQuiz from "@/pages/BuyerQuiz";
import ProjectExperience from "@/pages/ProjectExperience";
import ResetPassword from "@/pages/ResetPassword";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionFailure from "@/pages/SubscriptionFailure";
import ReservationSuccess from "@/pages/ReservationSuccess";
import ReservationError from "@/pages/ReservationError";
import ReservationPending from "@/pages/ReservationPending";
import VisualScenariosDemo from "@/pages/demo/VisualScenariosDemo";
import TasacionLive from "@/pages/TasacionLive";
import TasacionValidator from "@/pages/TasacionValidator";

export const publicRoutes = [
  <Route key="home" path="/" element={<Index />} />,
  <Route key="auth" path="/auth" element={<Auth />} />,
  <Route key="explorar" path="/explorar" element={<Explorar />} />,
  <Route key="propiedad" path="/propiedad/:id" element={<PropertyDetail />} />,
  <Route key="proyecto" path="/proyecto/:id" element={<ProjectDetail />} />,
  <Route key="pricing" path="/pricing" element={<Pricing />} />,
  <Route key="tools" path="/tools" element={<Tools />} />,
  <Route key="search" path="/search" element={<IntelligentSearch />} />,
  <Route key="visual-scenarios-demo" path="/demo/visual-scenarios" element={<VisualScenariosDemo />} />,
  <Route key="instalar" path="/instalar" element={<Install />} />,
  <Route key="referidos" path="/referidos" element={<Referrals />} />,
  <Route key="region" path="/region/:slug" element={<RegionLanding />} />,
  <Route key="pais" path="/pais/:code" element={<CountryLanding />} />,
  <Route key="ciudad" path="/ciudad/:slug" element={<CityLanding />} />,
  <Route key="contacto" path="/contacto" element={<Contact />} />,
  <Route key="comparar" path="/comparar" element={<Comparar />} />,
  <Route key="alertas" path="/alertas" element={<Alertas />} />,
  <Route key="blog" path="/blog" element={<Blog />} />,
  <Route key="oportunidades" path="/oportunidades" element={<Oportunidades />} />,
  <Route key="quiz" path="/quiz" element={<BuyerQuiz />} />,
  <Route key="project-experience" path="/proyecto/:id/experiencia" element={<ProjectExperience />} />,
  <Route key="reset-password" path="/reset-password" element={<ResetPassword />} />,
  <Route key="subscription-success" path="/subscription/success" element={<SubscriptionSuccess />} />,
  <Route key="subscription-failure" path="/subscription/failure" element={<SubscriptionFailure />} />,
  <Route key="reservation-success" path="/reserva/exito" element={<ReservationSuccess />} />,
  <Route key="reservation-error" path="/reserva/error" element={<ReservationError />} />,
  <Route key="reservation-pending" path="/reserva/pendiente" element={<ReservationPending />} />,
  <Route key="tasacion-live" path="/tasacion/v/:id" element={<TasacionLive />} />,
  <Route key="tasacion-validar" path="/tasacion/validar" element={<TasacionValidator />} />,
];
