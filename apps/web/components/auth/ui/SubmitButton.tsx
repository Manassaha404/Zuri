"use client";

import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SubmitButton({
  loading,
  label,
  loadingLabel = "Please wait...",
  disabled = false,
  className = "",
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`bt p ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
