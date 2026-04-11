import { lazy } from "react";
import { routePaths } from "@/config/route-paths";
import type { AppRouteConfig } from "./types";

const NotFoundPage = lazy(() =>
  import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })),
);

export const fallbackRoute: AppRouteConfig = {
  id: "not-found",
  title: "Not Found",
  path: routePaths.notFound,
  component: NotFoundPage,
};
