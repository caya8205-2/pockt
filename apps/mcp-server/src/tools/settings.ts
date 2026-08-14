import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerSettingsTools(server: McpServer, client: PocktClient) {
  server.tool(
    "update_settings",
    "Update user settings. Currently supports changing the payday date (day of month when salary is received).",
    {
      paydayDate: z.number().int().min(1).max(31).describe("Payday date (day of month, 1-31)"),
    },
    async (args) => {
      const data = await client.put("/api/user/settings", args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
