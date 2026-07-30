"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { archiveProjectAction } from "@/app/(workspace)/projects/actions";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";

export function ProjectArchiveButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveProjectAction({ projectId });
      if (!result.success) {
        setMessage(result.message ?? "The project could not be deleted.");
        return;
      }

      setIsOpen(false);
      router.push(result.redirectTo ?? "/projects");
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 border-[#f0c7c4] text-[#c8362b] shadow-none hover:border-[#eaa39e] hover:bg-[#fff3f2] hover:text-[#b52d24]"
          aria-label={`Delete ${projectName}`}
          title="Delete project"
          disabled={isPending}
          onClick={() => {
            setMessage(null);
            setIsOpen(true);
          }}
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </Button>
        {message ? (
          <p
            role="alert"
            className="max-w-40 text-[0.65rem] font-semibold text-destructive"
          >
            {message}
          </p>
        ) : null}
      </div>

      <DeleteConfirmModal
        isOpen={isOpen}
        title="Delete Project"
        itemName={projectName}
        description="The project and its planning data will be archived and removed from all active project views."
        confirmLabel="Delete Project"
        warning="The data is preserved in the archive and is not permanently erased."
        isDeleting={isPending}
        onConfirm={handleArchive}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
