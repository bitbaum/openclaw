import type { ErrorObject } from "ajv";
import type { RespondFn } from "./types.js";
import { ErrorCodes, errorShape, formatValidationErrors } from "../protocol/index.js";

export function rejectBadParams(
  respond: RespondFn,
  errors: ErrorObject[] | null | undefined,
  method: string,
): void {
  respond(
    false,
    undefined,
    errorShape(
      ErrorCodes.INVALID_REQUEST,
      `invalid ${method} params: ${formatValidationErrors(errors)}`,
    ),
  );
}

/** Trims and validates a required string field. Returns the trimmed value or null (after responding with an error). */
export function extractRequiredString(
  respond: RespondFn,
  value: unknown,
  fieldName: string,
): string | null {
  const trimmed = (typeof value === "string" ? value : "").trim();
  if (!trimmed) {
    respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, `${fieldName} required`));
    return null;
  }
  return trimmed;
}
