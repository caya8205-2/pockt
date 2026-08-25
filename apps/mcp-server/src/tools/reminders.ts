import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerReminderTools(server: McpServer, client: PocktClient) {
  server.tool(
    "get_upcoming_reminders",
    "Get all unpaid bills and debts due within the next N days (default 3 days: H-3 to H-1, today, and recent overdue items). Returns items formatted with remaining amounts, due dates, and countdown text ('Hari ini!', 'Besok', '2 hari lagi'). If totalCount is 0, nothing is due soon.",
    {
      daysAhead: z.number().int().min(0).max(30).optional().describe("Number of days ahead to look for due items (default: 3)"),
    },
    async (args) => {
      const days = args?.daysAhead ?? 3;
      const data = await client.get(`/api/reminders/upcoming?days=${days}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
