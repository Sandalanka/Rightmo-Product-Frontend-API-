/** Field errors as returned by Laravel validation: { email: ["The email has already been taken."] } */
export type FieldErrors = Record<string, string[]>;

/** Success envelope returned by Controller::successResponse */
export interface ApiSuccessResponse<T = undefined> {
  status: "success";
  message?: string;
  data?: T;
  timestamp: string;
}

/** Error envelope returned by Controller::errorResponse and BaseRequest::failedValidation */
export interface ApiErrorResponse {
  status: "error" | "failed";
  message: string;
  errors?: FieldErrors | string;
  timestamp: string;
}

/** Laravel LengthAwarePaginator meta */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}
