import { lazy, type ReactNode } from "react";

/**
 * MANIFIESTO ÚNICO DE RUTAS
 * -------------------------
 * Fuente de verdad de toda la plataforma. De aquí se derivan:
 *  - el router (`AppRouter`), con layouts como rutas padre,
 *  - los alias / redirects legacy,
 *  - la navegación (helpers `navFor`),
 *  - la documentación (`docs/ROUTES_MAP.md`) y los tests anti-links-muertos.
 *
 * Regla: ninguna ruta nueva se declara fuera de este archivo.
 */

export type RouteArea = "public" | "buyer" | "agent" | "admin";
export type RouteAccess = "public" | "auth" | "agent" | "admin";
export type RouteLayout = "none" | "public" | "buyer" | "dashboard";

export interface NavMeta {
  label: string;
  group: string;
  /** Planes que ven el link; ausente = todos los del área. */
  plans?: string[];
}

export interface RouteEntry {
  id: string;
  /** Path absoluto tal como se navega. */
  path: string;
  area: RouteArea;
  access: RouteAccess;
  layout: RouteLayout;
  element: ReactNode;
  nav?: NavMeta;
  /** Indexable por buscadores (solo aplica a `public`). */
  indexable?: boolean;
}

export interface RouteAlias {
  from: string;
  to: string;
}

/* ------------------------------------------------------------------ */
/* Páginas (lazy: un chunk por ruta)                                    */
/* ------------------------------------------------------------------ */

