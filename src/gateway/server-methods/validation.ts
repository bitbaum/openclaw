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
