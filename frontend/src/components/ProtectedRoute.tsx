import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../api/types";
import { homePath } from "../lib/roles";
import { LoadingSkeleton } from "./LoadingSkeleton";

export default function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  return <Outlet />;
}
