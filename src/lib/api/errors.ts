import { AxiosError, isAxiosError } from "axios";
import type { ApiErrorResponse, FieldErrors } from "@/types/api";

/** Normalised error thrown by every API call, so UI code never has to inspect AxiosError. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status = 0, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** First message for a field, handy for showing under an input. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (!axiosError.response) {
      const message =
        axiosError.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : "Unable to reach the server. Check your connection.";
      return new ApiError(message);
    }

    const { status, data } = axiosError.response;
    const fieldErrors = data?.errors && typeof data.errors === "object" ? data.errors : {};
    return new ApiError(data?.message ?? axiosError.message, status, fieldErrors);
  }

  return new ApiError(error instanceof Error ? error.message : "Something went wrong.");
}
