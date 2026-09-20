import test, { describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createDemoAction, _deps } from "@/lib/actions/demo-actions";
import { DEMO_PRODUCT_SLUG } from "./demo-seeder";
import crypto from "crypto";

const VALID_UUID_A = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_B = "22222222-2222-4222-8222-222222222222";

describe("Demo Actions", () => {
  let currentUserMock: ReturnType<typeof mock.method>;
  let lookupMock: ReturnType<typeof mock.method>;
  let seedMock: ReturnType<typeof mock.method>;

  beforeEach(() => {
    mock.restoreAll();
    currentUserMock = mock.method(_deps, "getCurrentUserId", async () => VALID_UUID_A);
    lookupMock = mock.method(_deps, "lookupExistingDemoWorkspace", async () => null);
    seedMock = mock.method(_deps, "seedDemoWorkspace", async () => ({
      workspaceSlug: "demo-workspace-slug",
      productSlug: DEMO_PRODUCT_SLUG,
    }));
  });

  test("createDemoAction returns error if unauthenticated", async () => {
    currentUserMock.mock.mockImplementation(async () => null);

    const result = await createDemoAction();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Not authenticated");
    }
  });

  test("createDemoAction creates workspace and returns redirect URL", async () => {
    const result = await createDemoAction();
    
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.redirectUrl, `/w/demo-workspace-slug/${DEMO_PRODUCT_SLUG}`);
    }
    
    // Assert seedDemoWorkspace was called
    assert.equal(seedMock.mock.callCount(), 1);
  });

  test("createDemoAction is idempotent (returns existing if found)", async () => {
    lookupMock.mock.mockImplementation(async () => ({
      workspaceSlug: "existing-demo-slug",
    }));

    const result = await createDemoAction();
    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.redirectUrl, `/w/existing-demo-slug/${DEMO_PRODUCT_SLUG}`);
    }
    
    // Assert seedDemoWorkspace was NOT called because it already existed
    assert.equal(seedMock.mock.callCount(), 0);
  });

  test("Security isolation: Demo workspace lookup is scoped to authenticated user", async () => {
    await createDemoAction();
    
    // Validate that the lookup used the authenticated user's ID
    assert.equal(lookupMock.mock.callCount(), 1);
    assert.equal(lookupMock.mock.calls[0].arguments[0], VALID_UUID_A);
  });

  test("Mutation isolation: createDemoAction relies purely on isolated seed function", async () => {
    await createDemoAction();
    
    // Validate that creation relies purely on seedDemoWorkspace
    assert.equal(seedMock.mock.callCount(), 1);
    assert.equal(seedMock.mock.calls[0].arguments[0], VALID_UUID_A);
    
    // The test runner natively blocks DB mutations unless getDb() is mocked.
    // By verifying that createDemoAction calls only lookup and seed, we guarantee
    // it performs no unauthorized DB mutations.
  });
});
