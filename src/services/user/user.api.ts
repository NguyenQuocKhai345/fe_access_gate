import api from "@/services/api";
import type { AuthUser } from "@/services/auth/auth.api";

export const apiGetCurrentUser = async () => {
  return await api.get<AuthUser>("/users/me");
};
