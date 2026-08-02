"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FolderLock,
  KeyRound,
  LoaderCircle,
  ShieldPlus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  assignRoleAction,
  createUserAction,
  removeProjectMembershipAction,
  resetPasswordAction,
  setAccountStatusAction,
  setProjectMembershipAction,
} from "@/app/(workspace)/access/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  assignRoleSchema,
  createUserSchema,
  projectMembershipSchema,
  resetPasswordSchema,
  type ActionResult,
  type AssignRoleInput,
  type CreateUserInput,
  type ProjectMembershipInput,
  type ResetPasswordInput,
} from "@/lib/auth/auth.schemas";

type AccessAdminPanelProps = {
  currentUserId: string;
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    isActive: boolean;
    mustChangePassword: boolean;
    lastLoginAt: Date | null;
    userRoles: Array<{ role: { id: string; name: string } }>;
    projectMemberships: Array<{
      role: string;
      project: {
        id: string;
        name: string;
        code: string;
        isPrivate: boolean;
      };
    }>;
  }>;
  roles: Array<{ id: string; name: string; description: string | null }>;
  projects: Array<{
    id: string;
    name: string;
    code: string;
    isPrivate: boolean;
  }>;
};

const selectClasses =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50";

function FormMessage({ result }: { result: ActionResult | null }) {
  if (!result?.message) return null;

  return (
    <p
      role={result.success ? "status" : "alert"}
      className={
        result.success
          ? "text-sm text-emerald-700 dark:text-emerald-300"
          : "text-sm text-destructive"
      }
    >
      {result.message}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs text-destructive">{message}</p>
  ) : null;
}

