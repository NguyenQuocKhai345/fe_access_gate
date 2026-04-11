import { Suspense } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { GuestRoute } from "@/components/auth/guest-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { RouteLoading } from "@/components/layout/route-loading";
import { SuspenseOutlet } from "@/components/layout/suspense-outlet";
import {
  fallbackRoute,
  guestRoutes,
  protectedRoutes,
  publicRoutes,
  routePaths,
  type AppRouteConfig,
} from "@/config";

const mapRoutes = (routes: AppRouteConfig[]): RouteObject[] => {
  return routes.map((route) => {
    const Component = route.component;

    return {
      index: route.index,
      path: route.path,
      element: <Component />,
    };
  });
};

const FallbackComponent = fallbackRoute.component;

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <AppLayout />,
    children: [
      {
        element: <SuspenseOutlet />,
        children: mapRoutes(publicRoutes),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <SuspenseOutlet />,
            children: mapRoutes(protectedRoutes),
          },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <SuspenseOutlet />,
        children: mapRoutes(guestRoutes),
      },
    ],
  },
  {
    path: fallbackRoute.path,
    element: (
      <Suspense fallback={<RouteLoading />}>
        <FallbackComponent />
      </Suspense>
    ),
  },
]);
