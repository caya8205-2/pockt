import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerExpenseTools(server: McpServer, client: PocktClient) {
  server.tool(
    "list_expenses",
    "List all expense records, sorted by date descending. Can optionally filter by debtId or paymentMethod.",
    {
      debtId: z.string().optional().describe("Optional: filter expenses linked to a specific Debt ID"),
      paymentMethod: z.string().optional().describe("Optional: filter by payment method (e.g. 'GOPAY_LATER', 'SPAYLATER', 'CASH')"),
    },
    async (args) => {
      const params = new URLSearchParams();
      if (args?.debtId) params.append("debtId", args.debtId);
      if (args?.paymentMethod) params.append("paymentMethod", args.paymentMethod);
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await client.get(`/api/expenses${queryStr}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_expense",
    "Record a new expense (daily spending). Supports Paylater payment methods (GOPAY_LATER, SPAYLATER, OTHER_PAYLATER) which track items without reducing current cash balance, and can auto-accumulate into a linked Debt.",
    {
      title: z.string().describe("Title/description of the expense"),
      amount: z.number().positive().describe("Amount in IDR"),
      category: z.string().describe("Category name (e.g., 'Makanan & Minuman', 'Transportasi')"),
      date: z.string().describe("Date in YYYY-MM-DD format"),
      paymentMethod: z.string().optional().describe("Payment method: CASH (default), DEBIT, TRANSFER, GOPAY_LATER, SPAYLATER, OTHER_PAYLATER"),
      debtId: z.string().optional().describe("Optional Debt ID to auto-accumulate and sync this paylater expense into"),
      isPaylater: z.boolean().optional().describe("Optional boolean to mark explicitly as paylater"),
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
      title: z.string().optional().describe("Updated title"),
      amount: z.number().positive().optional().describe("Updated amount in IDR"),
      category: z.string().optional().describe("Updated category name"),
      date: z.string().optional().describe("Updated date in YYYY-MM-DD format"),
      paymentMethod: z.string().optional().describe("Updated payment method (CASH, DEBIT, GOPAY_LATER, SPAYLATER, etc.)"),
      debtId: z.string().optional().nullable().describe("Updated linked Debt ID or null to unlink"),
      isPaylater: z.boolean().optional().describe("Updated isPaylater boolean"),
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
