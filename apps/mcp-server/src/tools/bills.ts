import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PocktClient } from "../client.js";

export function registerBillTools(server: McpServer, client: PocktClient) {
  server.tool(
    "list_bills",
    "List all monthly bills, sorted by due date.",
    {},
    async () => {
      const data = await client.get("/api/bills");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_bill",
    "Create a new recurring monthly bill (rent, internet, electricity, subscription, etc).",
    {
      name: z.string().describe("Bill name"),
      amount: z.number().positive().describe("Monthly amount in IDR"),
      dueDate: z.number().int().min(1).max(31).describe("Due date day of month (1-31)"),
      notes: z.string().optional().describe("Optional notes"),
    },
    async (args) => {
      const data = await client.post("/api/bills", args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_bill",
    "Update an existing bill by ID.",
    {
      id: z.string().describe("Bill ID"),
      name: z.string().describe("Updated bill name"),
      amount: z.number().positive().describe("Updated amount in IDR"),
      dueDate: z.number().int().min(1).max(31).describe("Updated due date (1-31)"),
      notes: z.string().optional().nullable().describe("Updated notes"),
    },
    async ({ id, ...body }) => {
      const data = await client.put(`/api/bills/${id}`, body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_bill",
    "Delete a bill and all its payment history.",
    {
      id: z.string().describe("Bill ID to delete"),
    },
    async ({ id }) => {
      const data = await client.del(`/api/bills/${id}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "pay_bill",
    "Record a payment for a bill (partial or full). Reduces remaining amount and marks as paid when fully settled.",
    {
      id: z.string().describe("Bill ID to pay"),
      amount: z.number().positive().describe("Payment amount in IDR"),
      date: z.string().describe("Payment date in YYYY-MM-DD format"),
      notes: z.string().optional().describe("Optional payment notes"),
    },
    async ({ id, ...body }) => {
      const data = await client.post(`/api/bills/${id}/pay`, body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "toggle_bill_paid",
    "Instantly toggle a bill's paid status between paid (remaining=0) and unpaid (remaining=full amount).",
    {
      id: z.string().describe("Bill ID to toggle"),
    },
    async ({ id }) => {
      const data = await client.post(`/api/bills/${id}/toggle-paid`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_bill_payments",
    "Get the payment history for a specific bill.",
    {
      id: z.string().describe("Bill ID"),
    },
    async ({ id }) => {
      const data = await client.get(`/api/bills/${id}/payments`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "reset_bills_monthly",
    "Reset all bills for a new month: marks all as unpaid and restores remaining amounts to full. Use at the start of each billing cycle.",
    {},
    async () => {
      const data = await client.post("/api/bills/reset-monthly");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
