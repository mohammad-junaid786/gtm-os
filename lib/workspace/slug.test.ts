/**
 * Unit tests for lib/workspace/slug.ts
 *
 * Run with: npm test
 * Uses Node.js built-in test runner (node:test) — no additional dependencies.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeSlug, isValidSlug, slugFromName } from "./slug.js";

// ---------------------------------------------------------------------------
// normalizeSlug
// ---------------------------------------------------------------------------

describe("normalizeSlug", () => {
  test("lowercases input", () => {
    assert.equal(normalizeSlug("MyWorkspace"), "myworkspace");
  });

  test("replaces spaces with hyphens", () => {
    assert.equal(normalizeSlug("My Workspace"), "my-workspace");
  });

  test("collapses multiple spaces/hyphens", () => {
    assert.equal(normalizeSlug("My  Great  Workspace"), "my-great-workspace");
    assert.equal(normalizeSlug("my---workspace"), "my-workspace");
  });

  test("strips leading and trailing hyphens", () => {
    assert.equal(normalizeSlug("--my-workspace--"), "my-workspace");
  });

  test("replaces underscores with hyphens", () => {
    assert.equal(normalizeSlug("my_workspace"), "my-workspace");
  });

  test("replaces dots and slashes with hyphens", () => {
    assert.equal(normalizeSlug("my.workspace/v2"), "my-workspace-v2");
  });

  test("strips characters that are not alphanumeric or hyphen", () => {
    assert.equal(normalizeSlug("hello@world!"), "hello-world");
  });

  test("preserves numbers", () => {
    assert.equal(normalizeSlug("workspace 2025"), "workspace-2025");
  });

  test("truncates to 63 characters", () => {
    const long = "a".repeat(70);
    const result = normalizeSlug(long);
    assert.ok(result !== null);
    assert.equal(result!.length, 63);
  });

  test("returns null for empty string", () => {
    assert.equal(normalizeSlug(""), null);
  });

  test("returns null for string with only special characters", () => {
    assert.equal(normalizeSlug("!!!"), null);
    assert.equal(normalizeSlug("---"), null);
  });

  test("handles unicode by stripping non-ASCII non-alphanumeric", () => {
    // After lowercasing, non-ASCII goes through the strip step
    const result = normalizeSlug("café");
    // 'c', 'a', 'f' survive; 'é' is stripped leaving 'caf'
    assert.ok(result !== null);
    assert.ok(/^[a-z0-9-]+$/.test(result!));
  });
});

// ---------------------------------------------------------------------------
// isValidSlug
// ---------------------------------------------------------------------------

describe("isValidSlug", () => {
  test("accepts simple slug", () => {
    assert.ok(isValidSlug("my-workspace"));
  });

  test("accepts single character slug", () => {
    assert.ok(isValidSlug("a"));
    assert.ok(isValidSlug("9"));
  });

  test("accepts slug with numbers", () => {
    assert.ok(isValidSlug("workspace-2025"));
  });

  test("rejects empty string", () => {
    assert.ok(!isValidSlug(""));
  });

  test("rejects slug with leading hyphen", () => {
    assert.ok(!isValidSlug("-my-workspace"));
  });

  test("rejects slug with trailing hyphen", () => {
    assert.ok(!isValidSlug("my-workspace-"));
  });

  test("rejects slug with uppercase letters", () => {
    assert.ok(!isValidSlug("My-Workspace"));
  });

  test("rejects slug with spaces", () => {
    assert.ok(!isValidSlug("my workspace"));
  });

  test("rejects slug longer than 63 characters", () => {
    assert.ok(!isValidSlug("a".repeat(64)));
  });

  test("accepts slug of exactly 63 characters", () => {
    assert.ok(isValidSlug("a".repeat(63)));
  });
});

// ---------------------------------------------------------------------------
// slugFromName
// ---------------------------------------------------------------------------

describe("slugFromName", () => {
  test("derives slug from simple name", () => {
    assert.equal(slugFromName("My Workspace"), "my-workspace");
  });

  test("derives slug from name with special chars", () => {
    assert.equal(slugFromName("Sales & Marketing"), "sales-marketing");
  });

  test("throws for name that produces no slug", () => {
    assert.throws(
      () => slugFromName("!!!"),
      (err: Error) => {
        assert.ok(err.message.includes("Cannot derive a slug"));
        return true;
      },
    );
  });

  test("throws for empty name", () => {
    assert.throws(() => slugFromName(""));
  });

  test("produces slug no longer than 63 characters even for long names", () => {
    const result = slugFromName("A".repeat(200));
    assert.ok(result.length <= 63);
  });
});
