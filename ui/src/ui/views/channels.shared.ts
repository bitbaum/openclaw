import { html, nothing } from "lit";
import type { ChannelAccountSnapshot, ChannelsStatusSnapshot } from "../types.ts";
import type { ChannelKey, ChannelsProps } from "./channels.types.ts";

export type ChannelStatusSummary = {
  cssClass: "ok" | "warn" | "danger" | "";
  label: string;
};

export function resolveChannelStatus(
  snapshot: ChannelsStatusSnapshot,
  channelId: string,
): ChannelStatusSummary {
  const accounts = snapshot.channelAccounts[channelId] ?? [];
  if (accounts.length === 0) {
    return { cssClass: "", label: "Not configured" };
  }
  if (accounts.some((a) => a.connected)) {
    return { cssClass: "ok", label: "Connected" };
  }
  if (accounts.some((a) => a.running)) {
    return { cssClass: "warn", label: "Running" };
  }
  if (accounts.some((a) => a.lastError)) {
    return { cssClass: "danger", label: "Error" };
  }
  return { cssClass: "", label: "Inactive" };
}

export function channelEnabled(key: ChannelKey, props: ChannelsProps) {
  const snapshot = props.snapshot;
  const channels = snapshot?.channels as Record<string, unknown> | null;
  if (!snapshot || !channels) {
    return false;
  }
  const channelStatus = channels[key] as Record<string, unknown> | undefined;
  const configured = typeof channelStatus?.configured === "boolean" && channelStatus.configured;
  const running = typeof channelStatus?.running === "boolean" && channelStatus.running;
  const connected = typeof channelStatus?.connected === "boolean" && channelStatus.connected;
  const accounts = snapshot.channelAccounts?.[key] ?? [];
  const accountActive = accounts.some(
    (account) => account.configured || account.running || account.connected,
  );
  return configured || running || connected || accountActive;
}

export function getChannelAccountCount(
  key: ChannelKey,
  channelAccounts?: Record<string, ChannelAccountSnapshot[]> | null,
): number {
  return channelAccounts?.[key]?.length ?? 0;
}

export function renderChannelAccountCount(
  key: ChannelKey,
  channelAccounts?: Record<string, ChannelAccountSnapshot[]> | null,
) {
  const count = getChannelAccountCount(key, channelAccounts);
  if (count < 2) {
    return nothing;
  }
  return html`<div class="account-count">Accounts (${count})</div>`;
}
