import dotenv from "dotenv";
import { Anthropic } from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

interface Tool {
  name: string;
  description?: string;
  input_schema: {
    type: "object";
    properties?: Record<string, unknown>;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolResult {
  content: string;
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["/Users/jcottam/apps/_sandbox/mcp/mcp-server-weather/build/index.js"],
});

const client = new Client({
  name: "jrc-mcp-client",
  version: "1.0.0",
});

await client.connect(transport);

const toolsResult = await client.listTools();
const tools: Tool[] = toolsResult.tools.map((tool) => {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  };
});
console.log(
  "Connected to server with tools:",
  tools.map(({ name }) => name)
);

const messages: Message[] = [
  { role: "user", content: "What is the weather in the Taos, NM?" },
];

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 2000,
  messages,
  tools,
});

console.log(response);

const finalText: string[] = [];
const toolResults: ToolResult[] = [];

for (const content of response.content) {
  if (content.type === "text") {
    // finalText.push(content.text);
    console.log(content.text);
  } else if (content.type === "tool_use") {
    const toolName = content.name;
    const toolArgs = content.input as { [x: string]: unknown };

    const result = await client.callTool({
      name: toolName,
      arguments: toolArgs,
    });
    toolResults.push(result as unknown as ToolResult);
    // finalText.push(
    //   `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
    // );
    console.log("Calling tool", toolName, "with args", toolArgs);

    messages.push({
      role: "user",
      content: result.content as string,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages,
    });

    finalText.push(
      response.content[0].type === "text" ? response.content[0].text : ""
    );
  }
}

console.log("\n\n-- Final text --\n", finalText.join("\n"));
