import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { RouteLoading } from "@/components/layout/route-loading";

export const SuspenseOutlet = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Outlet />
    </Suspense>
  );
};
