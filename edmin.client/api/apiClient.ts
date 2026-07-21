import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { ApiResponse } from '../types/api';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Dynamically use the host that served the page, pointing to API port 5000
    return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
};

// Create the base Axios instance
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 120000, // Increased from 10s to 120s for long AI quiz generation requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Axios Retry (Failover Mechanism)
axiosRetry(apiClient, {
  retries: 3, // Number of retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff (1s, 2s, 4s)
  retryCondition: (error) => {
    // Retry on Network Errors and 5xx Server Errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504;
  },
});

// 1. Request Interceptor: Attach JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // In Next.js, localStorage is only available on the client.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Normalize response & globally handle auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Backend always returns { success, data, error }
    if (!response) {
      return { success: false, error: { message: 'Empty or undefined response from network' } } as any;
    }
    const reqUrl = response.config ? response.config.url : undefined;
    return response.data as any; // Strip axios wrapper
  },
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const errorData = error.response?.data?.error;

    // Handle 401 Unauthorized globally
    if (status === 401 && typeof window !== 'undefined') {
      // Do not trigger a global logout event if the 401 came from the login request itself
      if (!error.config?.url?.includes('/auth/login')) {
        console.warn('apiClient: 401 Unauthorized received for URL:', error.config?.url);
        localStorage.removeItem('token');
        // Dispatch a custom event for the AuthProvider to catch, or redirect
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    // Handle 403 Forbidden globally
    const responseData = error.response?.data as any;
    if (status === 403 && typeof window !== 'undefined') {
      const isPasswordChangeRequired = responseData?.code === 'PASSWORD_CHANGE_REQUIRED' || responseData?.error?.code === 'PASSWORD_CHANGE_REQUIRED';

      if (isPasswordChangeRequired) {
        window.dispatchEvent(new Event('auth:password_change_required'));
      } else {
        window.dispatchEvent(new Event('auth:forbidden'));
        // Allow the component to handle the 403 error itself instead of forcing a full page redirect
      }
    }

    // Wrap the error consistently
    let errorMessage = error.message;

    // Try to extract the most descriptive error message from the backend response
    if (error.response?.data) {
      const data = error.response.data as any;
      if (typeof data === 'string') {
        // Plain text or HTML from backend (e.g. proxy or express syntax error)
        errorMessage = data;
      } else if (typeof data === 'object') {
        if (typeof data.error === 'string') {
          // Standard { success: false, error: "..." }
          errorMessage = data.error;
        } else if (data.error?.message) {
          // Nested object { success: false, error: { message: "..." } }
          errorMessage = data.error.message;
        } else if (data.message) {
          // Fallback { message: "..." }
          errorMessage = data.message;
        } else if (data.errors && Array.isArray(data.errors)) {
          // Array of validation errors
          errorMessage = data.errors.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else {
          // Fallback to stringifying the object to ensure we don't lose the real error
          errorMessage = JSON.stringify(data);
        }
      }
    }

    const errorCode = typeof errorData === 'string' ? 'NETWORK_ERROR' : (errorData?.code || 'NETWORK_ERROR');

    const customError = new Error(errorMessage) as any;
    customError.status = status;
    customError.code = errorCode;
    customError.details = typeof errorData === 'string' ? null : (errorData?.details || null);
    customError.url = error.config?.url;

    return Promise.reject(customError);
  }
);
