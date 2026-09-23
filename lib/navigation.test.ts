import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { isNavItemActive } from "./navigation";

describe("isNavItemActive", () => {
  const productRoot = "/w/demo-workspace/demo-product";

  it("activates Overview only on exact product root", () => {
    assert.equal(isNavItemActive(productRoot, productRoot), true);
    assert.equal(isNavItemActive(`${productRoot}/strategy/icp`, productRoot), false);
    assert.equal(isNavItemActive(`${productRoot}/analytics`, productRoot), false);
  });

  it("activates ICP only on ICP route", () => {
    const icpHref = `${productRoot}/strategy/icp`;
    assert.equal(isNavItemActive(icpHref, icpHref), true);
    assert.equal(isNavItemActive(`${icpHref}/new`, icpHref), true);
    assert.equal(isNavItemActive(productRoot, icpHref), false);
  });

  it("activates Personas only on Personas route", () => {
    const personasHref = `${productRoot}/strategy/personas`;
    assert.equal(isNavItemActive(personasHref, personasHref), true);
    assert.equal(isNavItemActive(`${personasHref}/edit`, personasHref), true);
    assert.equal(isNavItemActive(productRoot, personasHref), false);
  });

  it("activates Positioning only on Positioning route", () => {
    const posHref = `${productRoot}/strategy/positioning`;
    assert.equal(isNavItemActive(posHref, posHref), true);
    assert.equal(isNavItemActive(productRoot, posHref), false);
  });

  it("activates Competitors only on Competitors route", () => {
    const compHref = `${productRoot}/strategy/competitors`;
    assert.equal(isNavItemActive(compHref, compHref), true);
    assert.equal(isNavItemActive(productRoot, compHref), false);
  });

  it("activates Research only on Research route", () => {
    const resHref = `${productRoot}/research`;
    assert.equal(isNavItemActive(resHref, resHref), true);
    assert.equal(isNavItemActive(productRoot, resHref), false);
  });

  it("activates Leads only on Leads route", () => {
    const leadsHref = `${productRoot}/execution/leads`;
    assert.equal(isNavItemActive(leadsHref, leadsHref), true);
    assert.equal(isNavItemActive(productRoot, leadsHref), false);
  });

  it("activates Campaigns only on Campaigns route", () => {
    const campHref = `${productRoot}/execution/campaigns`;
    assert.equal(isNavItemActive(campHref, campHref), true);
    assert.equal(isNavItemActive(productRoot, campHref), false);
  });

  it("activates Experiments only on Experiments route", () => {
    const expHref = `${productRoot}/execution/experiments`;
    assert.equal(isNavItemActive(expHref, expHref), true);
    assert.equal(isNavItemActive(productRoot, expHref), false);
  });

  it("activates Analytics only on Analytics route", () => {
    const analyticsHref = `${productRoot}/analytics`;
    assert.equal(isNavItemActive(analyticsHref, analyticsHref), true);
    assert.equal(isNavItemActive(productRoot, analyticsHref), false);
  });

  it("activates Learnings only on Learnings route", () => {
    const learningsHref = `${productRoot}/learnings`;
    assert.equal(isNavItemActive(learningsHref, learningsHref), true);
    assert.equal(isNavItemActive(productRoot, learningsHref), false);
  });

  it("activates Settings only on Settings route", () => {
    assert.equal(isNavItemActive("/settings", "/settings"), true);
    assert.equal(isNavItemActive("/settings/profile", "/settings"), true);
    assert.equal(isNavItemActive(productRoot, "/settings"), false);
  });

  it("activates Root (/) only on exact match", () => {
    assert.equal(isNavItemActive("/", "/"), true);
    assert.equal(isNavItemActive("/settings", "/"), false);
    assert.equal(isNavItemActive(productRoot, "/"), false);
  });
});