// Públicas
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Tools = lazy(() => import("@/pages/Tools"));
const Explorar = lazy(() => import("@/pages/Explorar"));
const PropertyDetail = lazy(() => import("@/pages/PropertyDetail"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Install = lazy(() => import("@/pages/Install"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const PricingLoteos = lazy(() => import("@/pages/PricingLoteos"));
const ContactLoteos = lazy(() => import("@/pages/ContactLoteos"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const IntelligentSearch = lazy(() => import("@/components/IntelligentSearch"));
const RegionLanding = lazy(() => import("@/pages/RegionLanding"));
const CountryLanding = lazy(() => import("@/pages/CountryLanding"));
const CityLanding = lazy(() => import("@/pages/CityLanding"));
const Contact = lazy(() => import("@/pages/Contact"));
const Comparar = lazy(() => import("@/pages/Comparar"));
const Alertas = lazy(() => import("@/pages/Alertas"));
const Blog = lazy(() => import("@/pages/Blog"));
const Oportunidades = lazy(() => import("@/pages/Oportunidades"));
const BuyerQuiz = lazy(() => import("@/pages/BuyerQuiz"));
const ProjectExperience = lazy(() => import("@/pages/ProjectExperience"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const SubscriptionFailure = lazy(() => import("@/pages/SubscriptionFailure"));
const SubscriptionPending = lazy(() => import("@/pages/SubscriptionPending"));
const ReservationSuccess = lazy(() => import("@/pages/ReservationSuccess"));
const ReservationError = lazy(() => import("@/pages/ReservationError"));
const ReservationPending = lazy(() => import("@/pages/ReservationPending"));
const VisualScenariosDemo = lazy(() => import("@/pages/demo/VisualScenariosDemo"));
const TasacionLive = lazy(() => import("@/pages/TasacionLive"));
const SharedDesign = lazy(() => import("@/pages/SharedDesign"));
const AgencyShowcase = lazy(() => import("@/pages/AgencyShowcase"));
const TasacionValidator = lazy(() => import("@/pages/TasacionValidator"));
const CorredorasLanding = lazy(() => import("@/pages/marketing/CorredorasLanding"));
const InmobiliariasLanding = lazy(() => import("@/pages/marketing/InmobiliariasLanding"));
const BrokersLanding = lazy(() => import("@/pages/brokers/BrokersLanding"));
const BrokerSignup = lazy(() => import("@/pages/brokers/BrokerSignup"));
const BrokerRanking = lazy(() => import("@/pages/brokers/BrokerRanking"));
const BrokerShowcase = lazy(() => import("@/pages/brokers/BrokerShowcase"));

// Landings de proyecto (SEO vivo: URLs congeladas)
const ForestalLanding = lazy(() => import("@/pages/forestal/ForestalLanding"));
const InvestorsLogin = lazy(() => import("@/pages/forestal/InvestorsLogin"));
const HuellelhueLanding = lazy(() => import("@/pages/huellelhue/HuellelhueLanding"));
const PlayaAlvaroLanding = lazy(() => import("@/pages/playaAlvaro/PlayaAlvaroLanding"));
const ExploraParkLanding = lazy(() => import("@/pages/exploraPark/ExploraParkLanding"));
const ProjectLanding = lazy(() => import("@/pages/landing/ProjectLanding"));

// Comprador
const BuyerHome = lazy(() => import("@/pages/BuyerHome"));
const Favorites = lazy(() => import("@/components/Favorites"));
const MiTerreno = lazy(() => import("@/pages/MiTerreno"));
const Profile = lazy(() => import("@/pages/Profile"));
const Subscription = lazy(() => import("@/pages/Subscription"));

// Asesor / corredor
const AgentDashboard = lazy(() => import("./elements/AgentDashboard"));
const Publicar = lazy(() => import("@/pages/Publicar"));
const PublishProperty = lazy(() => import("@/components/PublishProperty"));
const PropertyInventory = lazy(() => import("@/components/PropertyInventory"));
const LeadManagement = lazy(() => import("@/components/LeadManagement"));
const ProjectsManagement = lazy(() => import("@/components/ProjectsManagement"));
const LotManagement = lazy(() => import("@/components/LotManagement"));
const CRMSystem = lazy(() => import("@/components/CRMSystem"));
const SalesManagement = lazy(() => import("@/components/SalesManagement"));
const BusinessIntelligence = lazy(() => import("@/components/BusinessIntelligence"));
const ReservationsManager = lazy(() => import("@/components/reservations/ReservationsManager"));
const CreditManager = lazy(() => import("@/components/credits/CreditManager"));
const ClosingManager = lazy(() => import("@/components/closing/ClosingManager"));
const EnterpriseSettings = lazy(() => import("@/components/enterprise/EnterpriseSettings"));
const ExecutiveDashboard = lazy(() => import("@/pages/dashboard/ExecutiveDashboard"));
const FinancialDashboard = lazy(() => import("@/pages/dashboard/FinancialDashboard"));
const AgentPerformance = lazy(() => import("@/pages/dashboard/AgentPerformance"));
const Messages = lazy(() => import("@/pages/dashboard/Messages"));
const NotificationTemplates = lazy(() => import("@/pages/dashboard/NotificationTemplates"));
const SalesPipeline = lazy(() => import("@/pages/dashboard/SalesPipeline"));
const MultiProjectDashboard = lazy(() => import("@/pages/dashboard/MultiProjectDashboard"));
const PaymentManagement = lazy(() => import("@/pages/dashboard/PaymentManagement"));
const Reports = lazy(() => import("@/pages/dashboard/Reports"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const DemandHeatmapDashboard = lazy(() => import("@/pages/dashboard/DemandHeatmapDashboard"));
const APIPortal = lazy(() => import("@/pages/dashboard/APIPortal"));
const LandOpportunities = lazy(() => import("@/pages/dashboard/LandOpportunities"));
const Contacts = lazy(() => import("@/pages/dashboard/Contacts"));
const OpportunityDetail = lazy(() => import("@/pages/dashboard/OpportunityDetail"));
const LoteoControlCenter = lazy(() => import("@/pages/dashboard/LoteoControlCenter"));
const SubdivisionStudio = lazy(() => import("@/pages/dashboard/SubdivisionStudio"));
const Commissions = lazy(() => import("@/pages/dashboard/Commissions"));
const TeamManagement = lazy(() => import("@/pages/dashboard/TeamManagement"));
const MyCaptaciones = lazy(() => import("@/pages/dashboard/MyCaptaciones"));

// Admin
const DashboardAdminPage = lazy(() => import("./elements/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AgentManagement = lazy(() => import("@/components/AgentManagement"));
const PropertyApprovalQueue = lazy(() => import("@/components/admin/PropertyApprovalQueue"));
const ProjectApprovalQueue = lazy(() => import("@/components/admin/ProjectApprovalQueue"));
const DocumentCenter = lazy(() => import("@/components/admin/DocumentCenter"));
const AuditLog = lazy(() => import("@/pages/dashboard/AuditLog"));
const VisualScenariosAdmin = lazy(() => import("@/pages/admin/VisualScenariosAdmin"));
const FeaturedManager = lazy(() => import("@/pages/admin/FeaturedManager"));
const CommercialLeadsAdmin = lazy(() => import("@/pages/admin/CommercialLeadsAdmin"));
const CaptacionesQueue = lazy(() => import("@/pages/admin/CaptacionesQueue"));

/* ------------------------------------------------------------------ */
/* Helpers de declaración                                              */
/* ------------------------------------------------------------------ */

const pub = (
  id: string,
  path: string,
  element: ReactNode,
  opts: { indexable?: boolean; nav?: NavMeta } = {},
): RouteEntry => ({
  id,
  path,
  area: "public",
  access: "public",
  // Las páginas públicas montan `PublicLayout` internamente cuando lo necesitan
  // (algunas landings son fullscreen sin header/footer).
  layout: "none",
  element,
  indexable: opts.indexable ?? true,
  nav: opts.nav,
});

const buyer = (id: string, path: string, element: ReactNode, nav?: NavMeta): RouteEntry => ({
  id,
  path,
  area: "buyer",
  access: "auth",
  layout: "buyer",
  element,
  nav,
});

const agent = (id: string, path: string, element: ReactNode, nav?: NavMeta): RouteEntry => ({
  id,
  path,
  area: "agent",
  access: "agent",
  layout: "dashboard",
  element,
  nav,
});

const admin = (id: string, path: string, element: ReactNode, nav?: NavMeta): RouteEntry => ({
  id,
  path,
  area: "admin",
  access: "admin",
  layout: "dashboard",
  element,
  nav,
});

/* ------------------------------------------------------------------ */
/* Rutas                                                               */
/* ------------------------------------------------------------------ */

export const publicRouteEntries: RouteEntry[] = [
  pub("home", "/", <Index />, { nav: { label: "Inicio", group: "principal" } }),
  pub("auth", "/auth", <Auth />, { indexable: false }),
  pub("explorar", "/explorar", <Explorar />, { nav: { label: "Explorar", group: "principal" } }),
  pub("propiedad", "/propiedad/:id", <PropertyDetail />),
  pub("proyecto", "/proyecto/:id", <ProjectDetail />),
  pub("proyecto-experiencia", "/proyecto/:id/experiencia", <ProjectExperience />),
  pub("pricing", "/pricing", <Pricing />, { nav: { label: "Planes", group: "principal" } }),
  pub("planes-loteos", "/planes-loteos", <PricingLoteos />),
  pub("contacto-loteos", "/contacto-loteos", <ContactLoteos />),
  pub("para-corredoras", "/para-corredoras", <CorredorasLanding />),
  pub("para-inmobiliarias", "/para-inmobiliarias", <InmobiliariasLanding />),
  pub("tools", "/tools", <Tools />, { nav: { label: "Herramientas", group: "principal" } }),
  pub("search", "/search", <IntelligentSearch />),
  pub("demo-visual-scenarios", "/demo/visual-scenarios", <VisualScenariosDemo />, { indexable: false }),
  pub("instalar", "/instalar", <Install />),
  pub("referidos", "/referidos", <Referrals />),
  pub("region", "/region/:slug", <RegionLanding />),
  pub("pais", "/pais/:code", <CountryLanding />),
  pub("ciudad", "/ciudad/:slug", <CityLanding />),
  pub("contacto", "/contacto", <Contact />, { nav: { label: "Contacto", group: "principal" } }),
  pub("comparar", "/comparar", <Comparar />),
  pub("alertas", "/alertas", <Alertas />),
  pub("blog", "/blog", <Blog />),
  pub("oportunidades", "/oportunidades", <Oportunidades />),
  pub("quiz", "/quiz", <BuyerQuiz />),
  pub("reset-password", "/reset-password", <ResetPassword />, { indexable: false }),
  pub("subscription-success", "/subscription/success", <SubscriptionSuccess />, { indexable: false }),
  pub("subscription-failure", "/subscription/failure", <SubscriptionFailure />, { indexable: false }),
  pub("subscription-pending", "/subscription/pending", <SubscriptionPending />, { indexable: false }),
  pub("reserva-exito", "/reserva/exito", <ReservationSuccess />, { indexable: false }),
  pub("reserva-error", "/reserva/error", <ReservationError />, { indexable: false }),
  pub("reserva-pendiente", "/reserva/pendiente", <ReservationPending />, { indexable: false }),
  pub("tasacion-live", "/tasacion/v/:id", <TasacionLive />),
  pub("tasacion-validar", "/tasacion/validar", <TasacionValidator />),
  pub("diseno-compartido", "/diseno/:token", <SharedDesign />, { indexable: false }),
  pub("inmobiliaria-showcase", "/inmobiliaria/:slug", <AgencyShowcase />),
];

/** Landings de proyecto: URLs congeladas por SEO, agrupadas para no ser casos sueltos. */
export const projectLandingEntries: RouteEntry[] = [
  pub("forestal-landing", "/forestal-valle-escondido", <ForestalLanding />),
  pub("forestal-investors", "/forestal-valle-escondido/investors", <InvestorsLogin />, { indexable: false }),
  pub("huellelhue", "/huellelhue", <HuellelhueLanding />),
  pub("playa-alvaro", "/playa-alvaro", <PlayaAlvaroLanding />),
  pub("explora-park", "/explora-park", <ExploraParkLanding />),
  pub("project-landing", "/p/:slug", <ProjectLanding />),
];

export const buyerRouteEntries: RouteEntry[] = [
  buyer("buyer-home", "/comprador/inicio", <BuyerHome />, { label: "Inicio", group: "comprador" }),
  buyer("favoritos", "/favoritos", <Favorites />, { label: "Favoritos", group: "comprador" }),
  buyer("mi-terreno", "/mi-terreno", <MiTerreno />, { label: "Mi Terreno", group: "comprador" }),
  buyer("perfil", "/perfil", <Profile />, { label: "Mi Perfil", group: "comprador" }),
  buyer("suscripcion", "/suscripcion", <Subscription />, { label: "Suscripción", group: "comprador" }),
];

export const agentRouteEntries: RouteEntry[] = [
  agent("asesor-dashboard", "/asesor/dashboard", <AgentDashboard />, { label: "Dashboard", group: "gestión" }),
  agent("asesor-opportunities", "/asesor/opportunities", <LandOpportunities />, { label: "Oportunidades", group: "captación" }),
  agent("asesor-opportunity", "/asesor/opportunity/:id", <OpportunityDetail />),
  agent("asesor-captaciones", "/asesor/captaciones", <MyCaptaciones />, { label: "Mis captaciones", group: "captación" }),
  agent("asesor-contacts", "/asesor/contacts", <Contacts />, { label: "Contactos", group: "crm" }),
  agent("asesor-listings", "/asesor/listings", <PropertyInventory />, { label: "Inventario", group: "gestión" }),
  agent("asesor-leads", "/asesor/leads", <LeadManagement />, { label: "Leads", group: "crm" }),
  agent("asesor-projects", "/asesor/projects", <ProjectsManagement />, { label: "Proyectos", group: "gestión" }),
  agent("asesor-lots", "/asesor/lots", <LotManagement />, { label: "Lotes", group: "gestión" }),
  agent("asesor-loteos", "/asesor/loteos", <LoteoControlCenter />, { label: "Loteos", group: "gestión" }),
  agent("asesor-subdivision", "/asesor/subdivision", <SubdivisionStudio />, { label: "Subdivisión", group: "gestión" }),
  agent("asesor-analytics", "/asesor/analytics", <BusinessIntelligence />, { label: "Analytics", group: "análisis" }),
  agent("asesor-crm", "/asesor/crm", <CRMSystem />, { label: "CRM", group: "crm" }),
  agent("asesor-sales", "/asesor/sales", <SalesManagement />, { label: "Ventas", group: "ventas" }),
  agent("asesor-reservations", "/asesor/reservations", <ReservationsManager />, { label: "Reservas", group: "ventas" }),
  agent("asesor-credits", "/asesor/credits", <CreditManager />, { label: "Créditos", group: "ventas" }),
  agent("asesor-closing", "/asesor/closing", <ClosingManager />, { label: "Cierre", group: "ventas" }),
  agent("asesor-messages", "/asesor/messages", <Messages />, { label: "Mensajes", group: "crm" }),
  agent("asesor-notificaciones", "/asesor/notificaciones", <NotificationTemplates />, { label: "Notificaciones", group: "crm" }),
  agent("asesor-enterprise", "/asesor/enterprise", <EnterpriseSettings />, { label: "Empresa", group: "cuenta", plans: ["inmobiliaria", "grupo", "enterprise"] }),
  agent("asesor-executive", "/asesor/executive", <ExecutiveDashboard />, { label: "Ejecutivo", group: "análisis", plans: ["inmobiliaria", "grupo", "enterprise"] }),
  agent("asesor-financial", "/asesor/financial", <FinancialDashboard />, { label: "Financiero", group: "análisis" }),
  agent("asesor-performance", "/asesor/performance", <AgentPerformance />, { label: "Performance", group: "análisis" }),
  agent("asesor-comisiones", "/asesor/comisiones", <Commissions />, { label: "Comisiones", group: "ventas" }),
  agent("asesor-team", "/asesor/team", <TeamManagement />, { label: "Equipo", group: "cuenta", plans: ["inmobiliaria", "grupo", "enterprise"] }),
  agent("asesor-pipeline", "/asesor/pipeline", <SalesPipeline />, { label: "Pipeline", group: "ventas" }),
  agent("asesor-multi-project", "/asesor/multi-project", <MultiProjectDashboard />, { label: "Multi proyecto", group: "análisis" }),
  agent("asesor-payments", "/asesor/payments", <PaymentManagement />, { label: "Pagos", group: "ventas" }),
  agent("asesor-reports", "/asesor/reports", <Reports />, { label: "Reportes", group: "análisis" }),
  agent("asesor-notifications", "/asesor/notifications", <NotificationCenter />, { label: "Notificaciones", group: "cuenta" }),
  agent("asesor-demand", "/asesor/demand", <DemandHeatmapDashboard />, { label: "Demanda", group: "análisis" }),
  agent("asesor-api", "/asesor/api", <APIPortal />, { label: "API", group: "cuenta", plans: ["enterprise"] }),
  agent("asesor-tools", "/asesor/tools", <Tools />, { label: "Herramientas", group: "cuenta" }),
  agent("asesor-profile", "/asesor/profile", <Profile />, { label: "Mi perfil", group: "cuenta" }),
  // Publicación: hub y formulario. Sin sidebar de dashboard (flujo enfocado).
  {
    id: "publicar",
    path: "/publicar",
    area: "agent",
    access: "agent",
    layout: "none",
    element: <Publicar />,
    nav: { label: "Publicar", group: "gestión" },
  },
  {
    id: "publish",
    path: "/publish",
    area: "agent",
    access: "agent",
    layout: "none",
    element: <PublishProperty />,
  },
];

export const adminRouteEntries: RouteEntry[] = [
  admin("admin-dashboard", "/admin/dashboard", <DashboardAdminPage />, { label: "Dashboard", group: "admin" }),
  admin("admin-users", "/admin/users", <AdminUsers />, { label: "Usuarios", group: "admin" }),
  admin("admin-agents", "/admin/agents", <AgentManagement />, { label: "Agentes", group: "admin" }),
  admin("admin-reservations", "/admin/reservations", <ReservationsManager />, { label: "Reservas", group: "admin" }),
  admin("admin-approvals", "/admin/approvals", <PropertyApprovalQueue />, { label: "Aprobaciones", group: "admin" }),
  admin("admin-project-approvals", "/admin/project-approvals", <ProjectApprovalQueue />, { label: "Aprobación proyectos", group: "admin" }),
  admin("admin-credits", "/admin/credits", <CreditManager />, { label: "Créditos", group: "admin" }),
  admin("admin-analytics", "/admin/analytics", <BusinessIntelligence />, { label: "Analytics", group: "admin" }),
  admin("admin-financial", "/admin/financial", <FinancialDashboard />, { label: "Financiero", group: "admin" }),
  admin("admin-documents", "/admin/documents", <DocumentCenter />, { label: "Documentos", group: "admin" }),
  admin("admin-projects", "/admin/projects", <ProjectsManagement />, { label: "Proyectos", group: "admin" }),
  admin("admin-visual-scenarios", "/admin/visual-scenarios", <VisualScenariosAdmin />, { label: "Escenarios visuales", group: "admin" }),
  admin("admin-commercial-leads", "/admin/commercial-leads", <CommercialLeadsAdmin />, { label: "Leads comerciales", group: "admin" }),
  admin("admin-captaciones", "/admin/captaciones", <CaptacionesQueue />, { label: "Captaciones", group: "admin" }),
  admin("admin-featured", "/admin/featured", <FeaturedManager />, { label: "Destacados", group: "admin" }),
  admin("admin-audit", "/admin/audit", <AuditLog />, { label: "Auditoría", group: "admin" }),
];

export const routeManifest: RouteEntry[] = [
  ...publicRouteEntries,
  ...projectLandingEntries,
  ...buyerRouteEntries,
  ...agentRouteEntries,
  ...adminRouteEntries,
];

/**
 * Alias → canónico. Incluye los redirects legacy históricos y la
 * normalización de nombres al español.
 */
export const routeAliases: RouteAlias[] = [
  // Normalización de idioma
  { from: "/profile", to: "/perfil" },
  { from: "/subscription", to: "/suscripcion" },
  { from: "/buyer/home", to: "/comprador/inicio" },
  { from: "/favorites", to: "/favoritos" },
  { from: "/compare", to: "/comparar" },
  { from: "/pricing-loteos", to: "/planes-loteos" },
  { from: "/precios-loteos", to: "/planes-loteos" },

  // Legacy del dashboard plano
  { from: "/dashboard", to: "/asesor/dashboard" },
  { from: "/inventory", to: "/asesor/listings" },
  { from: "/leads", to: "/asesor/leads" },
  { from: "/projects", to: "/asesor/projects" },
  { from: "/lots", to: "/asesor/lots" },
  { from: "/analytics", to: "/asesor/analytics" },
  { from: "/crm", to: "/asesor/crm" },
  { from: "/sales", to: "/asesor/sales" },
  { from: "/urbanization", to: "/asesor/projects" },
  { from: "/agents", to: "/admin/agents" },
  // Herramientas unificadas
  { from: "/calculators", to: "/tools" },
  { from: "/price-predictor", to: "/tools" },
  { from: "/risk-analysis", to: "/tools" },
  { from: "/ai-recommendations", to: "/tools" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Todos los paths navegables (rutas + alias). */
export const allRoutePaths = (): string[] => [
  ...routeManifest.map((r) => r.path),
  ...routeAliases.map((a) => a.from),
];

/** ¿Existe esta URL en la plataforma? Soporta segmentos dinámicos. */
export const routeExists = (path: string): boolean => {
  const clean = path.split(/[?#]/)[0];
  return allRoutePaths().some((p) =>
    p.includes(":")
      ? new RegExp("^" + p.replace(/:[^/]+/g, "[^/]+") + "$").test(clean)
      : p === clean,
  );
};

/** Links de navegación de un área, filtrados por plan cuando aplica. */
export const navFor = (area: RouteArea, plan?: string) =>
  routeManifest
    .filter((r) => r.area === area && r.nav)
    .filter((r) => !r.nav!.plans || (plan ? r.nav!.plans.includes(plan) : false))
    .map((r) => ({ path: r.path, ...r.nav! }));

/** Rutas públicas indexables, base para el sitemap. */
export const indexableRoutes = () =>
  routeManifest.filter((r) => r.area === "public" && r.indexable !== false);
