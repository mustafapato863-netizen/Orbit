"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  description?: string;
  confirmLabel?: string;
  warning?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title = "Delete Work Package",
  itemName,
  description = "This action will archive the work package and remove it from active timelines.",
  confirmLabel = "Delete Work Package",
  warning = "This item will be archived and removed from delivery totals.",
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen && !isDeleting) {
        onCancel();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={isDeleting ? undefined : onCancel}
      />

      {/* Modal Card */}
      <div className="relative z-20 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[var(--orbit-border)] animate-in zoom-in-95 duration-150 font-sans">
        <div className="flex items-start gap-4">
          <div className="size-11 shrink-0 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
            <Trash2 className="size-5" />
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <h3
              id="delete-modal-title"
              className="text-[16px] font-extrabold text-[var(--orbit-text)] tracking-tight"
            >
              {title}
            </h3>
            <p className="text-[13px] text-[var(--orbit-text-muted)] leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-[var(--orbit-text)]">
                &ldquo;{itemName}&rdquo;
              </span>
              ? {description}
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50/80 px-3 py-2 text-[11.5px] font-medium text-amber-800 border border-amber-200/60">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
          <span>{warning}</span>
        </div>

        {/* Footer Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4 text-[12.5px] font-semibold text-[var(--orbit-text-muted)] hover:bg-slate-50"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 px-4 text-[12.5px] font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs gap-1.5"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            <Trash2 className="size-3.5" />
            {isDeleting ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
