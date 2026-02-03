#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Simple test tool
server.tool(
  "say_hello",
  {
    name: z.string(),
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello ${name}! MCP server is working 🚀`,
        },
      ],
    };
  }
);

// Keep process alive
const transport = new StdioServerTransport();
await server.connect(transport);
