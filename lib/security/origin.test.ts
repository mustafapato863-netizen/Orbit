import { describe, expect, it } from "vitest";

import { hasTrustedMutationOrigin } from "@/lib/security/origin";

describe("mutation Origin validation", () => {
  it("accepts same-origin and non-browser requests", () => {
    expect(
      hasTrustedMutationOrigin(
        new Request("https://orbit.example/api/report", {
          method: "POST",
          headers: { origin: "https://orbit.example" },
        }),
      ),
    ).toBe(true);
    expect(
      hasTrustedMutationOrigin(
        new Request("https://orbit.example/api/report", { method: "POST" }),
      ),
    ).toBe(true);
  });

  it("rejects malformed and cross-origin browser requests", () => {
    expect(
      hasTrustedMutationOrigin(
        new Request("https://orbit.example/api/report", {
          method: "POST",
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
    expect(
      hasTrustedMutationOrigin(
        new Request("https://orbit.example/api/report", {
          method: "POST",
          headers: { origin: "not-a-url" },
        }),
      ),
    ).toBe(false);
  });
});
