import { describe, expect, it } from "vitest";
import { createPilotTeamSchema, pilotSignOffSchema } from "@/lib/pilot/pilot.schemas";

describe("Pilot validation", () => {
  it("prevents duplicate Pilot users in a team", () => {
    const id = "3d594650-3436-4caa-a832-5c53a913b072";
    expect(createPilotTeamSchema.safeParse({
      projectId: id,
      name: "Inbound",
      description: "",
      leadUserId: "",
      memberIds: [id, id],
    }).success).toBe(false);
  });

  it("requires evidence notes for every sign-off approval or rejection", () => {
    expect(pilotSignOffSchema.safeParse({
      projectId: "3d594650-3436-4caa-a832-5c53a913b072",
      signOff: "BUSINESS",
      outcome: "REJECTED",
      notes: "",
    }).success).toBe(false);
  });
});
