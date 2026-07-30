"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserMinus, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  archiveMembershipAction,
  setMembershipAction,
} from "@/app/(workspace)/projects/actions";
import {
  FormField,
  selectClasses,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  membershipRoles,
  setMembershipSchema,
  type SetMembershipInput,
} from "@/lib/projects/project.schemas";
import { displayEnum } from "@/lib/projects/project.utils";

export function MembershipManager({
  projectId,
  members,
  users,
}: {
  projectId: string;
  members: Array<{
    role: "PROJECT_MANAGER" | "TECHNICAL_LEAD" | "REVIEWER" | "VIEWER";
    user: {
      id: string;
      displayName: string;
      email: string;
      isActive: boolean;
    };
  }>;
  users: Array<{ id: string; displayName: string; email: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetMembershipInput>({
    resolver: zodResolver(setMembershipSchema),
    defaultValues: {
      projectId,
      userId: users[0]?.id ?? "",
      role: "VIEWER",
    },
  });

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role={message.success ? "status" : "alert"}
          className={
            message.success
              ? "text-sm text-emerald-700 dark:text-emerald-300"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
      <form
        className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end"
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            const result = await setMembershipAction(values);
            setMessage({
              success: result.success,
              text:
                result.message ??
                (result.success
                  ? "Project membership saved."
                  : "Membership could not be saved."),
            });
          }),
        )}
      >
        <input type="hidden" {...register("projectId")} />
        <FormField
          id="membership-user"
          label="User"
          error={errors.userId?.message}
        >
          <select
            id="membership-user"
            className={selectClasses}
            {...register("userId")}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName} — {user.email}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="membership-role"
          label="Project role"
          error={errors.role?.message}
        >
          <select
            id="membership-role"
            className={selectClasses}
            {...register("role")}
          >
            {membershipRoles.map((role) => (
              <option key={role} value={role}>
                {displayEnum(role)}
              </option>
            ))}
          </select>
        </FormField>
        <Button type="submit" disabled={isPending || users.length === 0}>
          {isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <UserPlus />
          )}
          Save
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="border-b bg-muted/35 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Project role</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.user.id} className="border-b last:border-0">
                <td className="px-4 py-4">
                  <p className="font-medium">{member.user.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </td>
                <td className="px-4 py-4">{displayEnum(member.role)}</td>
                <td className="px-4 py-4">
                  {member.user.isActive ? "Active" : "Inactive"}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Remove ${member.user.displayName} from this project?`,
                        )
                      ) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await archiveMembershipAction({
                          projectId,
                          userId: member.user.id,
                        });
                        setMessage({
                          success: result.success,
                          text:
                            result.message ??
                            (result.success
                              ? "Project membership removed."
                              : "Membership could not be removed."),
                        });
                      });
                    }}
                  >
                    <UserMinus />
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
