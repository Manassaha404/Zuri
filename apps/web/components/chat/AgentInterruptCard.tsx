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
  Copy,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { AgentInterrupt, ApprovalToolCall } from "@/store/agentStore";

interface AgentInterruptCardProps {
  interrupt: AgentInterrupt;
  onResume: (resumeValue: any) => Promise<void> | void;
  onOpenConnectorsModal?: () => void;
}

interface ApprovalCallItemProps {
  call: ApprovalToolCall;
}

// Sub-component for individual tool call inspection
function ApprovalCallItem({ call }: ApprovalCallItemProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedArgs =
    call.args && Object.keys(call.args).length > 0
      ? JSON.stringify(call.args, null, 2)
      : null;

  const handleCopyArgs = async () => {
    if (!formattedArgs) return;
    try {
      await navigator.clipboard.writeText(formattedArgs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-3.5 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs space-y-2.5 min-w-0 w-full overflow-hidden">
      {/* Call Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className="font-mono font-semibold text-[var(--i)] text-xs truncate min-w-0"
          title={call.name}
        >
          {call.name}
        </span>
        <span className="text-[11px] text-[var(--badge-orange)] bg-[var(--badge-orange)]/10 px-2 py-0.5 rounded-md font-medium border border-[var(--badge-orange)]/20 shrink-0">
          Needs Confirmation
        </span>
      </div>

      {/* Call Reason */}
      {call.reason && (
        <p className="text-[var(--b)] text-[12px] leading-relaxed break-words [overflow-wrap:anywhere]">
          <strong className="text-[var(--i)] font-medium">Reason: </strong>
          {call.reason}
        </p>
      )}

      {/* Call Arguments / Data Display */}
      {formattedArgs && (
        <div className="w-full min-w-0 max-w-full rounded-lg border border-[var(--h)] bg-[var(--bg)] overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--s)]/70 border-b border-[var(--h)] text-xs text-[var(--m)] select-none">
            <span className="font-mono text-[11px] font-semibold text-[var(--i)] tracking-wide uppercase">
              Parameters
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-label={
                  isExpanded
                    ? "Collapse parameters view"
                    : "Expand parameters view"
                }
                className="inline-flex items-center gap-1 text-[11px] text-[var(--m)] hover:text-[var(--i)] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <Minimize2 size={12} />
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={12} />
                    <span>Expand</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyArgs}
                aria-label="Copy parameters"
                className="inline-flex items-center gap-1.5 text-[11px] text-[var(--m)] hover:text-[var(--i)] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <pre
            className={`p-3 m-0 w-full max-w-full min-w-0 text-[11px] text-[var(--b)] font-mono leading-relaxed bg-transparent border-0 styled-scrollbar whitespace-pre-wrap break-all sm:break-words [overflow-wrap:anywhere] ${
              isExpanded
                ? "max-h-none overflow-y-visible"
                : "max-h-72 overflow-y-auto"
            }`}
          >
            <code>{formattedArgs}</code>
          </pre>
        </div>
      )}
    </div>
  );
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
      <div className="w-full max-w-2xl mx-auto my-4 p-5 sm:p-6 rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xs transition-all animate-in fade-in duration-200 min-w-0 max-w-full flex flex-col max-h-[min(620px,78vh)]">
        {/* Header */}
        <div className="flex items-start gap-3.5 min-w-0 w-full shrink-0">
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
            <p className="text-xs text-[var(--m)] mt-1.5 leading-relaxed break-words [overflow-wrap:anywhere]">
              {interrupt.message ||
                "To execute this command, Zuri requires access to your external account. Connect your service below to proceed."}
            </p>
          </div>
        </div>

        {/* Toolkit Items */}
        <div className="mt-4 space-y-2.5 min-w-0 w-full flex-1 min-h-0 overflow-y-auto styled-scrollbar pr-1">
          {toolkits.map((t) => (
            <div
              key={t.toolkit}
              className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--s)] border border-[var(--h)] hover:border-[var(--m)] transition-colors min-w-0 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center font-bold text-xs uppercase text-[var(--i)] border border-[var(--h)] shrink-0">
                  {t.toolkit.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-[var(--i)] capitalize tracking-tight block truncate">
                    {t.toolkit}
                  </span>
                  <p className="text-[11px] text-[var(--m)] truncate">
                    OAuth integration
                  </p>
                </div>
              </div>

              {t.redirectUrl ? (
                <a
                  href={t.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[var(--pt)] bg-[var(--p)] hover:bg-[var(--p-hover)] rounded-lg transition-all active:scale-[0.99] shadow-xs shrink-0"
                >
                  Connect
                  <ExternalLink size={13} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onOpenConnectorsModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[var(--pt)] bg-[var(--p)] hover:bg-[var(--p-hover)] rounded-lg transition-all active:scale-[0.99] shadow-xs shrink-0"
                >
                  Configure
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls - Always visible at bottom */}
        <div className="mt-4 pt-3.5 border-t border-[var(--h)] flex items-center justify-between gap-3 flex-wrap shrink-0 bg-[var(--bg)]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction({ status: "denied" })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--m)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <X size={14} />
            Cancel / Deny
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction({ status: "connected" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all active:scale-[0.99] shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
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
      <div className="w-full max-w-2xl mx-auto my-4 p-5 sm:p-6 rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xs transition-all animate-in fade-in duration-200 min-w-0 max-w-full flex flex-col max-h-[min(620px,78vh)]">
        {/* Header - Fixed at top */}
        <div className="flex items-start gap-3.5 min-w-0 w-full shrink-0">
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
            <p className="text-xs text-[var(--m)] mt-1.5 leading-relaxed break-words [overflow-wrap:anywhere]">
              {interrupt.question ||
                "The agent is requesting permission to perform sensitive external actions."}
            </p>
          </div>
        </div>

        {/* Calls List - Scrollable in the middle */}
        <div className="mt-4 space-y-2.5 min-w-0 w-full flex-1 min-h-0 overflow-y-auto styled-scrollbar pr-1">
          {calls.map((call) => (
            <ApprovalCallItem key={call.id} call={call} />
          ))}
        </div>

        {/* Actions in Primary Button Style - Always pinned & visible at bottom */}
        <div className="mt-4 pt-3.5 border-t border-[var(--h)] flex items-center justify-between gap-2.5 flex-wrap shrink-0 bg-[var(--bg)]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() =>
              handleAction({
                decision: "no",
                ...Object.fromEntries(calls.map((c) => [c.id, "no"])),
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--m)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <X size={14} />
            Deny
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleAction({
                  decision: "always",
                  ...Object.fromEntries(calls.map((c) => [c.id, "always"])),
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--i)] bg-[var(--bg)] hover:bg-[var(--s)] border border-[var(--h)] rounded-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--pt)] bg-[var(--p)] hover:bg-[var(--p-hover)] rounded-lg transition-all active:scale-[0.99] shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
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
