import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PocktClient } from "./client.js";
import { registerAuthTools } from "./tools/auth.js";
import { registerDashboardTools } from "./tools/dashboard.js";
import { registerIncomeTools } from "./tools/incomes.js";
import { registerExpenseTools } from "./tools/expenses.js";
import { registerBillTools } from "./tools/bills.js";
import { registerDebtTools } from "./tools/debts.js";
import { registerSettingsTools } from "./tools/settings.js";
import { registerBackupTools } from "./tools/backup.js";

const apiUrl = process.env.POCKT_API_URL || "http://localhost:3001";
const username = process.env.POCKT_USERNAME || "";
const password = process.env.POCKT_PASSWORD || "";

if (!username || !password) {
  console.error("Error: POCKT_USERNAME and POCKT_PASSWORD environment variables are required.");
  process.exit(1);
}

const client = new PocktClient(apiUrl, username, password);

const server = new McpServer({
  name: "pockt",
  version: "1.0.0",
});

registerAuthTools(server, client);
registerDashboardTools(server, client);
registerIncomeTools(server, client);
registerExpenseTools(server, client);
registerBillTools(server, client);
registerDebtTools(server, client);
registerSettingsTools(server, client);
registerBackupTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
