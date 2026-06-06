import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastViewport } from "./components/ui/ToastViewport";

const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const VendorsPage = lazy(() => import("./pages/vendors/VendorsPage").then((module) => ({ default: module.VendorsPage })));
const CreateRFQPage = lazy(() => import("./pages/rfqs/CreateRFQPage").then((module) => ({ default: module.CreateRFQPage })));
const SubmitQuotationPage = lazy(() => import("./pages/quotations/SubmitQuotationPage").then((module) => ({ default: module.SubmitQuotationPage })));
const QuotationComparisonPage = lazy(() => import("./pages/quotations/QuotationComparisonPage").then((module) => ({ default: module.QuotationComparisonPage })));
const ApprovalsPage = lazy(() => import("./pages/approvals/ApprovalsPage").then((module) => ({ default: module.ApprovalsPage })));
const InvoicePage = lazy(() => import("./pages/invoices/InvoicePage").then((module) => ({ default: module.InvoicePage })));
const ActivityPage = lazy(() => import("./pages/activity/ActivityPage").then((module) => ({ default: module.ActivityPage })));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage").then((module) => ({ default: module.ReportsPage })));

function MissingPage() {
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <>
      <Suspense fallback={<div className="app-loader">Loading workspace...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/rfqs/create" element={<CreateRFQPage />} />
              <Route path="/quotations/submit" element={<SubmitQuotationPage />} />
              <Route path="/quotations/compare" element={<QuotationComparisonPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/invoices" element={<InvoicePage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<MissingPage />} />
        </Routes>
      </Suspense>
      <ToastViewport />
    </>
  );
}
