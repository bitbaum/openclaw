/** Matches E.164-style phone numbers: optional leading +, at least 3 digits, nothing else. */
export const PHONE_NUMBER_RE = /^\+?\d{3,}$/;
