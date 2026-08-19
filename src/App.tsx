import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute, ProtectedRoute } from "@/components/layout/route-guards";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const StudentsPage = lazy(() =>
  import("@/pages/StudentsPage").then((m) => ({ default: m.StudentsPage }))
);
const StudentFormPage = lazy(() =>
  import("@/pages/StudentFormPage").then((m) => ({ default: m.StudentFormPage }))
);
const StudentDetailPage = lazy(() =>
  import("@/pages/StudentDetailPage").then((m) => ({
    default: m.StudentDetailPage,
  }))
);
const ImportPage = lazy(() =>
  import("@/pages/ImportPage").then((m) => ({ default: m.ImportPage }))
);
const CatalogsPage = lazy(() =>
  import("@/pages/CatalogsPage").then((m) => ({ default: m.CatalogsPage }))
);
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
const UsersPage = lazy(() =>
  import("@/pages/UsersPage").then((m) => ({ default: m.UsersPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailPage />} />

              <Route element={<AdminRoute />}>
                <Route path="students/new" element={<StudentFormPage />} />
                <Route path="students/:id/edit" element={<StudentFormPage />} />
                <Route path="import" element={<ImportPage />} />
                <Route path="catalogs/:type" element={<CatalogsPage />} />
                <Route path="settings/users" element={<UsersPage />} />
              </Route>

              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}