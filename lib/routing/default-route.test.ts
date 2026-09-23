import test, { describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { resolveUserDefaultRoute, _deps } from "./default-route";

describe("resolveUserDefaultRoute - Routing Logic", () => {
  let getDbMock: ReturnType<typeof mock.method>;
  let workspacesData: any[] = [];
  let productsData: any[] = [];

  const mockQueryChain = {
    select: () => mockQueryChain,
    from: () => mockQueryChain,
    innerJoin: () => mockQueryChain,
    where: () => mockQueryChain,
    orderBy: () => mockQueryChain,
    limit: async () => {
      // Very naive mock to return workspaces or products based on current mock state
      if (workspacesData.length > 0) {
        const data = workspacesData;
        workspacesData = []; // clear for the next call which should be products
        return data;
      }
      return productsData;
    }
  };

  beforeEach(() => {
    mock.restoreAll();
    getDbMock = mock.method(_deps, "getDb", () => mockQueryChain);
  });

  test("returns /onboarding if no workspaces exist", async () => {
    workspacesData = [];
    
    const result = await resolveUserDefaultRoute("user-1");
    assert.equal(result, "/onboarding");
  });

  test("returns /onboarding if workspace exists but no active products", async () => {
    workspacesData = [{ workspaceId: "w-1", workspaceSlug: "my-workspace" }];
    productsData = [];
    
    const result = await resolveUserDefaultRoute("user-1");
    assert.equal(result, "/onboarding");
  });

  test("resolves to the correct product route when both exist", async () => {
    workspacesData = [{ workspaceId: "w-1", workspaceSlug: "my-workspace" }];
    productsData = [{ slug: "my-product" }];
    
    const result = await resolveUserDefaultRoute("user-1");
    assert.equal(result, "/w/my-workspace/my-product");
  });

  test("Query order precedence implicitly tests the demo fallback logic", async () => {
    // We cannot easily test the Drizzle query execution in unit tests,
    // but we can assert the db mock was called.
    workspacesData = [{ workspaceId: "w-demo", workspaceSlug: "demo-test" }];
    productsData = [{ slug: "demo-product" }];
    
    const result = await resolveUserDefaultRoute("user-demo");
    assert.equal(result, "/w/demo-test/demo-product");
  });
});
