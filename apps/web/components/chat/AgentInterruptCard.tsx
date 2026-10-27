"use client";

import React, { useState } from "react";
import {
  Link2,
  ExternalLink,
  ShieldAlert,
  Check,
  CheckCheck,
  X,
  Loader2,
} from "lucide-react";
import type { AgentInterrupt } from "@/store/agentStore";

interface AgentInterruptCardProps {
  interrupt: AgentInterrupt;
  onResume: (resumeValue: any) => Promise<void> | void;
  onOpenConnectorsModal?: () => void;
}

export function AgentInterruptCard({
  interrupt,
  onResume,
  onOpenConnectorsModal,
}: AgentInterruptCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (value: any) => {
    setIsSubmitting(true);
    try {
      await onResume(value);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (interrupt.type === "connection") {
    const toolkits = interrupt.toolkits || [];

    return (
      <div className="w-full max-w-2xl mx-auto my-4 p-5 sm:p-6 rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xs transition-all animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[var(--s)] border border-[var(--h)] text-[var(--i)] flex items-center justify-center shrink-0">
            <Link2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-[var(--i)] tracking-tight">
                Account Connection Required
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium text-[var(--i)] bg-[var(--s)] rounded-full border border-[var(--h)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--badge-orange)] animate-pulse" />
                Waiting for authorization
              </span>
            </div>
            <p className="text-xs text-[var(--m)] mt-1.5 leading-relaxed">
              {interrupt.message ||
                "To execute this command, Zuri requires access to your external account. Connect your service below to proceed."}
            </p>
          </div>
        </div>

        {/* Toolkit Items (Integration fragments in Cal.com style) */}
        <div className="mt-4 space-y-2.5">
          {toolkits.map((t) => (
            <div
              key={t.toolkit}
              className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--s)] border border-[var(--h)] hover:border-[var(--m)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center font-bold text-xs uppercase text-[var(--i)] border border-[var(--h)] shrink-0">
                  {t.toolkit.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-[var(--i)] capitalize tracking-tight block truncate">
                    {t.toolkit}
                  </span>
                  <p className="text-[11px] text-[var(--m)]">
                    OAuth integration
                  </p>
                </div>
              </div>

              {t.redirectUrl ? (
                <a
                  href={t.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[var(--pt)] bg-[var(--p)] hover:bg-[var(--p-hover)] rounded-lg transition-all active:scale-[0.99] shadow-xs"
                >
                  Connect
                  <ExternalLink size={13} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onOpenConnectorsModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[var(--pt)] bg-[var(--p)] hover:bg-[var(--p-hover)] rounded-lg transition-all active:scale-[0.99] shadow-xs"
                >
                  Configure
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Live Webhook Status Indicator */}
        <div className="mt-3.5 flex items-center gap-2 text-[11px] text-[var(--m)] px-0.5">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-ping shrink-0" />
          <span>
            Webhook active — Zuri will automatically resume as soon as
            authentication completes.
          </span>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-4 border-t border-[var(--h)] flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction({ status: "denied" })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--m)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={14} />
            Cancel / Deny
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction({ status: "connected" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all active:scale-[0.99] shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            I've Connected, Continue
          </button>
        </div>
      </div>
    );
  }

  if (interrupt.type === "approval") {
    const calls = interrupt.calls || [];

    return (
      <div className="w-full max-w-2xl mx-auto my-4 p-5 sm:p-6 rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xs transition-all animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[var(--s)] border border-[var(--h)] text-[var(--i)] flex items-center justify-center shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-[var(--i)] tracking-tight">
                Action Approval Required
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium text-[var(--i)] bg-[var(--s)] rounded-full border border-[var(--h)]">
                Security confirmation
              </span>
            </div>
            <p className="text-xs text-[var(--m)] mt-1.5 leading-relaxed">
              {interrupt.question ||
                "The agent is requesting permission to perform sensitive external actions."}
            </p>
          </div>
        </div>

        {/* Calls List */}
        <div className="mt-4 space-y-2.5">
          {calls.map((call) => (
            <div
              key={call.id}
              className="p-3.5 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-[var(--i)] text-xs">
                  {call.name}
                </span>
                <span className="text-[11px] text-[var(--badge-orange)] bg-[var(--badge-orange)]/10 px-2 py-0.5 rounded-md font-medium border border-[var(--badge-orange)]/20">
                  Needs Confirmation
                </span>
              </div>
              <p className="text-[var(--b)] text-[12px] leading-relaxed">
                <strong className="text-[var(--i)] font-medium">
                  Reason:{" "}
                </strong>
                {call.reason}
              </p>
              {call.args && Object.keys(call.args).length > 0 && (
                <pre className="p-2.5 rounded-md bg-[var(--bg)] text-[11px] text-[var(--b)] overflow-x-auto border border-[var(--h)] font-mono leading-relaxed">
                  {JSON.stringify(call.args, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        {/* Actions in Cal.com Button Style */}
        <div className="mt-5 pt-4 border-t border-[var(--h)] flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() =>
              handleAction({
                decision: "no",
                ...Object.fromEntries(calls.map((c) => [c.id, "no"])),
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--m)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={14} />
            Deny
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleAction({
                  decision: "always",
                  ...Object.fromEntries(calls.map((c) => [c.id, "always"])),
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--i)] bg-[var(--bg)] hover:bg-[var(--s)] border border-[var(--h)] rounded-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <CheckCheck size={14} />
              Always Allow
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleAction({
                  decision: "yes",
                  ...Object.fromEntries(calls.map((c) => [c.id, "yes"])),
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--pt)] bg-[var(--p)] hover:bg-[var(--p-hover)] rounded-lg transition-all active:scale-[0.99] shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Approve
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
