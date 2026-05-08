import { normalizeWhatsAppTarget } from "../../../whatsapp/normalize.js";
import { PHONE_NUMBER_RE } from "./patterns.js";

export function normalizeWhatsAppMessagingTarget(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return normalizeWhatsAppTarget(trimmed) ?? undefined;
}

export function looksLikeWhatsAppTargetId(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  if (/^whatsapp:/i.test(trimmed)) {
    return true;
  }
  if (trimmed.includes("@")) {
    return true;
  }
  return PHONE_NUMBER_RE.test(trimmed);
}