export function AccessAdminPanel({
  currentUserId,
  users,
  roles,
  projects,
}: AccessAdminPanelProps) {
  const assignableProjects = projects.filter(({ isPrivate }) => !isPrivate);
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<
    Record<
      "status" | "create" | "role" | "membership" | "reset",
      ActionResult | null
    >
  >({
    status: null,
    create: null,
    role: null,
    membership: null,
    reset: null,
  });
  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      displayName: "",
      email: "",
      temporaryPassword: "",
      roleId: roles[0]?.id ?? "",
      projectIds: [],
      membershipRole: "VIEWER",
    },
  });
  const roleForm = useForm<AssignRoleInput>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      userId: users[0]?.id ?? "",
      roleId: roles[0]?.id ?? "",
    },
  });
  const membershipForm = useForm<ProjectMembershipInput>({
    resolver: zodResolver(projectMembershipSchema),
    defaultValues: {
      userId: users[0]?.id ?? "",
      projectId: assignableProjects[0]?.id ?? "",
      membershipRole: "VIEWER",
    },
  });
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: users[0]?.id ?? "",
      temporaryPassword: "",
    },
  });

  function submit<T>(
    key: keyof typeof results,
    operation: (input: T) => Promise<ActionResult>,
    values: T,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await operation(values);
      setResults((current) => ({ ...current, [key]: result }));
      if (result.success) onSuccess?.();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Active roles and project memberships are enforced on every server
            mutation and protected route.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormMessage result={results.status} />
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No accounts yet"
              description="Create the first managed account or run the optional local development account seed."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Roles</th>
                    <th className="px-3 py-3 font-medium">Memberships</th>
                    <th className="px-3 py-3 font-medium">Account</th>
                    <th className="px-3 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-3 py-4">
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                          {user.lastLoginAt
                            ? `Last login ${user.lastLoginAt.toISOString().slice(0, 10)}`
                            : "Never signed in"}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        {user.userRoles
                          .map(({ role }) => role.name)
                          .join(", ") || "None"}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {user.projectMemberships.length
                          ? (
                              <div className="flex max-w-md flex-wrap gap-1.5">
                                {user.projectMemberships.map(
                                  ({ project, role }) => (
                                    <span
                                      key={project.id}
                                      className="inline-flex items-center gap-1 rounded-full border border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] py-1 pl-2.5 pr-1 text-[0.6875rem]"
                                    >
                                      {project.isPrivate ? (
                                        <FolderLock
                                          className="size-3 text-[#6350c9]"
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      <span>
                                        {project.name} ·{" "}
                                        {role
                                          .replaceAll("_", " ")
                                          .toLowerCase()}
                                      </span>
                                      <button
                                        type="button"
                                        aria-label={`Remove ${user.displayName} from ${project.name}`}
                                        title={`Remove access to ${project.name}`}
                                        disabled={isPending}
                                        onClick={() =>
                                          startTransition(async () => {
                                            const result =
                                              await removeProjectMembershipAction(
                                                {
                                                  userId: user.id,
                                                  projectId: project.id,
                                                },
                                              );
                                            setResults((current) => ({
                                              ...current,
                                              membership: {
                                                ...result,
                                                message:
                                                  result.message ??
                                                  (result.success
                                                    ? "Project access removed."
                                                    : "Project access was not removed."),
                                              },
                                            }));
                                          })
                                        }
                                        className="inline-flex size-6 items-center justify-center rounded-full text-[var(--orbit-text-subtle)] transition-colors hover:bg-[#fdebea] hover:text-[#c8362b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-purple)] disabled:opacity-50"
                                      >
                                        <X className="size-3" aria-hidden="true" />
                                      </button>
                                    </span>
                                  ),
                                )}
                              </div>
                            )
                          : "None"}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge
                            status={user.isActive ? "completed" : "blocked"}
                            label={user.isActive ? "Active" : "Inactive"}
                          />
                          {user.mustChangePassword ? (
                            <StatusBadge
                              status="at-risk"
                              label="Password change due"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            isPending ||
                            (user.id === currentUserId && user.isActive)
                          }
                          title={
                            user.id === currentUserId && user.isActive
                              ? "You cannot deactivate your own account."
                              : undefined
                          }
                          onClick={() =>
                            startTransition(async () => {
                              const result = await setAccountStatusAction({
                                userId: user.id,
                                isActive: !user.isActive,
                              });
                              setResults((current) => ({
                                ...current,
                                status: {
                                  ...result,
                                  message:
                                    result.message ??
                                    (result.success
                                      ? "Account status updated."
                                      : "Account status was not updated."),
                                },
                              }));
                            })
                          }
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Temporary credentials require a password change at first sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={createForm.handleSubmit((values) =>
                submit(
                  "create",
                  createUserAction,
                  values,
                  () =>
                    createForm.reset({
                      displayName: "",
                      email: "",
                      temporaryPassword: "",
                      roleId: roles[0]?.id ?? "",
                      projectIds: [],
                      membershipRole: "VIEWER",
                    }),
                ),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-display-name">Display name</Label>
                  <Input
                    id="create-display-name"
                    {...createForm.register("displayName")}
                  />
                  <FieldError
                    message={createForm.formState.errors.displayName?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    {...createForm.register("email")}
                  />
                  <FieldError
                    message={createForm.formState.errors.email?.message}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Temporary password</Label>
                <PasswordInput
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  {...createForm.register("temporaryPassword")}
                />
                <FieldError
                  message={
                    createForm.formState.errors.temporaryPassword?.message
                  }
                />
                <p className="text-xs text-muted-foreground">
                  At least 12 characters with uppercase, lowercase, number, and
                  symbol.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Initial role</Label>
                <select
                  id="create-role"
                  className={selectClasses}
                  {...createForm.register("roleId")}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <FieldError
                  message={createForm.formState.errors.roleId?.message}
                />
              </div>
              <div className="space-y-3 rounded-xl border border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] p-4">
                <div>
                  <Label>Projects this user can see</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select initial project access. It can be changed later.
                  </p>
                </div>
                {assignableProjects.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {assignableProjects.map((project) => (
                      <label
                        key={project.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm transition-colors hover:border-[#d8d3ff]"
                      >
                        <input
                          type="checkbox"
                          value={project.id}
                          className="size-4 accent-[var(--orbit-purple)]"
                          {...createForm.register("projectIds")}
                        />
                        <span className="min-w-0">
                          <strong className="block truncate text-[0.75rem]">
                            {project.name}
                          </strong>
                          <span className="text-[0.6875rem] text-muted-foreground">
                            {project.code}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No member-visible projects are available. Administrator-only projects do not require membership.
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="create-membership-role">
                    Project membership role
                  </Label>
                  <select
                    id="create-membership-role"
                    className={selectClasses}
                    {...createForm.register("membershipRole")}
                  >
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="TECHNICAL_LEAD">Technical Lead</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
              </div>
              <FormMessage
                result={
                  results.create?.success
                    ? { ...results.create, message: "Account created." }
                    : results.create
                }
              />
              <Button disabled={isPending || roles.length === 0}>
                {isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <UserPlus />
                )}
                Create account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign system role</CardTitle>
            <CardDescription>
              Role grants are additive and immediately available to new
              sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={roleForm.handleSubmit((values) =>
                submit("role", assignRoleAction, values),
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="role-user">User</Label>
                <select
                  id="role-user"
                  className={selectClasses}
                  {...roleForm.register("userId")}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} — {user.email}
                    </option>
                  ))}
                </select>
                <FieldError message={roleForm.formState.errors.userId?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-role">Role</Label>
                <select
                  id="role-role"
                  className={selectClasses}
                  {...roleForm.register("roleId")}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <FieldError message={roleForm.formState.errors.roleId?.message} />
              </div>
              <FormMessage
                result={
                  results.role?.success
                    ? { ...results.role, message: "Role assigned." }
                    : results.role
                }
              />
              <Button disabled={isPending || !users.length || !roles.length}>
                <ShieldPlus />
                Assign role
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project membership</CardTitle>
            <CardDescription>
              Membership scopes otherwise-permitted actions to a project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!assignableProjects.length ? (
              <EmptyState
                icon={Users}
                title="No projects available"
                description="There are no member-visible projects. Administrator-only projects are intentionally excluded."
              />
            ) : (
              <form
                className="space-y-4"
                onSubmit={membershipForm.handleSubmit((values) =>
                  submit(
                    "membership",
                    setProjectMembershipAction,
                    values,
                  ),
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="membership-user">User</Label>
                  <select
                    id="membership-user"
                    className={selectClasses}
                    {...membershipForm.register("userId")}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    message={membershipForm.formState.errors.userId?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membership-project">Project</Label>
                  <select
                    id="membership-project"
                    className={selectClasses}
                    {...membershipForm.register("projectId")}
                  >
                    {assignableProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </select>
                  <FieldError
                    message={membershipForm.formState.errors.projectId?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membership-role">Membership role</Label>
                  <select
                    id="membership-role"
                    className={selectClasses}
                    {...membershipForm.register("membershipRole")}
                  >
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="TECHNICAL_LEAD">Technical Lead</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <FieldError
                    message={
                      membershipForm.formState.errors.membershipRole?.message
                    }
                  />
                </div>
                <FormMessage
                  result={
                    results.membership?.success
                      ? {
                          ...results.membership,
                          message: "Membership saved.",
                        }
                      : results.membership
                  }
                />
                <Button
                  disabled={
                    isPending || !users.length || !assignableProjects.length
                  }
                >
                  Save membership
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue temporary password</CardTitle>
            <CardDescription>
              Resets the password, revokes active sessions, and requires a
              first-login change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={resetForm.handleSubmit((values) =>
                submit(
                  "reset",
                  resetPasswordAction,
                  values,
                  () => resetForm.setValue("temporaryPassword", ""),
                ),
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="reset-user">User</Label>
                <select
                  id="reset-user"
                  className={selectClasses}
                  {...resetForm.register("userId")}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} — {user.email}
                    </option>
                  ))}
                </select>
                <FieldError
                  message={resetForm.formState.errors.userId?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-password">Temporary password</Label>
                <PasswordInput
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  {...resetForm.register("temporaryPassword")}
                />
                <FieldError
                  message={
                    resetForm.formState.errors.temporaryPassword?.message
                  }
                />
              </div>
              <FormMessage
                result={
                  results.reset?.success
                    ? {
                        ...results.reset,
                        message: "Temporary password issued.",
                      }
                    : results.reset
                }
              />
              <Button disabled={isPending || !users.length}>
                <KeyRound />
                Reset password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
