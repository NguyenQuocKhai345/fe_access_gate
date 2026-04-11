import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { routePaths } from "@/config/route-paths";
import { useAuthStore } from "@/store/auth-store";

type GuestRouteProps = {
  children?: ReactNode;
};

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to={routePaths.dashboard} replace />;
  }

  return children ?? <Outlet />;
};
