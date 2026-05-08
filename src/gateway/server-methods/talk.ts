import type { GatewayRequestHandlers } from "./types.js";
import { ErrorCodes, errorShape, validateTalkModeParams } from "../protocol/index.js";
import { rejectBadParams } from "./validation.js";

export const talkHandlers: GatewayRequestHandlers = {
  "talk.mode": ({ params, respond, context, client, isWebchatConnect }) => {
    if (client && isWebchatConnect(client.connect) && !context.hasConnectedMobileNode()) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, "talk disabled: no connected iOS/Android nodes"),
      );
      return;
    }
    if (!validateTalkModeParams(params)) {
      rejectBadParams(respond, validateTalkModeParams.errors, "talk.mode");
      return;
    }
    const payload = {
      enabled: (params as { enabled: boolean }).enabled,
      phase: (params as { phase?: string }).phase ?? null,
      ts: Date.now(),
    };
    context.broadcast("talk.mode", payload, { dropIfSlow: true });
    respond(true, payload, undefined);
  },
};
