import axios, { type AxiosInstance } from "axios";

const fallbackBaseUrl = "http://localhost:8080/api";
const baseURL = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;

let accessTokenGetter: (() => string | null) | null = null;

export const registerAccessTokenGetter = (getter: () => string | null) => {
  accessTokenGetter = getter;
};

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = accessTokenGetter?.();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("API error response:", {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error("API request error:", error.request);
    } else {
      console.error("API setup error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
