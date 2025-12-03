/**
 * Shared API response helpers.
 */
export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
