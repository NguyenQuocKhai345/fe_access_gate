import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { routePaths } from "@/config/route-paths";
import { useAuthStore } from "@/store/auth-store";

type ProtectedRouteProps = {
  children?: ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to={routePaths.login} replace state={{ from: location.pathname }} />;
  }

  return children ?? <Outlet />;
};
