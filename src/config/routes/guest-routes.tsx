import { lazy } from "react";
import { routePaths } from "@/config/route-paths";
import type { AppRouteConfig } from "./types";

const LoginPage = lazy(() =>
  import("@/pages/login-page").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/register-page").then((module) => ({ default: module.RegisterPage })),
);

export const guestRoutes: AppRouteConfig[] = [
  {
    id: "login",
    title: "Login",
    path: routePaths.login,
    component: LoginPage,
  },
  {
    id: "register",
    title: "Register",
    path: routePaths.register,
    component: RegisterPage,
  },
];
