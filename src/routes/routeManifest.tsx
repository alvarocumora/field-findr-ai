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
  /** Nombre del icono (ver `src/routes/navIcons.ts`). */
  icon?: string;
  /** Link primario del área: se muestra siempre, fuera de los grupos. */
  primary?: boolean;
}

/** Metadatos SEO por defecto de una ruta (la página puede sobrescribirlos). */
export interface RouteSeo {
  title: string;
  description: string;
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
  /** Título/descripción por defecto para páginas sin SEO propio. */
  seo?: RouteSeo;
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
const Comunidad = lazy(() => import("@/pages/Comunidad"));
const Comenzar = lazy(() => import("@/pages/Comenzar"));
const Panel = lazy(() => import("@/pages/Panel"));
const Agendar = lazy(() => import("@/pages/Agendar"));

// Landings de proyecto (SEO vivo: URLs congeladas)
const InvestorsLogin = lazy(() => import("@/pages/forestal/InvestorsLogin"));
const IslaDeMaipoDossier = lazy(() => import("@/pages/dossier/IslaDeMaipoDossier"));
const ProjectLanding = lazy(() => import("@/pages/landing/ProjectLanding"));

// Comprador
const BuyerHome = lazy(() => import("@/pages/BuyerHome"));
const BuyerProgress = lazy(() => import("@/pages/BuyerProgress"));
const InventoryMap = lazy(() => import("@/pages/dashboard/InventoryMap"));
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
const VisitsManager = lazy(() => import("@/pages/dashboard/VisitsManager"));
const ClosingsManager = lazy(() => import("@/pages/dashboard/ClosingsManager"));
const ClientsBook = lazy(() => import("@/pages/dashboard/ClientsBook"));
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
const BrokerMarketplace = lazy(() => import("@/pages/dashboard/BrokerMarketplace"));
const MyBrokerBusiness = lazy(() => import("@/pages/dashboard/MyBrokerBusiness"));
const BrokerNetwork = lazy(() => import("@/pages/dashboard/BrokerNetwork"));
const SupportTickets = lazy(() => import("@/pages/dashboard/SupportTickets"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const MeetingsManager = lazy(() => import("@/pages/dashboard/MeetingsManager"));

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
const FichaBranding = lazy(() => import("@/pages/admin/FichaBranding"));
const CommercialLeadsAdmin = lazy(() => import("@/pages/admin/CommercialLeadsAdmin"));
const CaptacionesQueue = lazy(() => import("@/pages/admin/CaptacionesQueue"));
const BrokersAdmin = lazy(() => import("@/pages/admin/BrokersAdmin"));
const CommissionsAdmin = lazy(() => import("@/pages/admin/CommissionsAdmin"));
const SalesAdmin = lazy(() => import("@/pages/admin/SalesAdmin"));
const SupportAdmin = lazy(() => import("@/pages/admin/SupportAdmin"));

/* ------------------------------------------------------------------ */
/* Helpers de declaración                                              */
/* ------------------------------------------------------------------ */

const pub = (
  id: string,
  path: string,
  element: ReactNode,
  opts: { indexable?: boolean; nav?: NavMeta; seo?: RouteSeo } = {},
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
  seo: opts.seo,
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
  pub("explorar", "/explorar", <Explorar />, {
    nav: { label: "Explorar", group: "principal" },
    seo: {
      title: "Explorar terrenos y parcelas en venta | Oferta Terrenos",
      description:
        "Busca terrenos, parcelas y loteos en venta con mapa, filtros por superficie, precio y servicios. Fichas verificadas en Chile y LATAM.",
    },
  }),
  pub("propiedad", "/propiedad/:id", <PropertyDetail />),
  pub("proyecto", "/proyecto/:id", <ProjectDetail />),
  pub("proyecto-experiencia", "/proyecto/:id/experiencia", <ProjectExperience />),
  pub("pricing", "/pricing", <Pricing />, {
    nav: { label: "Planes", group: "principal" },
    seo: {
      title: "Planes y precios para publicar terrenos | Oferta Terrenos",
      description:
        "Compara los planes de Oferta Terrenos: publicaciones, herramientas de gestión de loteos, CRM y comisiones para corredores e inmobiliarias.",
    },
  }),
  pub("planes-loteos", "/planes-loteos", <PricingLoteos />, {
    seo: {
      title: "Planes para loteos y parcelaciones | Oferta Terrenos",
      description:
        "Software y vitrina para vender loteos: gestión de parcelas, reservas, contratos y comisiones. Precios por tamaño de proyecto.",
    },
  }),
  pub("contacto-loteos", "/contacto-loteos", <ContactLoteos />, {
    seo: {
      title: "Contacto para proyectos de loteo | Oferta Terrenos",
      description:
        "Cuéntanos de tu loteo o parcelación y te mostramos cómo publicarlo, gestionarlo y venderlo con Oferta Terrenos.",
    },
  }),
  pub("para-corredoras", "/para-corredoras", <CorredorasLanding />, {
    seo: {
      title: "Oferta Terrenos para corredoras de propiedades",
      description:
        "Publica tu cartera de terrenos, capta leads calificados y gestiona comisiones y referidos desde un solo panel.",
    },
  }),
  pub("para-inmobiliarias", "/para-inmobiliarias", <InmobiliariasLanding />, {
    seo: {
      title: "Oferta Terrenos para inmobiliarias y loteadoras",
      description:
        "Gestiona proyectos, inventario de parcelas, reservas y equipo de ventas con landings propias y reportes en tiempo real.",
    },
  }),
  pub("tools", "/tools", <Tools />, {
    nav: { label: "Herramientas", group: "principal" },
    seo: {
      title: "Calculadoras y herramientas de terrenos | Oferta Terrenos",
      description:
        "Calculadora de ROI, simulador de crédito, estimador de subdivisión y análisis de riesgo para invertir en terrenos.",
    },
  }),
  pub("search", "/search", <IntelligentSearch />, {
    seo: {
      title: "Búsqueda inteligente de terrenos | Oferta Terrenos",
      description:
        "Describe el terreno que buscas en lenguaje natural y la búsqueda inteligente filtra por zona, superficie, precio y uso.",
    },
  }),
  pub("demo-visual-scenarios", "/demo/visual-scenarios", <VisualScenariosDemo />, { indexable: false }),
  pub("instalar", "/instalar", <Install />, {
    seo: {
      title: "Instalar la app de Oferta Terrenos",
      description:
        "Instala Oferta Terrenos en tu teléfono para explorar terrenos con mapas offline, alertas y acceso rápido a tu panel.",
    },
  }),
  pub("referidos", "/referidos", <Referrals />, {
    seo: {
      title: "Programa de referidos | Oferta Terrenos",
      description:
        "Invita brokers y compradores con tu código y gana recompensas y comisiones de override por cada venta atribuida.",
    },
  }),
  pub("region", "/region/:slug", <RegionLanding />),
  pub("pais", "/pais/:code", <CountryLanding />),
  pub("ciudad", "/ciudad/:slug", <CityLanding />),
  pub("contacto", "/contacto", <Contact />, { nav: { label: "Contacto", group: "principal" } }),
  pub("comparar", "/comparar", <Comparar />, {
    seo: {
      title: "Comparar terrenos lado a lado | Oferta Terrenos",
      description:
        "Compara precio, superficie, valor por m², servicios y ubicación de varios terrenos antes de decidir tu compra.",
    },
  }),
  pub("alertas", "/alertas", <Alertas />, {
    seo: {
      title: "Alertas de terrenos y bajadas de precio | Oferta Terrenos",
      description:
        "Guarda tus búsquedas y recibe avisos cuando aparezca un terreno que calce contigo o baje de precio.",
    },
  }),
  pub("blog", "/blog", <Blog />),
  pub("oportunidades", "/oportunidades", <Oportunidades />),
  pub("quiz", "/quiz", <BuyerQuiz />, {
    seo: {
      title: "Test: encuentra tu terreno ideal | Oferta Terrenos",
      description:
        "Responde unas preguntas sobre uso, presupuesto y zona y te mostramos los terrenos con mayor porcentaje de match.",
    },
  }),
  pub("agendar", "/agendar", <Agendar />, {
    seo: {
      title: "Agendar reunión | Oferta Terrenos",
      description: "Solicita una reunión comercial, visita a terreno o conversación sobre tu campo con Oferta Terrenos.",
    },
  }),
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
  pub("brokers", "/brokers", <BrokersLanding />, { nav: { label: "Brokers", group: "principal" } }),
  pub("brokers-inscripcion", "/brokers/inscripcion", <BrokerSignup />),
  pub("brokers-ranking", "/brokers/ranking", <BrokerRanking />),
  pub("broker-showcase", "/b/:slug", <BrokerShowcase />),
  pub("comunidad", "/comunidad", <Comunidad />, { nav: { label: "Comunidad", group: "principal" } }),
  pub("comenzar", "/comenzar", <Comenzar />, { nav: { label: "Comenzar", group: "principal" } }),
  pub("ayuda", "/ayuda", <HelpCenter />, { nav: { label: "Ayuda", group: "soporte" } }),
];

/** Landings de proyecto: URLs congeladas por SEO, agrupadas para no ser casos sueltos. */
export const projectLandingEntries: RouteEntry[] = [
  // Todas pasan por el motor único (`ProjectLanding`); el slug decide si se
  // renderiza la experiencia a medida o la landing por configuración.
  pub("forestal-landing", "/forestal-valle-escondido", <ProjectLanding slug="forestal-valle-escondido" />),
  pub("forestal-investors", "/forestal-valle-escondido/investors", <InvestorsLogin />, { indexable: false }),
  pub("huellelhue", "/huellelhue", <ProjectLanding slug="huellelhue" />),
  pub("playa-alvaro", "/playa-alvaro", <ProjectLanding slug="playa-alvaro" />),
  pub("explora-park", "/explora-park", <ProjectLanding slug="explora-park" />),
  pub("dossier-isla-maipo", "/ficha/isla-de-maipo-galvez-1458", <IslaDeMaipoDossier />, {
    indexable: false,
  }),
  pub("project-landing", "/p/:slug", <ProjectLanding />),
];

export const buyerRouteEntries: RouteEntry[] = [
  // Puerta única del área privada: resuelve el panel según el rol.
  {
    id: "panel",
    path: "/panel",
    area: "buyer",
    access: "auth",
    layout: "none",
    element: <Panel />,
  },
  buyer("buyer-home", "/comprador/inicio", <BuyerHome />, { label: "Inicio", group: "comprador", icon: "home", primary: true }),
  buyer("comprador-progreso", "/comprador", <BuyerProgress />, { label: "Mi Progreso", group: "comprador", icon: "trending-up" }),
  buyer("favoritos", "/favoritos", <Favorites />, { label: "Favoritos", group: "comprador", icon: "heart" }),
  buyer("mi-terreno", "/mi-terreno", <MiTerreno />, { label: "Mi Terreno", group: "comprador", icon: "map-pin" }),
  buyer("perfil", "/perfil", <Profile />, { label: "Mi Perfil", group: "comprador", icon: "user" }),
  buyer("suscripcion", "/suscripcion", <Subscription />, { label: "Suscripción", group: "comprador", icon: "credit-card" }),
];

export const agentRouteEntries: RouteEntry[] = [
  agent("asesor-dashboard", "/asesor/dashboard", <AgentDashboard />, { label: "Dashboard", group: "principal", icon: "dashboard", primary: true }),

  // Captación
  agent("asesor-opportunities", "/asesor/opportunities", <LandOpportunities />, { label: "Oportunidades", group: "proyectos", icon: "target" }),
  agent("asesor-opportunity", "/asesor/opportunity/:id", <OpportunityDetail />),
  agent("asesor-captaciones", "/asesor/captaciones", <MyCaptaciones />, { label: "Mis captaciones", group: "proyectos", icon: "handshake" }),
  agent("asesor-broker-marketplace", "/asesor/proyectos-en-venta", <BrokerMarketplace />, { label: "Proyectos en venta", group: "red comercial", icon: "store" }),

  // Inventario
  agent("panel-inventario", "/panel/inventario", <InventoryMap />, { label: "Mapa de inventario", group: "proyectos", icon: "map" }),
  agent("asesor-listings", "/asesor/listings", <PropertyInventory />, { label: "Inventario", group: "proyectos", icon: "building" }),
  agent("asesor-projects", "/asesor/projects", <ProjectsManagement />, { label: "Proyectos", group: "proyectos", icon: "folder" }),
  agent("asesor-lots", "/asesor/lots", <LotManagement />, { label: "Lotes", group: "proyectos", icon: "grid" }),
  agent("asesor-loteos", "/asesor/loteos", <LoteoControlCenter />, { label: "Control de loteo", group: "proyectos", icon: "gauge" }),
  agent("asesor-subdivision", "/asesor/subdivision", <SubdivisionStudio />, { label: "Estudio de subdivisión", group: "proyectos", icon: "grid" }),

  // CRM
  agent("clientes", "/clientes", <ClientsBook />, { label: "Clientes", group: "ventas", icon: "users" }),
  agent("asesor-leads", "/asesor/leads", <LeadManagement />, { label: "Leads", group: "ventas", icon: "users" }),
  agent("asesor-contacts", "/asesor/contacts", <Contacts />, { label: "Contactos", group: "ventas", icon: "users" }),
  agent("asesor-crm", "/asesor/crm", <CRMSystem />, { label: "CRM", group: "ventas", icon: "workflow" }),
  agent("asesor-messages", "/asesor/messages", <Messages />, { label: "Mensajes", group: "ventas", icon: "message" }),
  agent("asesor-notificaciones", "/asesor/notificaciones/plantillas", <NotificationTemplates />, { label: "Plantillas de aviso", group: "ventas", icon: "bell" }),

  // Ventas
  agent("asesor-pipeline", "/asesor/pipeline", <SalesPipeline />, { label: "Pipeline", group: "ventas", icon: "workflow" }),
  agent("asesor-reservations", "/asesor/reservations", <ReservationsManager />, { label: "Reservas", group: "ventas", icon: "calendar" }),
  agent("asesor-visitas", "/asesor/visitas", <VisitsManager />, { label: "Visitas", group: "ventas", icon: "calendar" }),
  agent("asesor-reuniones", "/asesor/reuniones", <MeetingsManager />, { label: "Reuniones", group: "ventas", icon: "calendar" }),
  agent("asesor-cierres", "/asesor/cierres", <ClosingsManager />, { label: "Cierres de venta", group: "ventas", icon: "handshake" }),
  agent("asesor-sales", "/asesor/sales", <SalesManagement />, { label: "Ventas", group: "ventas", icon: "handshake" }),
  agent("asesor-closing", "/asesor/closing", <ClosingManager />, { label: "Cierre", group: "ventas", icon: "scale" }),
  agent("asesor-credits", "/asesor/credits", <CreditManager />, { label: "Créditos", group: "ventas", icon: "credit-card" }),
  agent("asesor-payments", "/asesor/payments", <PaymentManagement />, { label: "Pagos", group: "ventas", icon: "dollar" }),
  agent("asesor-comisiones", "/asesor/comisiones", <Commissions />, { label: "Comisiones", group: "ventas", icon: "dollar" }),

  // Análisis
  agent("asesor-mi-negocio", "/asesor/mi-negocio", <MyBrokerBusiness />, { label: "Mi negocio", group: "red comercial", icon: "trending" }),
  agent("asesor-red", "/asesor/red", <BrokerNetwork />, { label: "Red y atribución", group: "red comercial", icon: "share" }),
  agent("asesor-analytics", "/asesor/analytics", <BusinessIntelligence />, { label: "Analytics", group: "administración", icon: "chart" }),
  agent("asesor-financial", "/asesor/financial", <FinancialDashboard />, { label: "Financiero", group: "administración", icon: "trending" }),
  agent("asesor-performance", "/asesor/performance", <AgentPerformance />, { label: "Performance", group: "administración", icon: "gauge" }),
  agent("asesor-demand", "/asesor/demand", <DemandHeatmapDashboard />, { label: "Demanda", group: "administración", icon: "flame" }),
  agent("asesor-reports", "/asesor/reports", <Reports />, { label: "Reportes", group: "administración", icon: "report" }),
  agent("asesor-executive", "/asesor/executive", <ExecutiveDashboard />, { label: "Ejecutivo", group: "administración", icon: "pie", plans: ["inmobiliaria", "grupo", "enterprise"] }),
  agent("asesor-multi-project", "/asesor/multi-project", <MultiProjectDashboard />, { label: "Multi proyecto", group: "administración", icon: "chart", plans: ["inmobiliaria", "grupo", "enterprise"] }),

  // Cuenta
  agent("asesor-team", "/asesor/team", <TeamManagement />, { label: "Equipo", group: "administración", icon: "users", plans: ["inmobiliaria", "grupo", "enterprise"] }),
  agent("asesor-enterprise", "/asesor/enterprise", <EnterpriseSettings />, { label: "Empresa", group: "administración", icon: "building", plans: ["inmobiliaria", "grupo", "enterprise"] }),
  agent("asesor-api", "/asesor/api", <APIPortal />, { label: "API", group: "configuración", icon: "code", plans: ["enterprise"] }),
  agent("asesor-notifications", "/asesor/notifications", <NotificationCenter />, { label: "Notificaciones", group: "configuración", icon: "bell" }),
  agent("asesor-tools", "/asesor/tools", <Tools />, { label: "Herramientas", group: "configuración", icon: "sparkles" }),
  agent("asesor-soporte", "/asesor/soporte", <SupportTickets />, { label: "Soporte", group: "configuración", icon: "lifebuoy" }),
  agent("asesor-profile", "/asesor/profile", <Profile />, { label: "Mi perfil", group: "configuración", icon: "user" }),

  // Publicación: hub y formulario. Sin sidebar de dashboard (flujo enfocado).
  {
    id: "publicar",
    path: "/publicar",
    area: "agent",
    access: "agent",
    layout: "none",
    element: <Publicar />,
    nav: { label: "Publicar", group: "principal", icon: "plus", primary: true },
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
  admin("admin-dashboard", "/admin/dashboard", <DashboardAdminPage />, { label: "Panel admin", group: "principal", icon: "dashboard", primary: true }),

  // Gestión
  admin("admin-users", "/admin/users", <AdminUsers />, { label: "Usuarios", group: "gestión", icon: "users" }),
  admin("admin-agents", "/admin/agents", <AgentManagement />, { label: "Agentes", group: "gestión", icon: "shield" }),
  admin("admin-brokers", "/admin/brokers", <BrokersAdmin />, { label: "Brokers", group: "gestión", icon: "handshake" }),
  admin("admin-projects", "/admin/projects", <ProjectsManagement />, { label: "Proyectos", group: "gestión", icon: "folder" }),
  admin("admin-featured", "/admin/featured", <FeaturedManager />, { label: "Destacados", group: "gestión", icon: "sparkles" }),
  admin("admin-reservations", "/admin/reservations", <ReservationsManager />, { label: "Reservas", group: "gestión", icon: "calendar" }),
  admin("admin-documents", "/admin/documents", <DocumentCenter />, { label: "Documentos", group: "gestión", icon: "clipboard" }),

  // Aprobaciones
  admin("admin-approvals", "/admin/approvals", <PropertyApprovalQueue />, { label: "Propiedades", group: "aprobaciones", icon: "clipboard" }),
  admin("admin-project-approvals", "/admin/project-approvals", <ProjectApprovalQueue />, { label: "Loteos", group: "aprobaciones", icon: "clipboard" }),
  admin("admin-captaciones", "/admin/captaciones", <CaptacionesQueue />, { label: "Captaciones", group: "aprobaciones", icon: "map-pin" }),
  admin("admin-commercial-leads", "/admin/commercial-leads", <CommercialLeadsAdmin />, { label: "Leads comerciales", group: "aprobaciones", icon: "handshake" }),

  // Finanzas
  admin("admin-comisiones", "/admin/comisiones", <CommissionsAdmin />, { label: "Comisiones", group: "finanzas", icon: "dollar" }),
  admin("admin-ventas", "/admin/ventas", <SalesAdmin />, { label: "Ventas", group: "finanzas", icon: "handshake" }),
  admin("admin-credits", "/admin/credits", <CreditManager />, { label: "Créditos", group: "finanzas", icon: "credit-card" }),
  admin("admin-financial", "/admin/financial", <FinancialDashboard />, { label: "Financiero", group: "finanzas", icon: "trending" }),
  admin("admin-analytics", "/admin/analytics", <BusinessIntelligence />, { label: "Analytics", group: "finanzas", icon: "chart" }),

  // Sistema
  admin("admin-visual-scenarios", "/admin/visual-scenarios", <VisualScenariosAdmin />, { label: "Escenarios visuales", group: "sistema", icon: "sparkles" }),
  admin("admin-branding-fichas", "/admin/branding-fichas", <FichaBranding />, { label: "Branding fichas", group: "sistema", icon: "palette" }),
  admin("admin-soporte", "/admin/soporte", <SupportAdmin />, { label: "Soporte", group: "sistema", icon: "lifebuoy" }),
  admin("admin-audit", "/admin/audit", <AuditLog />, { label: "Auditoría", group: "sistema", icon: "shield" }),
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
  { from: "/help", to: "/ayuda" },
  { from: "/soporte", to: "/ayuda" },
  // Herramientas unificadas
  { from: "/calculators", to: "/tools" },
  { from: "/roi-calculator", to: "/tools" },
  { from: "/price-predictor", to: "/tools" },
  { from: "/risk-analysis", to: "/tools" },
  { from: "/ai-recommendations", to: "/tools" },

  // Consolidación de paneles (Fase 1: un dashboard por rol)
  { from: "/inmobiliaria/dashboard", to: "/asesor/dashboard" },
  { from: "/asesor", to: "/asesor/dashboard" },
  { from: "/admin", to: "/admin/dashboard" },
  { from: "/asesor/notificaciones", to: "/asesor/notificaciones/plantillas" },
  { from: "/asesor/mercado", to: "/asesor/proyectos-en-venta" },
  { from: "/asesor/executive-dashboard", to: "/asesor/executive" },

  // Entrada unificada: /panel/* como atajo estable a las secciones del panel
  { from: "/panel/inicio", to: "/panel" },
  { from: "/panel/loteos", to: "/asesor/loteos" },
  { from: "/panel/leads", to: "/asesor/leads" },
  { from: "/panel/ventas", to: "/asesor/sales" },
  { from: "/panel/comisiones", to: "/asesor/comisiones" },
  { from: "/panel/publicar", to: "/publicar" },
  { from: "/panel/perfil", to: "/perfil" },

  // Comunidad
  { from: "/community", to: "/comunidad" },
  { from: "/brokers/comunidad", to: "/comunidad" },
];

/** Orden canónico de los grupos de navegación por área. */
export const navGroupOrder: Record<RouteArea, string[]> = {
  public: ["principal", "soporte"],
  buyer: ["comprador"],
  agent: ["principal", "proyectos", "ventas", "red comercial", "administración", "configuración"],
  admin: ["principal", "gestión", "aprobaciones", "finanzas", "sistema"],
};

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

export interface NavLink extends NavMeta {
  path: string;
}

/** Links de navegación de un área, filtrados por plan cuando aplica. */
export const navFor = (area: RouteArea, plan?: string): NavLink[] =>
  routeManifest
    .filter((r) => r.area === area && r.nav)
    .filter((r) => !r.nav!.plans || (plan ? r.nav!.plans.includes(plan) : false))
    .map((r) => ({ path: r.path, ...r.nav! }));

/** Links de un área agrupados y ordenados según `navGroupOrder`. */
export const navGroupsFor = (
  area: RouteArea,
  plan?: string,
): { group: string; items: NavLink[] }[] => {
  const links = navFor(area, plan);
  const order = navGroupOrder[area] ?? [];
  const groups = Array.from(new Set(links.map((l) => l.group))).sort(
    (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
  );
  return groups.map((group) => ({
    group,
    items: links.filter((l) => l.group === group),
  }));
};

/** Rutas públicas indexables, base para el sitemap. */
export const indexableRoutes = () =>
  routeManifest.filter((r) => r.area === "public" && r.indexable !== false);
