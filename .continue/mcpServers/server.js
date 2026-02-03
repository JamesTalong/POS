// server.js
import { createServer } from "@continuedev/mcp-node";

const server = createServer({
  name: "my-mcp-server",
  port: 3000,
});

// Example tool your MCP server exposes
server.tool("warehouse-greet", async (input) => {
  return `Hello! You sent: ${input}`;
});

// Start server
await server.listen();
console.log("MCP server running on port 3000");
