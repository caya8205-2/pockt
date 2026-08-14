import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerDebtTools(server: McpServer, client: PocktClient) {
  server.tool(
    "list_debts",
    "List all active (unpaid) debts.",
    {},
    async () => {
      const data = await client.get("/api/debts");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_debt",
    "Record a new debt (money owed to someone).",
    {
      person: z.string().describe("Person you owe money to"),
      totalAmount: z.number().positive().describe("Total debt amount in IDR"),
      dueDate: z.string().optional().describe("Due date in YYYY-MM-DD format"),
      notes: z.string().optional().describe("Optional notes"),
    },
    async (args) => {
      const data = await client.post("/api/debts", args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_debt",
    "Update an existing debt record by ID.",
    {
      id: z.string().describe("Debt record ID"),
      person: z.string().describe("Updated person name"),
      totalAmount: z.number().positive().describe("Updated total amount in IDR"),
      dueDate: z.string().optional().nullable().describe("Updated due date in YYYY-MM-DD format"),
      notes: z.string().optional().nullable().describe("Updated notes"),
    },
    async ({ id, ...body }) => {
      const data = await client.put(`/api/debts/${id}`, body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_debt",
    "Delete a debt record and all its payment history.",
    {
      id: z.string().describe("Debt record ID to delete"),
    },
    async ({ id }) => {
      const data = await client.del(`/api/debts/${id}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "pay_debt",
    "Record a payment/installment for a debt. Reduces remaining amount and marks as fully paid when remaining reaches 0.",
    {
      id: z.string().describe("Debt record ID to pay"),
      amount: z.number().positive().describe("Payment amount in IDR"),
      date: z.string().describe("Payment date in YYYY-MM-DD format"),
      notes: z.string().optional().describe("Optional payment notes"),
    },
    async ({ id, ...body }) => {
      const data = await client.post(`/api/debts/${id}/pay`, body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "restore_debt",
    "Undo a debt's paid status: marks it as unpaid and restores the remaining amount to the original total.",
    {
      id: z.string().describe("Debt record ID to restore"),
    },
    async ({ id }) => {
      const data = await client.post(`/api/debts/${id}/restore`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_debt_payments",
    "Get the payment/installment history for a specific debt.",
    {
      id: z.string().describe("Debt record ID"),
    },
    async ({ id }) => {
      const data = await client.get(`/api/debts/${id}/payments`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
