import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiLogin,
  apiLogout,
  apiRegister,
  type LoginPayload,
  type RegisterPayload,
} from "@/services/auth/auth.api";
import { useAuthStore } from "@/store/auth-store";

const authSessionQueryKey = ["auth", "session"] as const;

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  const signInMutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: apiLogin,
    onSuccess: (response) => {
      setSession(response.data);
      queryClient.setQueryData(authSessionQueryKey, response.data.user);
    },
  });

  const registerMutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: apiRegister,
    onSuccess: (response) => {
      setSession(response.data);
      queryClient.setQueryData(authSessionQueryKey, response.data.user);
    },
  });

  const signOutMutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: apiLogout,
    onSettled: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: authSessionQueryKey });
    },
  });

  const signIn = async (payload: LoginPayload) => {
    const response = await signInMutation.mutateAsync(payload);
    return response.data;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await registerMutation.mutateAsync(payload);
    return response.data;
  };

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    signIn,
    register,
    signOut,
    isSigningIn: signInMutation.isPending,
    isRegistering: registerMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    registerError: registerMutation.error,
    signOutError: signOutMutation.error,
  };
};
