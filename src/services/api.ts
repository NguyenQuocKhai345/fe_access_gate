import axios, { type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error(
    'VITE_API_BASE_URL is not defined in the environment variables.'
  );
}

const api: AxiosInstance = axios.create({
  baseURL,
//   withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
       console.error('Data:', error.response.data);
       console.error('Status:', error.response.status);
       console.error('Headers:', error.response.headers);
    } else if (error.request) {
       console.error('Request:', error.request);
    } else {
       console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

