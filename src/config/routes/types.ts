import type { ComponentType, LazyExoticComponent } from "react";

export type AppRouteConfig = {
  id: string;
  title: string;
  path?: string;
  index?: boolean;
  component: LazyExoticComponent<ComponentType>;
};
