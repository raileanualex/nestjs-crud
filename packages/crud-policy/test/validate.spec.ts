import { PolicyActions } from "../src";
import { validatePolicyWildcard, validatePolicies } from "../src/utils/validate";

describe("validatePolicies", () => {
  it("should validate on top-level policies", () => {
    expect(validatePolicies([{
      name: "company",
      action: PolicyActions.Manage,
    }], ["company:m"])).toBe(true);
    expect(validatePolicies([{
      name: "user",
      action: PolicyActions.Read,
    }], ["user:r"])).toBe(true);
    expect(validatePolicies([{
      name: "company",
      action: PolicyActions.Write,
    }], ["company:w"])).toBe(true);
  });

  it("should validate on sub policies", () => {
    expect(validatePolicies([{
      name: "company.feed",
      action: PolicyActions.Write,
    }], ["company:m"])).toBe(true);
    expect(validatePolicies([{
      name: "company.feed",
      action: PolicyActions.Write,
    }], ["user:w"])).toBe(false);
    expect(validatePolicies([{
      name: "company.contact",
      action: PolicyActions.Write,
    }], ["company.contact:w"])).toBe(true);
    expect(validatePolicies([{
      name: "company.contact",
      action: PolicyActions.Write,
    }], ["company.contact:r"])).toBe(false);
    expect(validatePolicies([{
      name: "company.contact",
      action: PolicyActions.Write,
    }], ["company.contact:m"])).toBe(true);
  });

  it("should validate on entity policies", () => {
    expect(validatePolicies([{
      name: "user",
      action: PolicyActions.Manage,
    }], ["user:m"], 1)).toBe(true);
    expect(validatePolicies([{
      name: "user",
      action: PolicyActions.Write,
    }], ["user:w"], 1)).toBe(true);
    expect(validatePolicies([{
      name: "user",
      action: PolicyActions.Read,
    }], ["user:r:1"], 1)).toBe(true);
    expect(validatePolicies([{
      name: "user",
      action: PolicyActions.Manage,
    }], ["user:m:1"], 2)).toBe(false);
  });

  it("should validate if you are another user but have policies to someone else", () => {
    expect(
      validatePolicies([{
        name: "user",
        action: PolicyActions.Read,
      }], ["user:r:1", "user:r:2"], "2"),
    ).toBe(true);
  });
});

describe("validatePolicyWildcard", () => {
  describe("top-level policies", () => {
    it("should validate a user has top-level manage entity policies applied", () => {
      expect(
        validatePolicyWildcard(
          ["company:m"],
          "company",
          PolicyActions.Manage,
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["company:m"],
          "company",
          PolicyActions.Write,
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["company:m"],
          "company",
          PolicyActions.Read,
        ),
      ).toBe(true);
    });

    it("should validate a user has top-level write entity policies applied", () => {
      expect(
        validatePolicyWildcard(
          ["company:w"],
          "company",
          PolicyActions.Manage,
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["company:w"],
          "company",
          PolicyActions.Write,
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["company:w"],
          "company",
          PolicyActions.Read,
        ),
      ).toBe(true);
    });

    it("should validate a user has top-level read entity policies applied", () => {
      expect(
        validatePolicyWildcard(
          ["company:r"],
          "company",
          PolicyActions.Manage,
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["company:r"],
          "company",
          PolicyActions.Write,
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["company:r"],
          "company",
          PolicyActions.Read,
        ),
      ).toBe(true);
    });
  });

  describe("sub-level policies", () => {
    it("should return true if a user with wild card manage policies has applied", () => {
      expect(
        validatePolicyWildcard(
          ["company.feed:m"],
          "company.feed",
          PolicyActions.Manage,
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["company.feed:m"],
          "company.feed",
          PolicyActions.Write,
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["company.feed:m"],
          "company.feed",
          PolicyActions.Read,
        ),
      ).toBe(true);
    });

    it("should validate wild card manage policies for write rights", () => {
      expect(
        validatePolicyWildcard(
          ["company.feed:w"],
          "company.feed",
          PolicyActions.Manage,
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["company.feed:w"],
          "company.feed",
          PolicyActions.Write,
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["company.feed:w"],
          "company.feed",
          PolicyActions.Read,
        ),
      ).toBe(true);
    });

    it("should validate wild card manage policies for read rights", () => {
      expect(
        validatePolicyWildcard(
          ["company.feed:r"],
          "company.feed",
          PolicyActions.Manage,
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["company.feed:r"],
          "company.feed",
          PolicyActions.Write,
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["company.feed:r"],
          "company.feed",
          PolicyActions.Read,
        ),
      ).toBe(true);
    });
  });

  describe("user-bound policies", () => {
    it("should return true if a user has manage entity policies applied", () => {
      expect(
        validatePolicyWildcard(
          ["user:m:1"],
          "user",
          PolicyActions.Manage,
          1
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["user:m:1"],
          "user",
          PolicyActions.Write,
          1
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["user:m:1"],
          "user",
          PolicyActions.Read,
          1
        ),
      ).toBe(true);
    });

    it("should validate a user has write entity policies applied", () => {
      expect(
        validatePolicyWildcard(
          ["user:w:1"],
          "user",
          PolicyActions.Manage,
          1
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["user:w:1"],
          "user",
          PolicyActions.Write,
          1
        ),
      ).toBe(true);
      expect(
        validatePolicyWildcard(
          ["user:w:1"],
          "user",
          PolicyActions.Read,
          1
        ),
      ).toBe(true);
    });

    it("should validate a user has read entity policies applied", () => {
      expect(
        validatePolicyWildcard(
          ["user:r:1"],
          "user",
          PolicyActions.Manage,
          1
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["user:r:1"],
          "user",
          PolicyActions.Write,
          1
        ),
      ).toBe(false);
      expect(
        validatePolicyWildcard(
          ["user:r:1"],
          "user",
          PolicyActions.Read,
          1
        ),
      ).toBe(true);
    });
  });
});
