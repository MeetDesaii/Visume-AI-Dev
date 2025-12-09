// lib/axios/createAxios.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

export type TokenProvider = () => Promise<string | null> | string | null;

export type CreateAxiosOptions = {
  baseURL?: string;
  getToken?: TokenProvider;
  onUnauthorized?: (error: AxiosError) => void | Promise<void>;
  requestConfig?: AxiosRequestConfig;
};

export function createAxiosClient({
  baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  getToken,
  onUnauthorized,
  requestConfig,
}: CreateAxiosOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    ...requestConfig,
  });

  instance.interceptors.request.use(async (config) => {
    if (!getToken) return config;
    const token = await getToken();
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any;
    }
    return config;
  });

  // Centralized 401 handling
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401 && onUnauthorized) {
        await onUnauthorized(error);
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
