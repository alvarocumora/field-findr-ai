import { lazy } from 'react';

// Lazy load dashboard pages for better performance
export const DashboardAdmin = lazy(() => import('./DashboardAdmin'));
export const DashboardAsesor = lazy(() => import('./DashboardAsesor'));
export const DashboardInmobiliaria = lazy(() => import('./DashboardInmobiliaria'));
