import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerIncomeTools(server: McpServer, client: PocktClient) {
  server.tool(
    "list_incomes",
    "List all income records, sorted by date descending.",
    {},
    async () => {
      const data = await client.get("/api/incomes");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_income",
    "Record a new income entry (salary, freelance, bonus, refund, etc).",
    {
      title: z.string().describe("Title/description of the income"),
      amount: z.number().positive().describe("Amount in IDR"),
      date: z.string().describe("Date in YYYY-MM-DD format"),
      notes: z.string().optional().describe("Optional notes"),
    },
    async (args) => {
      const data = await client.post("/api/incomes", args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_income",
    "Update an existing income record by ID.",
    {
      id: z.string().describe("Income record ID"),
      title: z.string().describe("Updated title"),
      amount: z.number().positive().describe("Updated amount in IDR"),
      date: z.string().describe("Updated date in YYYY-MM-DD format"),
      notes: z.string().optional().nullable().describe("Updated notes"),
    },
    async ({ id, ...body }) => {
      const data = await client.put(`/api/incomes/${id}`, body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_income",
    "Delete an income record by ID.",
    {
      id: z.string().describe("Income record ID to delete"),
    },
    async ({ id }) => {
      const data = await client.del(`/api/incomes/${id}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
