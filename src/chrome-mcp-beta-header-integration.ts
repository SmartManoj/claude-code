/**
 * Integration code for chrome-in-chrome MCP beta header
 *
 * This file shows how to integrate the beta header tracking into the existing
 * Claude Code infrastructure. These changes should be applied to the appropriate
 * files in the main source code.
 */

import {
  isChromeInChromeMcpTool,
  markChromeInChromeMcpToolUsed,
  hasChromeInChromeMcpBeenUsed,
  getChromeInChromeMcpBetaHeader,
  getSessionState,
  restoreSessionState,
  CHROME_MCP_SESSION_STATE_KEY,
} from "./chrome-mcp-beta-header";

// ============================================================================
// INTEGRATION POINT 1: Tool Execution Hook
// Location: Where MCP tool calls are executed (e.g., tool-executor.ts)
// ============================================================================

/**
 * This function should be called after ANY tool is successfully executed.
 * If the tool is a chrome-in-chrome MCP tool, it marks the session.
 *
 * Example integration in tool execution code:
 *
 * async function executeTool(toolName: string, toolInput: any): Promise<ToolResult> {
 *   const result = await actualToolExecution(toolName, toolInput);
 *
 *   // Add this check after successful tool execution
 *   onToolExecuted(toolName);
 *
 *   return result;
 * }
 */
export function onToolExecuted(toolName: string): void {
  if (isChromeInChromeMcpTool(toolName)) {
    markChromeInChromeMcpToolUsed();
  }
}

// ============================================================================
// INTEGRATION POINT 2: API Request Headers
// Location: Where API requests are made to Claude (e.g., api-client.ts)
// ============================================================================

/**
 * Adds the chrome MCP beta header to the existing beta headers if needed.
 *
 * Example integration in API client:
 *
 * function buildHeaders(): Headers {
 *   const headers = new Headers();
 *   headers.set('anthropic-version', '...');
 *
 *   // Existing beta headers
 *   const betaHeaders = ['existing-beta-1', 'existing-beta-2'];
 *
 *   // Add chrome MCP beta header if needed
 *   const chromeBetaHeader = getChromeInChromeMcpBetaHeader();
 *   if (chromeBetaHeader && !betaHeaders.includes(chromeBetaHeader)) {
 *     betaHeaders.push(chromeBetaHeader);
 *   }
 *
 *   headers.set('anthropic-beta', betaHeaders.join(','));
 *   return headers;
 * }
 */
export function addChromeMcpBetaHeaderIfNeeded(existingBetaHeaders: string[]): string[] {
  const chromeBetaHeader = getChromeInChromeMcpBetaHeader();
  if (chromeBetaHeader && !existingBetaHeaders.includes(chromeBetaHeader)) {
    return [...existingBetaHeaders, chromeBetaHeader];
  }
  return existingBetaHeaders;
}

// ============================================================================
// INTEGRATION POINT 3: Session State Persistence
// Location: Where session state is saved/loaded (e.g., session-manager.ts)
// ============================================================================

/**
 * Session state interface extension
 */
interface SessionState {
  // ... existing session state fields ...
  chromeInChromeMcpUsed?: boolean;
}

/**
 * Call this when saving session state (before exiting or suspending).
 *
 * Example integration:
 *
 * function saveSessionState(): SessionState {
 *   return {
 *     ...existingState,
 *     ...getChromeMcpSessionState(),
 *   };
 * }
 */
export function getChromeMcpSessionState(): { chromeInChromeMcpUsed: boolean } {
  return getSessionState();
}

/**
 * Call this when loading session state (on --resume or --continue).
 *
 * Example integration:
 *
 * function loadSessionState(savedState: SessionState): void {
 *   // ... restore existing state ...
 *
 *   // Restore chrome MCP state
 *   restoreChromeMcpSessionState(savedState);
 * }
 */
export function restoreChromeMcpSessionState(savedState: SessionState): void {
  restoreSessionState({
    chromeInChromeMcpUsed: savedState.chromeInChromeMcpUsed,
  });
}

// ============================================================================
// INTEGRATION POINT 4: PostToolUse Hook (Alternative Integration)
// Location: hooks/hooks.ts or similar
// ============================================================================

/**
 * Alternative integration using the hook system.
 * This can be registered as a PostToolUse hook.
 *
 * Example registration:
 *
 * registerPostToolUseHook({
 *   matcher: /^mcp__claude-in-chrome__/,
 *   handler: handleChromeInChromeMcpToolUse,
 * });
 */
export function handleChromeInChromeMcpToolUse(
  toolName: string,
  _toolInput: unknown,
  _toolResult: unknown
): void {
  if (isChromeInChromeMcpTool(toolName)) {
    markChromeInChromeMcpToolUsed();
  }
}

// ============================================================================
// EXAMPLE: Full Integration in Query/Request Builder
// ============================================================================

/**
 * Example of how the beta header should be added to API requests.
 * This is pseudo-code showing the integration pattern.
 */
export function buildApiRequestExample() {
  // Get existing beta headers from configuration
  const betaHeaders: string[] = [
    // ... existing beta headers ...
  ];

  // Add chrome MCP beta header if any chrome-in-chrome tool has been used
  const finalBetaHeaders = addChromeMcpBetaHeaderIfNeeded(betaHeaders);

  // Build the request with headers
  const headers = {
    "anthropic-version": "2024-06-01",
    "anthropic-beta": finalBetaHeaders.join(","),
    // ... other headers ...
  };

  return headers;
}
