import api from "./api";

export const apiSignIn = async (
  payload: {
    email: string;
    password: string;
  }
) => {
  return await api.post(
    '/auth/sign-in', payload
  );
};

export const apiRegister = async (
  payload: {
    email: string;
    password: string;
  }
) => {
  return await api.post('/auth/register', payload);
};

export const apiSignOut = async () => {
  return await api.post('/auth/sign-out');
};