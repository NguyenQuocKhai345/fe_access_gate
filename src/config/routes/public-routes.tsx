import { lazy } from "react";
import type { AppRouteConfig } from "./types";

const HomePage = lazy(() =>
  import("@/pages/home-page").then((module) => ({ default: module.HomePage })),
);

export const publicRoutes: AppRouteConfig[] = [
  {
    id: "home",
    title: "Home",
    index: true,
    component: HomePage,
  },
];
