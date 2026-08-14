import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerExpenseTools(server: McpServer, client: PocktClient) {
  server.tool(
    "list_expenses",
    "List all expense records, sorted by date descending.",
    {},
    async () => {
      const data = await client.get("/api/expenses");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_expense",
    "Record a new expense (daily spending). Use list_categories first to see available categories.",
    {
      title: z.string().describe("Title/description of the expense"),
      amount: z.number().positive().describe("Amount in IDR"),
      category: z.string().describe("Category name (e.g., 'Makanan & Minuman', 'Transportasi')"),
      date: z.string().describe("Date in YYYY-MM-DD format"),
      notes: z.string().optional().describe("Optional notes"),
    },
    async (args) => {
      const data = await client.post("/api/expenses", args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_expense",
    "Update an existing expense record by ID.",
    {
      id: z.string().describe("Expense record ID"),
      title: z.string().describe("Updated title"),
      amount: z.number().positive().describe("Updated amount in IDR"),
      category: z.string().describe("Updated category name"),
      date: z.string().describe("Updated date in YYYY-MM-DD format"),
      notes: z.string().optional().nullable().describe("Updated notes"),
    },
    async ({ id, ...body }) => {
      const data = await client.put(`/api/expenses/${id}`, body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_expense",
    "Delete an expense record by ID.",
    {
      id: z.string().describe("Expense record ID to delete"),
    },
    async ({ id }) => {
      const data = await client.del(`/api/expenses/${id}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "list_categories",
    "List all expense categories. Returns default categories if none have been created yet.",
    {},
    async () => {
      const data = await client.get("/api/categories");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_category",
    "Create a new custom expense category.",
    {
      name: z.string().describe("Category name"),
      color: z.string().optional().describe("Hex color code (e.g., '#f59e0b'). Defaults to '#64748b'."),
    },
    async (args) => {
      const data = await client.post("/api/categories", args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
