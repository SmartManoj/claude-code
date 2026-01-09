# Chrome MCP Beta Header Implementation

This directory contains the implementation for adding a beta header to API requests whenever any `claude-in-chrome-mcp` tool is called.

## Overview

When any `mcp__claude-in-chrome__*` tool is called at least once, all subsequent API requests should include a beta header. This state persists across `--resume`/`--continue` sessions.

## Files

- `chrome-mcp-beta-header.ts` - Core module for tracking chrome MCP tool usage
- `chrome-mcp-beta-header-integration.ts` - Integration points showing how to hook this into the main codebase
- `chrome-mcp-beta-header.test.ts` - Unit tests

## Key Features

1. **Tool Detection**: Automatically detects when any `mcp__claude-in-chrome__*` tool is executed
2. **Beta Header Injection**: Adds the beta header to all subsequent API requests after the first chrome MCP tool call
3. **Session Persistence**: State persists across `--resume`/`--continue` via session state serialization

## Integration Points

### 1. Tool Execution Hook
When an MCP tool is executed, call `onToolExecuted(toolName)`:

```typescript
import { onToolExecuted } from './chrome-mcp-beta-header-integration';

async function executeTool(toolName: string, input: any): Promise<any> {
  const result = await actualToolExecution(toolName, input);
  onToolExecuted(toolName);  // <-- Add this
  return result;
}
```

### 2. API Request Headers
When building API request headers, use `addChromeMcpBetaHeaderIfNeeded`:

```typescript
import { addChromeMcpBetaHeaderIfNeeded } from './chrome-mcp-beta-header-integration';

function buildHeaders(): Headers {
  const existingBetaHeaders = ['existing-beta'];
  const finalBetaHeaders = addChromeMcpBetaHeaderIfNeeded(existingBetaHeaders);
  headers.set('anthropic-beta', finalBetaHeaders.join(','));
}
```

### 3. Session State Persistence
For `--resume`/`--continue` support:

```typescript
import {
  getChromeMcpSessionState,
  restoreChromeMcpSessionState
} from './chrome-mcp-beta-header-integration';

// When saving session state:
const sessionState = {
  ...existingState,
  ...getChromeMcpSessionState(),
};

// When restoring session state:
restoreChromeMcpSessionState(savedState);
```

## Beta Header Value

The beta header value is defined in `chrome-mcp-beta-header.ts`:

```typescript
const CHROME_IN_CHROME_MCP_BETA_HEADER = "browser-use-YYYYMMDD"; // TODO: Fill in actual value
```

Update this constant with the actual header string value.

## Related Slack Discussion

See Slack thread: https://anthropic.slack.com/archives/C09E4UHMNGY/p1767982033648339?thread_ts=1767724566.499179&cid=C09E4UHMNGY
