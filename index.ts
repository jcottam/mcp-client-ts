import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import readline from "readline/promises";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Constants
const CONFIG = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  MODEL_NAME: "claude-3-5-sonnet-20241022",
  MAX_TOKENS: 2000,
  CLIENT_NAME: "mcp-client-cli",
  CLIENT_VERSION: "1.0.0",
  QUIT_COMMAND: "quit",
} as const;

const SUPPORTED_EXTENSIONS = [".js", ".py"] as const;

// Validate required environment variables
if (!CONFIG.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required");
}

/**
 * MCP Client for connecting to MCP servers and processing queries
 */
class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport:
    | StdioClientTransport
    | StreamableHTTPClientTransport
    | null = null;
  private tools: Tool[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: CONFIG.ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({
      name: CONFIG.CLIENT_NAME,
      version: CONFIG.CLIENT_VERSION,
    });
  }

  /**
   * Connects to an MCP server using either HTTP or stdio transport
   */
  async connectToServer(serverScriptPath: string): Promise<void> {
    try {
      this.transport = this.createTransport(serverScriptPath);
      await this.mcp.connect(this.transport);
      await this.loadTools();

      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name)
      );
    } catch (error) {
      console.error("Failed to connect to MCP server:", error);
      throw error;
    }
  }

  /**
   * Creates the appropriate transport based on the server path
   */
  private createTransport(
    serverScriptPath: string
  ): StdioClientTransport | StreamableHTTPClientTransport {
    if (serverScriptPath.startsWith("http")) {
      console.log("Connecting to MCP server via StreamableHTTP");
      return new StreamableHTTPClientTransport(new URL(serverScriptPath));
    }

    console.log("Connecting to MCP server via Stdio");
    this.validateServerScript(serverScriptPath);

    const isJavaScript = serverScriptPath.endsWith(".js");
    return new StdioClientTransport({
      command: isJavaScript ? "node" : "python",
      args: [serverScriptPath],
    });
  }

  /**
   * Validates that the server script has a supported extension
   */
  private validateServerScript(serverScriptPath: string): void {
    const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) =>
      serverScriptPath.endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error(
        `Server script must have one of these extensions: ${SUPPORTED_EXTENSIONS.join(
          ", "
        )}`
      );
    }
  }

  /**
   * Loads available tools from the MCP server
   */
  private async loadTools(): Promise<void> {
    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  /**
   * Processes a user query through the MCP client
   */
  async processQuery(query: string): Promise<string> {
    const messages: MessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    console.log("Processing query:", query);

    const response = await this.anthropic.messages.create({
      model: CONFIG.MODEL_NAME,
      max_tokens: CONFIG.MAX_TOKENS,
      messages,
      tools: this.tools,
    });

    console.log("Response received from Anthropic");

    return this.processResponse(response, messages);
  }

  /**
   * Processes the response from Anthropic, handling both text and tool use
   */
  private async processResponse(
    response: any,
    messages: MessageParam[]
  ): Promise<string> {
    const finalText: string[] = [];

    for (const content of response.content) {
      if (content.type === "text") {
        finalText.push(content.text);
      } else if (content.type === "tool_use") {
        const toolResult = await this.handleToolUse(content, messages);
        finalText.push(toolResult);
      }
    }

    return finalText.join("\n");
  }

  /**
   * Handles tool use by calling the MCP server and processing the response
   */
  private async handleToolUse(
    content: any,
    messages: MessageParam[]
  ): Promise<string> {
    const toolName = content.name;
    const toolArgs = content.input as { [x: string]: unknown } | undefined;

    console.log(`Calling tool ${toolName} with args:`, toolArgs);

    const result = await this.mcp.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    // Add tool result to conversation history
    messages.push({
      role: "user",
      content: result.content as string,
    });

    // Get follow-up response from Anthropic
    const followUpResponse = await this.anthropic.messages.create({
      model: CONFIG.MODEL_NAME,
      max_tokens: CONFIG.MAX_TOKENS,
      messages,
    });

    const followUpText =
      followUpResponse.content[0].type === "text"
        ? followUpResponse.content[0].text
        : "";

    return `[Tool ${toolName} result: ${followUpText}]`;
  }

  /**
   * Starts the interactive chat loop
   */
  async chatLoop(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      this.displayWelcomeMessage();

      while (true) {
        const message = await rl.question("\nQuery: ");

        if (this.shouldQuit(message)) {
          break;
        }

        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

  /**
   * Displays the welcome message
   */
  private displayWelcomeMessage(): void {
    console.log("\nMCP Client Started!");
    console.log("Type your queries or 'quit' to exit.");
  }

  /**
   * Checks if the user wants to quit
   */
  private shouldQuit(message: string): boolean {
    return message.toLowerCase() === CONFIG.QUIT_COMMAND;
  }

  /**
   * Cleans up resources
   */
  async cleanup(): Promise<void> {
    await this.mcp.close();
  }
}

/**
 * Main function to run the MCP client
 */
async function main(): Promise<void> {
  if (process.argv.length < 3) {
    console.log("Usage: node index.ts <path_to_server_script>");
    return;
  }

  const serverScriptPath = process.argv[2];
  const mcpClient = new MCPClient();

  try {
    await mcpClient.connectToServer(serverScriptPath);
    await mcpClient.chatLoop();
  } catch (error) {
    console.error("Error in main:", error);
    process.exit(1);
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

// Start the application
main();
