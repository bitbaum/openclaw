import { html, nothing } from "lit";
import type { GatewayHelloOk } from "../gateway.ts";
import type { Tab } from "../navigation.ts";
import type {
  AgentsListResult,
  ChannelsStatusSnapshot,
  CostUsageSummary,
  CronJob,
  CronStatus,
} from "../types.ts";
import { DEFAULT_ASSISTANT_NAME } from "../assistant-identity.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import { formatNextRun } from "../presenter.ts";
import { resolveChannelStatus } from "./channels.shared.ts";

function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(n);
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

export type DashboardProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  assistantName: string;
  assistantAvatar: string | null;
  lastError: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  channelsSnapshot: ChannelsStatusSnapshot | null;
  cronStatus: CronStatus | null;
  cronJobs: CronJob[];
  agentsList: AgentsListResult | null;
  costSummary: CostUsageSummary | null;
  loading: boolean;
  lastRefreshedAt: number | null;
  onNavigate: (tab: Tab) => void;
  onRefresh: () => void;
  onConnect: () => void;
};

export function renderDashboard(props: DashboardProps) {
  const snapshot = props.hello?.snapshot as
    | { uptimeMs?: number; policy?: { tickIntervalMs?: number } }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : "n/a";
  const tick = snapshot?.policy?.tickIntervalMs ? `${snapshot.policy.tickIntervalMs}ms` : "n/a";

  const title =
    props.assistantName && props.assistantName !== DEFAULT_ASSISTANT_NAME
      ? `${props.assistantName} Dashboard`
      : "Dashboard";

  const refreshLabel = props.lastRefreshedAt
    ? `Updated ${formatRelativeTimestamp(props.lastRefreshedAt)}`
    : null;

  // Channels list
  const channelEntries = (() => {
    const snap = props.channelsSnapshot;
    if (!snap) {
      return [];
    }
    if (snap.channelMeta && snap.channelMeta.length > 0) {
      return snap.channelMeta.map((m) => {
        const s = resolveChannelStatus(snap, m.id);
        return { id: m.id, label: m.label, status: s.cssClass, statusLabel: s.label };
      });
    }
    return snap.channelOrder.map((id) => {
      const s = resolveChannelStatus(snap, id);
      return { id, label: snap.channelLabels[id] ?? id, status: s.cssClass, statusLabel: s.label };
    });
  })();

  // Cron jobs (top 5)
  const cronJobsPreview = props.cronJobs.slice(0, 5);

  // Agents
  const agents = props.agentsList?.agents ?? [];
  const defaultAgentId = props.agentsList?.defaultId ?? null;

  return html`
    <!-- Dashboard header -->
    <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 18px;">
      <div>
        <div style="font-size: 20px; font-weight: 700; color: var(--text-strong);">
          ${props.assistantAvatar ? html`<span style="margin-right: 6px;">${props.assistantAvatar}</span>` : nothing}${title}
        </div>
        ${refreshLabel ? html`<div class="muted" style="font-size: 12px; margin-top: 2px;">${refreshLabel}</div>` : nothing}
      </div>
      <div class="row" style="gap: 8px;">
        ${
          !props.connected
            ? html`<button class="btn" @click=${() => props.onConnect()}>Connect</button>`
            : nothing
        }
        <button class="btn" @click=${() => props.onRefresh()} ?disabled=${props.loading}>
          ${props.loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>

    <!-- Connection error banner -->
    ${
      !props.connected && props.lastError
        ? html`
          <div class="callout danger" style="margin-bottom: 18px;">
            <div>${props.lastError}</div>
            <div class="muted" style="margin-top: 6px;">
              Check gateway settings in
              <a class="session-link" href="javascript:void(0)" @click=${() => props.onNavigate("config")}>Config</a>
              or run <span class="mono">openclaw doctor</span>.
            </div>
          </div>
        `
        : nothing
    }

    <!-- Row 1: System Health / Sessions / Instances -->
    <section class="grid grid-cols-3">
      <div class="card stat-card">
        <div class="stat-label">System Health</div>
        <div class="stat-value ${props.connected ? "ok" : "warn"}">
          ${props.connected ? "Connected" : "Disconnected"}
        </div>
        <div class="stat-grid" style="margin-top: 12px;">
          <div class="stat">
            <div class="stat-label">Uptime</div>
            <div class="stat-value" style="font-size: 16px;">${uptime}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Tick</div>
            <div class="stat-value" style="font-size: 16px;">${tick}</div>
          </div>
        </div>
      </div>

      <div
        class="card stat-card"
        style="cursor: pointer;"
        @click=${() => props.onNavigate("sessions")}
        title="View sessions"
      >
        <div class="stat-label">Sessions</div>
        <div class="stat-value">${props.sessionsCount ?? "n/a"}</div>
        <div class="muted">active sessions</div>
      </div>

      <div
        class="card stat-card"
        style="cursor: pointer;"
        @click=${() => props.onNavigate("instances")}
        title="View instances"
      >
        <div class="stat-label">Instances</div>
        <div class="stat-value">${props.presenceCount}</div>
        <div class="muted">presence beacons</div>
      </div>
    </section>

    <!-- Row 2: Channels / Cron -->
    <section class="grid grid-cols-2" style="margin-top: 18px;">
      <div
        class="card"
        style="cursor: pointer;"
        @click=${() => props.onNavigate("channels")}
        title="View channels"
      >
        <div class="card-title">Channels</div>
        <div class="card-sub">Message integrations</div>
        ${
          channelEntries.length === 0
            ? html`
                <div class="muted" style="margin-top: 12px">No channels loaded</div>
              `
            : html`
              <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                ${channelEntries.map(
                  (ch) => html`
                    <div class="row" style="gap: 8px; align-items: center;">
                      <span class="statusDot ${ch.status}"></span>
                      <span style="font-weight: 500;">${ch.label}</span>
                      <span class="muted" style="font-size: 12px;">${ch.statusLabel}</span>
                    </div>
                  `,
                )}
              </div>
            `
        }
      </div>

      <div
        class="card"
        style="cursor: pointer;"
        @click=${() => props.onNavigate("cron")}
        title="View cron jobs"
      >
        <div class="card-title">Cron</div>
        <div class="card-sub">
          ${
            props.cronStatus
              ? html`
                <span class="chip ${props.cronStatus.enabled ? "chip-ok" : ""}">${props.cronStatus.enabled ? "Enabled" : "Disabled"}</span>
                <span style="margin-left: 6px;">${props.cronStatus.jobs} job${props.cronStatus.jobs !== 1 ? "s" : ""}</span>
                <span class="muted" style="margin-left: 6px;">Next ${formatNextRun(props.cronStatus.nextWakeAtMs ?? null)}</span>
              `
              : "Not loaded"
          }
        </div>
        ${
          cronJobsPreview.length > 0
            ? html`
              <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
                ${cronJobsPreview.map(
                  (job) => html`
                    <div class="row" style="gap: 8px; align-items: center; justify-content: space-between;">
                      <span style="font-weight: 500; font-size: 13px;">${job.name}</span>
                      <div class="row" style="gap: 6px; align-items: center;">
                        ${
                          job.state?.lastStatus
                            ? html`<span class="chip ${job.state.lastStatus === "ok" ? "chip-ok" : job.state.lastStatus === "error" ? "chip-danger" : ""}" style="font-size: 11px;">${job.state.lastStatus}</span>`
                            : html`
                                <span class="muted" style="font-size: 11px">no runs</span>
                              `
                        }
                        <span class="chip" style="font-size: 11px;">${job.enabled ? "on" : "off"}</span>
                      </div>
                    </div>
                  `,
                )}
              </div>
            `
            : html`
                <div class="muted" style="margin-top: 12px">No cron jobs configured</div>
              `
        }
      </div>
    </section>

    <!-- Row 3: Agents / Usage -->
    <section class="grid grid-cols-2" style="margin-top: 18px;">
      <div
        class="card"
        style="cursor: pointer;"
        @click=${() => props.onNavigate("agents")}
        title="View agents"
      >
        <div class="card-title">Agents</div>
        <div class="card-sub">${agents.length} agent${agents.length !== 1 ? "s" : ""} configured</div>
        ${
          agents.length > 0
            ? html`
              <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
                ${agents.map(
                  (agent) => html`
                    <div class="row" style="gap: 8px; align-items: center;">
                      ${
                        agent.identity?.emoji
                          ? html`<span>${agent.identity.emoji}</span>`
                          : html`
                              <span class="statusDot ok"></span>
                            `
                      }
                      <span style="font-weight: 500;">${agent.identity?.name ?? agent.name ?? agent.id}</span>
                      ${
                        agent.id === defaultAgentId
                          ? html`
                              <span class="chip" style="font-size: 11px">default</span>
                            `
                          : nothing
                      }
                    </div>
                  `,
                )}
              </div>
            `
            : html`
                <div class="muted" style="margin-top: 12px">No agents configured</div>
              `
        }
      </div>

      <div
        class="card"
        style="cursor: pointer;"
        @click=${() => props.onNavigate("usage")}
        title="View usage"
      >
        <div class="card-title">Usage</div>
        <div class="card-sub">Last 30 days</div>
        ${
          props.costSummary
            ? html`
                <div class="stat-grid" style="margin-top: 12px;">
                  <div class="stat">
                    <div class="stat-label">Tokens</div>
                    <div class="stat-value" style="font-size: 16px;">${formatTokens(props.costSummary.totals.totalTokens)}</div>
                  </div>
                  <div class="stat">
                    <div class="stat-label">Cost</div>
                    <div class="stat-value" style="font-size: 16px;">${formatCost(props.costSummary.totals.totalCost)}</div>
                  </div>
                </div>
                <div class="muted" style="margin-top: 8px; font-size: 12px;">
                  ${
                    props.costSummary.totals.missingCostEntries > 0
                      ? html`<span>${props.costSummary.totals.missingCostEntries} session${props.costSummary.totals.missingCostEntries !== 1 ? "s" : ""} missing pricing · </span>`
                      : nothing
                  }
                  Click for details
                </div>
              `
            : html`
                <div class="muted" style="margin-top: 12px">Click to view usage analytics</div>
              `
        }
      </div>
    </section>
  `;
}
