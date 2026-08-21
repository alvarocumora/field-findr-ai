import { DashboardAdmin } from "@/pages/dashboard";
import ModulesHub from "@/components/dashboard/ModulesHub";

/** Panel admin + índice de módulos derivado del manifiesto de rutas. */
const AdminDashboard = () => (
  <>
    <DashboardAdmin />
    <div className="container pb-10">
      <ModulesHub area="admin" title="Todos los módulos de administración" />
    </div>
  </>
);

export default AdminDashboard;
