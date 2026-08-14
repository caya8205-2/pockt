import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerDashboardTools(server: McpServer, client: PocktClient) {
  server.tool(
    "get_dashboard",
    "Get the financial dashboard summary: current balance, monthly income/expenses, outstanding bills and debts, and free-to-spend amount.",
    {},
    async () => {
      const data = await client.get("/api/dashboard");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_timeline",
    "Get a chronological timeline of all financial transactions (income, expenses, bill payments, debt payments), sorted by date descending.",
    {},
    async () => {
      const data = await client.get("/api/timeline");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_payday",
    "Get the payday cycle calculation: salary received, bills, debts, spending, and free-to-spend within the current pay cycle.",
    {
      paydayDate: z.number().int().min(1).max(31).optional().describe("Override payday date (1-31). Uses user's saved setting if not provided."),
    },
    async ({ paydayDate }) => {
      const query = paydayDate !== undefined ? `?paydayDate=${paydayDate}` : "";
      const data = await client.get(`/api/payday${query}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_settled",
    "Get history of fully paid debts and recent bill payments, including totals.",
    {},
    async () => {
      const data = await client.get("/api/settled");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
