import { lazy } from "react";
import { routePaths } from "@/config/route-paths";
import type { AppRouteConfig } from "./types";

const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })),
);

export const protectedRoutes: AppRouteConfig[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: routePaths.dashboard.replace(/^\//, ""),
    component: DashboardPage,
  },
];
