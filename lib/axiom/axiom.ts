import { Axiom } from "@axiomhq/js";

const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN!,
});

export const axiomQueryClient = new Axiom({
  token: process.env.AXIOM_QUERY_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
});

export default axiomClient;
