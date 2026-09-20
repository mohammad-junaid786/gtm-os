import "server-only";

import { getDb } from "@/db";
import {
  workspaces,
  workspaceMembers,
  products,
  icps,
  personas,
  positioning,
  competitors,
  researchItems,
  leads,
  campaigns,
  experiments,
  learnings,
} from "@/db/schema";
import crypto from "crypto";
import { normalizeSlug } from "@/lib/workspace/slug";

export const DEMO_WORKSPACE_NAME = "Acme Corp (Demo)";
export const DEMO_PRODUCT_NAME = "Acme SaaS";
export const DEMO_PRODUCT_SLUG = "acme-saas";

/**
 * Seeds a comprehensive, realistic demo dataset inside a new isolated workspace.
 * Uses a single transaction to ensure complete rollback on any failure.
 */
export async function seedDemoWorkspace(userId: string): Promise<{ workspaceSlug: string; productSlug: string }> {
  const db = getDb();
  // Safe, deterministic slug (or pseudo-random if truncations are identical)
  const demoWorkspaceSlug = normalizeSlug(`demo-${userId.substring(0, 8)}-${crypto.randomBytes(4).toString("hex")}`) as string;

  return await db.transaction(async (tx) => {
    // 1. Create Workspace
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: DEMO_WORKSPACE_NAME,
        slug: demoWorkspaceSlug,
      })
      .returning();

    // 2. Add User as Owner
    await tx.insert(workspaceMembers).values({
      workspace_id: workspace.id,
      user_id: userId,
      role: "owner",
    });

    // 3. Create Product
    const [product] = await tx
      .insert(products)
      .values({
        workspace_id: workspace.id,
        name: DEMO_PRODUCT_NAME,
        slug: DEMO_PRODUCT_SLUG,
      })
      .returning();

    const productId = product.id;

    // 4. Create ICP
    const [icp] = await tx
      .insert(icps)
      .values({
        product_id: productId,
        name: "Enterprise IT Directors",
        description: "IT leaders at mid-to-large enterprises tasked with securing hybrid environments.",
        industry: "Technology & Finance",
        company_size: "500-5000",
        geography: "North America & EMEA",
        business_model: "b2b",
        pain_points: [
          "Security tool sprawl",
          "High compliance and audit costs",
          "Lack of unified visibility across cloud environments",
        ],
        goals: [
          "Consolidate security stack",
          "Pass SOC2 and ISO27001 audits easily",
          "Reduce mean-time-to-resolution (MTTR)",
        ],
        buying_signals: [
          "Recent funding round or M&A activity",
          "Hiring for DevSecOps roles",
          "Upcoming compliance audit (SOC2/ISO)",
        ],
        disqualifiers: [
          "Less than 100 employees",
          "Fully on-premise infrastructure",
        ],
      })
      .returning();

    const icpId = icp.id;

    // 5. Create Personas
    await tx.insert(personas).values([
      {
        icp_id: icpId,
        name: "Security Sam",
        role: "Chief Information Security Officer (CISO)",
        goals: ["Zero breaches", "Reduce vendor count", "Ensure regulatory compliance"],
        pain_points: ["Too many alerts and false positives", "Hard to prove ROI to the board"],
        motivations: ["Risk mitigation", "Operational efficiency"],
        objections: ["Migration takes too long", "We already use LegacySec"],
        decision_criteria: ["Time to value", "Integration with existing stack", "Compliance reporting"],
        preferred_channels: ["Industry conferences", "Peer networks", "Direct email"],
        messaging_angles: ["Consolidate and save", "Unify your cloud security posture"],
      },
      {
        icp_id: icpId,
        name: "DevSecOps Diana",
        role: "Lead Security Engineer",
        goals: ["Automate security checks in CI/CD", "Reduce manual audits"],
        pain_points: ["Constantly fixing misconfigurations", "Context switching between tools"],
        motivations: ["Making developers' lives easier", "Automation"],
        objections: ["Requires too much configuration", "Will it break our pipelines?"],
        decision_criteria: ["API-first", "Developer experience", "Accuracy of findings"],
        preferred_channels: ["GitHub", "Reddit", "Technical webinars"],
        messaging_angles: ["Shift left seamlessly", "Security that developers love"],
      },
    ]);

    // 6. Create Positioning
    await tx.insert(positioning).values({
      product_id: productId,
      positioning_statement: "Acme SaaS is the only unified cloud security platform that eliminates tool sprawl for Enterprise IT by consolidating posture management and threat detection into a single pane of glass.",
      target_customer: "Mid-to-large enterprise CISOs and Security Engineering leads.",
      customer_problem: "Security teams are drowning in alerts from disjointed tools, leading to alert fatigue, high costs, and missed threats.",
      unique_value: "A single, correlated view of risk across AWS, Azure, and GCP that reduces alert volume by 80% and accelerates remediation.",
      alternatives: ["LegacySec", "StartupSec", "Native cloud provider tools"],
      proof_points: ["Trusted by 50+ Fortune 500s", "Reduces MTTR by 4x", "Out-of-the-box SOC2 mapping"],
    });

    // 7. Create Competitors
    const competitorRows = await tx
      .insert(competitors)
      .values([
        {
          product_id: productId,
          name: "LegacySec",
          name_normalized: "legacysec",
          website: "https://legacysec.example.com",
          category: "Direct",
          description: "The old incumbent. Highly trusted by traditional enterprises but very complex.",
          strengths: ["Brand trust", "Extensive feature set", "Global presence"],
          weaknesses: ["Clunky UI", "Expensive", "Requires professional services"],
          differentiators: ["Cloud-native architecture", "Self-service onboarding"],
          pricing_notes: "Starts at $150k/yr, usually discounted heavily at end of quarter.",
        },
        {
          product_id: productId,
          name: "StartupSec",
          name_normalized: "startupsec",
          website: "https://startupsec.example.com",
          category: "Indirect",
          description: "A well-funded startup focused heavily on developer experience.",
          strengths: ["Modern UI", "Great CLI", "Strong community"],
          weaknesses: ["Missing SOC2 reporting", "Lacks enterprise RBAC", "Limited integrations"],
          differentiators: ["Enterprise readiness", "Advanced compliance reporting"],
          pricing_notes: "Product-led growth, starts free, jumps to $50k/yr for enterprise tier.",
        },
        {
          product_id: productId,
          name: "NativeCloud Guard",
          name_normalized: "nativecloud guard",
          category: "Substitute",
          description: "The built-in security tools provided by AWS/Azure/GCP.",
          strengths: ["Free or very cheap", "Enabled by default", "Zero deployment friction"],
          weaknesses: ["Only works for one cloud", "Basic rulesets", "Hard to correlate"],
          differentiators: ["Multi-cloud visibility", "Advanced threat intelligence"],
        },
      ])
      .returning();

    const legacySecId = competitorRows[0].id;
    const startupSecId = competitorRows[1].id;

    // 8. Create Research
    await tx.insert(researchItems).values([
      {
        product_id: productId,
        competitor_id: legacySecId,
        title: "CISO Q3 Interview Notes",
        type: "interview",
        source_name: "Customer Discovery Call",
        content: "The CISO mentioned that their LegacySec renewal is coming up in Q4 and they are extremely unhappy with the 30% price hike. They want a simpler tool.",
        date_researched: "2026-08-15",
      },
      {
        product_id: productId,
        competitor_id: startupSecId,
        title: "StartupSec Series A Deck Leak",
        type: "competitor_analysis",
        source_name: "Industry Forum",
        content: "Their pitch deck indicates they are pivoting hard to SMBs and will not be building enterprise RBAC anytime soon. This is a huge opportunity for us.",
        date_researched: "2026-09-01",
      },
      {
        product_id: productId,
        title: "Gartner 2026 Market Guide",
        type: "report",
        source_name: "Gartner",
        content: "The market is rapidly shifting towards consolidated platforms. Point solutions are seeing heavy churn.",
        date_researched: "2026-09-10",
      },
    ]);

    // 9. Create Leads
    await tx.insert(leads).values([
      {
        product_id: productId,
        company: "Globex Corporation",
        contact: "Hank Scorpio",
        role: "CISO",
        email: "hank@globex.example",
        website: "globex.example",
        source: "Q4 Webinar",
        icp_score: 95,
        status: "qualified",
        owner: "Sales",
        notes: "Very interested in our compliance reporting.",
      },
      {
        product_id: productId,
        company: "Initech",
        contact: "Bill Lumbergh",
        role: "VP of Engineering",
        email: "bill@initech.example",
        website: "initech.example",
        source: "LinkedIn Ads",
        icp_score: 60,
        status: "new",
        owner: "Marketing",
        notes: "Just downloaded the whitepaper. Needs nurture.",
      },
      {
        product_id: productId,
        company: "Soylent Corp",
        contact: "Bob",
        role: "Security Director",
        email: "bob@soylent.example",
        source: "Outbound",
        icp_score: 85,
        status: "closed_won",
        owner: "Sales",
        notes: "Signed a 2-year deal.",
      },
      {
        product_id: productId,
        company: "Massive Dynamic",
        contact: "Nina Sharp",
        role: "CTO",
        email: "nina@massive.example",
        source: "Referral",
        icp_score: 99,
        status: "engaged",
        owner: "Sales",
        notes: "Evaluating us vs LegacySec.",
      },
      {
        product_id: productId,
        company: "Hooli",
        contact: "Gavin Belson",
        role: "CEO",
        email: "gavin@hooli.example",
        source: "Organic Search",
        icp_score: 40,
        status: "unqualified",
        owner: "Marketing",
        notes: "Too small, just fishing for ideas.",
      },
      {
        product_id: productId,
        company: "Pied Piper",
        contact: "Richard Hendricks",
        role: "CEO",
        email: "richard@piedpiper.example",
        source: "Event",
        icp_score: 75,
        status: "new",
        owner: "Sales",
      },
      {
        product_id: productId,
        company: "Dunder Mifflin",
        contact: "David Wallace",
        role: "CFO",
        email: "david@dunder.example",
        source: "Outbound",
        icp_score: 80,
        status: "qualified",
        owner: "Sales",
      },
      {
        product_id: productId,
        company: "Stark Industries",
        contact: "Pepper Potts",
        role: "CEO",
        source: "Event",
        icp_score: 100,
        status: "engaged",
        owner: "Sales",
      },
    ]);

    // 10. Create Campaigns
    await tx.insert(campaigns).values([
      {
        product_id: productId,
        name: "Q4 CISO Webinar",
        objective: "Lead Generation",
        audience: "CISOs in NA",
        channel: "Webinar",
        budget: 500000, // $5,000
        spend: 450000, // $4,500
        status: "completed",
        impressions: 15000,
        clicks: 800,
        leads_generated: 200,
        qualified_leads: 50,
        conversions: 5,
        revenue: 5000000, // $50,000
        start_date: new Date("2026-08-01"),
        end_date: new Date("2026-08-31"),
      },
      {
        product_id: productId,
        name: "LinkedIn Retargeting",
        objective: "Nurture",
        audience: "Website Visitors",
        channel: "Paid Social",
        budget: 200000, // $2,000
        spend: 150000, // $1,500
        status: "active",
        impressions: 45000,
        clicks: 350,
        leads_generated: 15,
        qualified_leads: 5,
        conversions: 1,
        revenue: 1000000, // $10,000
        start_date: new Date("2026-09-01"),
      },
      {
        product_id: productId,
        name: "Cold Email Q3",
        objective: "Pipeline Generation",
        audience: "IT Directors",
        channel: "Email",
        budget: 50000, // $500
        spend: 50000, // $500
        status: "completed",
        impressions: 5000,
        clicks: 120,
        leads_generated: 8,
        qualified_leads: 2,
        conversions: 0,
        revenue: 0,
        start_date: new Date("2026-07-01"),
        end_date: new Date("2026-07-31"),
      },
    ]);

    // 11. Create Experiments
    await tx.insert(experiments).values([
      {
        product_id: productId,
        name: "Pricing Page Simplification",
        hypothesis: "Removing the enterprise tier pricing and replacing it with 'Contact Us' will increase qualified inbound leads.",
        goal: "Increase qualified leads",
        audience: "All pricing page visitors",
        channel: "Website",
        variant: "Removed Tier 3 pricing",
        primary_metric: "Lead Form Submissions",
        secondary_metrics: ["Bounce Rate", "Time on Page"],
        budget: 0,
        status: "active",
        start_date: new Date("2026-09-15"),
      },
      {
        product_id: productId,
        name: "Webinar Title A/B Test",
        hypothesis: "A threat-focused title will drive more signups than a compliance-focused title.",
        goal: "Increase CTR",
        audience: "Email list",
        channel: "Email",
        variant: "Subject line variant",
        primary_metric: "Click-Through Rate",
        secondary_metrics: ["Open Rate"],
        budget: 0,
        status: "completed",
        start_date: new Date("2026-08-01"),
        end_date: new Date("2026-08-05"),
      },
    ]);

    // 12. Create Learnings
    await tx.insert(learnings).values([
      {
        product_id: productId,
        title: "Webinars outperform Ads for CISOs",
        insight: "CISOs respond much better to deep-dive technical content than to display ads. Our Q4 webinar had a 10x better ROI than LinkedIn ads.",
        source_type: "Campaign",
        confidence_level: "High",
        impact_level: "High",
        action_items: ["Double the webinar budget for Q1", "Pause display ads targeting C-level"],
      },
      {
        product_id: productId,
        title: "StartupSec lacks SOC2",
        insight: "We consistently win deals against StartupSec when compliance is a primary decision criteria.",
        source_type: "Research",
        confidence_level: "High",
        impact_level: "Medium",
        action_items: ["Create a comparison one-pager highlighting our compliance features"],
      },
      {
        product_id: productId,
        title: "Threat-focused messaging wins",
        insight: "Our A/B test showed a 30% higher CTR when leading with threat-detection benefits rather than compliance benefits.",
        source_type: "Experiment",
        confidence_level: "Medium",
        impact_level: "Medium",
        action_items: ["Update homepage H1"],
      },
      {
        product_id: productId,
        title: "LegacySec renewals are a major trigger",
        insight: "A huge chunk of our pipeline comes from customers unhappy with LegacySec's price hikes.",
        source_type: "Customer Call",
        confidence_level: "High",
        impact_level: "High",
        action_items: ["Launch a targeted takeout campaign for LegacySec customers"],
      },
    ]);

    return { workspaceSlug: demoWorkspaceSlug, productSlug: DEMO_PRODUCT_SLUG };
  });
}
