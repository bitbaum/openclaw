import type { GatewayRequestHandlers } from "./types.js";
import { ErrorCodes, errorShape, validateModelsListParams } from "../protocol/index.js";
import { rejectBadParams } from "./validation.js";

export const modelsHandlers: GatewayRequestHandlers = {
  "models.list": async ({ params, respond, context }) => {
    if (!validateModelsListParams(params)) {
      rejectBadParams(respond, validateModelsListParams.errors, "models.list");
      return;
    }
    try {
      const models = await context.loadGatewayModelCatalog();
      respond(true, { models }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
};
