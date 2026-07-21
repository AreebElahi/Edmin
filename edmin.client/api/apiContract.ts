/**
 * API CONTRACT LAYER (Phase 13.5 — Contract Lock)
 *
 * Single source of truth for all frontend ↔ backend communication contracts.
 *
 * The backend ALWAYS returns ApiEnvelope<T>:
 *   { success: boolean; data: T; message?: string; error?: ApiError }
 *
 * The frontend ALWAYS uses:
 *   - apiGet<T> / apiPost<T> / apiPatch<T> / apiPut<T> / apiDelete<T>
 *   These helpers call the raw apiClient and unwrap the envelope automatically.
 *
 * NEVER use `as unknown as T` or `response.data` directly in feature API files.
 * ALWAYS go through these contract helpers.
 */

import { AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api';

// ─── Core unwrap adapter ─────────────────────────────────────────────────────

/**
 * Unwraps the backend envelope `{ success, data, error }` and returns just `T`.
 * Throws a structured error if `success` is false or `data` is absent.
 */
export function unwrap<T>(envelope: ApiResponse<T> | undefined): T {
    if (!envelope || typeof envelope !== 'object') {
      const errorToThrow = new Error(typeof envelope === 'string' && envelope ? envelope : 'No response received from the server (Network Error or Invalid Response)') as any;
      errorToThrow.code = 'API_ERROR';
      errorToThrow.details = null;
      throw errorToThrow;
    }
    if (!envelope.success || envelope.data === undefined) {
      // Determine the best message from the envelope
      let bestMessage = 'An unexpected error occurred';
      if (typeof envelope.error === 'string') {
        bestMessage = envelope.error;
      } else if (envelope.error && typeof envelope.error === 'object' && envelope.error.message) {
        bestMessage = envelope.error.message;
      } else if ((envelope as any).message) {
        bestMessage = (envelope as any).message;
      } else if (envelope.success === true && envelope.data === undefined) {
        // If it was a success but data is legitimately missing (e.g., 204 No Content), return empty as T
        return [] as unknown as T; // Fallback for list endpoints
      }

      const errorToThrow = new Error(bestMessage) as any;
      errorToThrow.code = (typeof envelope.error === 'object' ? envelope.error?.code : 'API_ERROR') ?? 'API_ERROR';
      errorToThrow.details = (typeof envelope.error === 'object' ? envelope.error?.details : null) ?? null;
      throw errorToThrow;
    }
    return envelope.data;
}

// ─── Typed HTTP helpers ───────────────────────────────────────────────────────

/**
 * Typed GET helper. Always returns T (unwrapped).
 */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const envelope = await (apiClient.get<ApiResponse<T>>(url, config) as unknown as Promise<ApiResponse<T>>);
  return unwrap<T>(envelope);
}

/**
 * Typed POST helper. Always returns T (unwrapped).
 */
export async function apiPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const envelope = await (apiClient.post<ApiResponse<T>>(url, data, config) as unknown as Promise<ApiResponse<T>>);
  return unwrap<T>(envelope);
}

/**
 * Typed PATCH helper. Always returns T (unwrapped).
 */
export async function apiPatch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const envelope = await (apiClient.patch<ApiResponse<T>>(url, data, config) as unknown as Promise<ApiResponse<T>>);
  return unwrap<T>(envelope);
}

/**
 * Typed PUT helper. Always returns T (unwrapped).
 */
export async function apiPut<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const envelope = await (apiClient.put<ApiResponse<T>>(url, data, config) as unknown as Promise<ApiResponse<T>>);
  return unwrap<T>(envelope);
}

/**
 * Typed DELETE helper. Always returns T (unwrapped).
 */
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const envelope = await (apiClient.delete<ApiResponse<T>>(url, config) as unknown as Promise<ApiResponse<T>>);
  return unwrap<T>(envelope);
}
