import { authorizeProductAction } from "@/lib/routing/authorize-action";
import { generateText } from "./service";

export const _deps = {
  authorizeProductAction,
  generateText,
  getIcpById: async (productId: string, icpId: string) => {
    const { getIcpById } = await import("@/lib/icp/service");
    return getIcpById(productId, icpId);
  },
  getPersonaContext: async (productId: string, personaId: string) => {
    const { getDb } = await import("@/db");
    const { personas, icps } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    
    const [personaRecord] = await db
      .select({ persona: personas })
      .from(personas)
      .innerJoin(icps, eq(personas.icp_id, icps.id))
      .where(
        and(
          eq(personas.id, personaId),
          eq(icps.product_id, productId)
        )
      )
      .limit(1);
    
    return personaRecord?.persona;
  }
};
