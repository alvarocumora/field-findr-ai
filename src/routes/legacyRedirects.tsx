import { Navigate, Route } from "react-router-dom";

export const legacyRedirects = [
  <Route key="favorites-redirect" path="/favorites" element={<Navigate to="/favoritos" replace />} />,
  <Route key="dashboard-redirect" path="/dashboard" element={<Navigate to="/asesor/dashboard" replace />} />,
  <Route key="inventory-redirect" path="/inventory" element={<Navigate to="/asesor/listings" replace />} />,
  <Route key="leads-redirect" path="/leads" element={<Navigate to="/asesor/leads" replace />} />,
  <Route key="projects-redirect" path="/projects" element={<Navigate to="/asesor/projects" replace />} />,
  <Route key="lots-redirect" path="/lots" element={<Navigate to="/asesor/lots" replace />} />,
  <Route key="analytics-redirect" path="/analytics" element={<Navigate to="/asesor/analytics" replace />} />,
  <Route key="crm-redirect" path="/crm" element={<Navigate to="/asesor/crm" replace />} />,
  <Route key="sales-redirect" path="/sales" element={<Navigate to="/asesor/sales" replace />} />,
  <Route key="agents-redirect" path="/agents" element={<Navigate to="/admin/agents" replace />} />,
  <Route key="compare-redirect" path="/compare" element={<Navigate to="/comparar" replace />} />,
  <Route key="calculators-redirect" path="/calculators" element={<Navigate to="/tools" replace />} />,
  <Route key="price-predictor-redirect" path="/price-predictor" element={<Navigate to="/tools" replace />} />,
  <Route key="risk-analysis-redirect" path="/risk-analysis" element={<Navigate to="/tools" replace />} />,
  <Route key="ai-recommendations-redirect" path="/ai-recommendations" element={<Navigate to="/tools" replace />} />,
  <Route key="urbanization-redirect" path="/urbanization" element={<Navigate to="/asesor/projects" replace />} />,
];
