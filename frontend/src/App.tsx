import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ActivatePage from "./pages/ActivatePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTeachersPage from "./pages/AdminTeachersPage";
import PlatformLeadsPage from "./pages/PlatformLeadsPage";
import RosterPage from "./pages/RosterPage";
import ClassDashboard from "./pages/ClassDashboard";
import HandoverWizard from "./pages/HandoverWizard";
import StudentProfilePage from "./pages/StudentProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate" element={<ActivatePage />} />

      <Route element={<ProtectedRoute roles={["ADMIN", "TEACHER"]} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<ClassDashboard />} />
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/handover/:studentId" element={<HandoverWizard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/teachers" element={<AdminTeachersPage />} />
          <Route path="/admin/roster" element={<RosterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["PLATFORM_ADMIN"]} />}>
        <Route element={<Layout />}>
          <Route path="/platform" element={<PlatformLeadsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
