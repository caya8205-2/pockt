import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PocktClient } from "../client.js";

export function registerAuthTools(server: McpServer, client: PocktClient) {
  server.tool(
    "login",
    "Login to Pockt. Usually not needed as the server auto-authenticates on first request, but useful for manually refreshing the session if needed.",
    {},
    async () => {
      const result = await client.login();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
