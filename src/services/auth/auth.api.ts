import api from "@/services/api";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  factoryIds?: string[];
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
};

export const apiLogin = async (payload: LoginPayload) => {
  return await api.get<AuthResponse>("/auth/login", { params: payload });
};

export const apiRegister = async (payload: RegisterPayload) => {
  return await api.post<AuthResponse>("/auth/register", payload);
};

export const apiLogout = async () => {
  return await api.post("/auth/logout");
};
