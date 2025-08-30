# MCP Client

A TypeScript client implementation of the Model Context Protocol (MCP). This client allows you to interact with AI models using the MCP specification, enabling standardized communication between clients and AI models through Claude 3.5 Sonnet.

## Features

- Connect to MCP servers (JavaScript or Python)
- Interactive chat interface with Claude 3.5 Sonnet
- Automatic tool discovery and execution
- Support for both .js and .py server scripts
- Environment-based configuration

## Prerequisites

- Node.js (>=18.0.0)
- pnpm (for package management)
- Python 3 (if connecting to Python-based MCP servers)
- Anthropic API key

## Installation

```bash
pnpm install
```

## Configuration

Create a `.env` file in the project root with your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

## Build

```bash
pnpm build
```

For development with watch mode:

```bash
pnpm dev
```

## Usage

Run the client with a path to an MCP server script:

```bash
# For JavaScript servers
node build/index.js /path/to/server.js

# For Python servers
node build/index.js /path/to/server.py
```

### Example

```bash
# Run with a weather server
node build/index.js /Users/jcottam/apps/_sandbox/mcp/mcp-server-weather/build/index.js
```

### Example Query

Once the client is running with a weather server, you can ask questions like:

```
Query: What's the weather in Taos Ski Valley today?
```

The client will automatically:

1. Discover the available weather tools from the server
2. Use Claude 3.5 Sonnet to determine which tool to call
3. Execute the appropriate weather API call
4. Return a natural language response with the current weather information

## How it Works

1. **Connection**: The client connects to an MCP server via stdio transport
2. **Tool Discovery**: Automatically discovers available tools from the server
3. **Chat Interface**: Provides an interactive chat loop where you can ask questions
4. **Tool Execution**: Claude 3.5 Sonnet can automatically call server tools when needed
5. **Response Processing**: Handles both text responses and tool calls seamlessly

## Development

The client is built with TypeScript and uses:

- `@anthropic-ai/sdk` for Claude API integration
- `@modelcontextprotocol/sdk` for MCP protocol implementation
- `dotenv` for environment variable management

### Available Scripts

- `pnpm install` - Install dependencies
- `pnpm build` - Build the TypeScript project
- `pnpm dev` - Build in watch mode for development
- `pnpm clean` - Clean the build directory

## Tutorial

For more information about MCP, see the official tutorial:
https://modelcontextprotocol.io/quickstart/client#node
