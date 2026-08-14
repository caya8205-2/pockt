import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PocktClient } from "../client.js";

export function registerBackupTools(server: McpServer, client: PocktClient) {
  server.tool(
    "export_csv",
    "Export all income and expense data as CSV format. Returns the raw CSV text.",
    {},
    async () => {
      const csvData = await client.get("/api/export/csv");
      return {
        content: [{
          type: "text" as const,
          text: typeof csvData === "string" ? csvData : JSON.stringify(csvData),
        }],
      };
    }
  );
}
