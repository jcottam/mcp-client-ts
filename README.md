# MCP Client

A TypeScript client implementation of the Model Context Protocol (MCP). This client allows you to interact with AI models using the MCP specification, enabling standardized communication between clients and AI models through Claude 3.5 Sonnet.

## Features

- Connect to MCP servers via multiple transport types:
  - **Stdio Transport**: Local JavaScript (.js) or Python (.py) server scripts
  - **StreamableHTTP Transport**: Remote HTTP-based MCP servers
- Interactive chat interface with Claude 3.5 Sonnet
- Automatic tool discovery and execution
- Automatic transport detection based on server URL
- Environment-based configuration

## Prerequisites

- Node.js (>=18.0.0)
- pnpm (for package management)
- Python 3 (if connecting to Python-based MCP servers via stdio)
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

The client automatically detects the transport type based on the server path/URL:

### Stdio Transport (Local Servers)

For local JavaScript or Python MCP servers:

```bash
# For JavaScript servers
node build/index.js /path/to/server.js

# For Python servers
node build/index.js /path/to/server.py
```

### StreamableHTTP Transport (Remote Servers)

For remote HTTP-based MCP servers:

```bash
# Connect to any HTTP-based MCP server
node build/index.js https://example.com/mcp-endpoint

# Connect to Zapier MCP server
node build/index.js https://mcp.zapier.com/api/mcp/s/<your-zapier-server-id>/mcp
```

### Usage Examples

```bash
# Run with a local weather server (Stdio)
node build/index.js /Users/jcottam/apps/_sandbox/mcp/mcp-server-weather/build/index.js

# Run with a remote Zapier server (StreamableHTTP)
node build/index.js https://mcp.zapier.com/api/mcp/s/<your-zapier-server-id>/mcp

# Run with any HTTP-based MCP server
node build/index.js https://api.example.com/mcp/v1
```

### Query Example

Once the client is running with any server, you can ask questions like:

```
Query: What's the weather in Taos Ski Valley today?
```

The client will automatically:

1. Discover the available tools from the server
2. Use Claude 3.5 Sonnet to determine which tool to call
3. Execute the appropriate API call
4. Return a natural language response with the requested information

## Transport Types

### Stdio Transport

- **Use Case**: Local development and testing with MCP servers
- **Supported**: JavaScript (.js) and Python (.py) server scripts
- **Detection**: Automatically detected when server path doesn't start with "http"
- **Advantages**: Low latency, full control over server environment

### StreamableHTTP Transport

- **Use Case**: Production deployments and remote MCP servers
- **Supported**: Any HTTP-based MCP server endpoint
- **Detection**: Automatically detected when server URL starts with "http" or "https"
- **Advantages**: No local server setup required, scalable, cloud-based

## How it Works

1. **Connection**: The client automatically detects and connects to an MCP server via the appropriate transport:
   - Stdio for local server scripts
   - StreamableHTTP for remote HTTP endpoints
2. **Tool Discovery**: Automatically discovers available tools from the server
3. **Chat Interface**: Provides an interactive chat loop where you can ask questions
4. **Tool Execution**: Claude 3.5 Sonnet can automatically call server tools when needed
5. **Response Processing**: Handles both text responses and tool calls seamlessly

## Development

The client is built with TypeScript and uses:

- `@anthropic-ai/sdk` for Claude API integration
- `@modelcontextprotocol/sdk` for MCP protocol implementation
  - `StdioClientTransport` for local server connections
  - `StreamableHTTPClientTransport` for remote HTTP connections
- `dotenv` for environment variable management

### Available Scripts

- `pnpm install` - Install dependencies
- `pnpm build` - Build the TypeScript project
- `pnpm dev` - Build in watch mode for development
- `pnpm clean` - Clean the build directory

## Tutorial

For more information about MCP, see the official tutorial:
https://modelcontextprotocol.io/quickstart/client#node
