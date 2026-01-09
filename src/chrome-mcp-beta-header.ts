/**
 * Chrome MCP Beta Header Management
 *
 * This module tracks when any claude-in-chrome-mcp tools are called and adds
 * a beta header to all subsequent API requests. The state persists across
 * --resume/--continue sessions.
 *
 * Usage:
 * - Call markChromeInChromeMcpToolUsed() when any mcp__claude-in-chrome__* tool is called
 * - Call hasChromeInChromeMcpBeenUsed() to check if the beta header should be added
 * - Call getChromeInChromeMcpBetaHeader() to get the header value to add to requests
 */

// The beta header value to add when chrome-in-chrome MCP tools are used
// TODO: Fill in the actual header string value
const CHROME_IN_CHROME_MCP_BETA_HEADER = "browser-use-YYYYMMDD"; // placeholder

// MCP server name for claude-in-chrome
const CLAUDE_IN_CHROME_MCP_SERVER_NAME = "claude-in-chrome";

// Tool name prefix for claude-in-chrome MCP tools
const CHROME_MCP_TOOL_PREFIX = `mcp__${CLAUDE_IN_CHROME_MCP_SERVER_NAME}__`;

// In-memory state - will be loaded from/saved to session state
let chromeInChromeMcpUsed = false;

/**
 * Check if a tool name is a claude-in-chrome MCP tool
 */
export function isChromeInChromeMcpTool(toolName: string): boolean {
  return toolName.startsWith(CHROME_MCP_TOOL_PREFIX);
}

/**
 * Mark that a chrome-in-chrome MCP tool has been used.
 * This should be called whenever any mcp__claude-in-chrome__* tool is executed.
 */
export function markChromeInChromeMcpToolUsed(): void {
  chromeInChromeMcpUsed = true;
}

/**
 * Check if any chrome-in-chrome MCP tool has been used in this session.
 */
export function hasChromeInChromeMcpBeenUsed(): boolean {
  return chromeInChromeMcpUsed;
}

/**
 * Get the beta header to add to API requests, or null if none should be added.
 */
export function getChromeInChromeMcpBetaHeader(): string | null {
  if (chromeInChromeMcpUsed) {
    return CHROME_IN_CHROME_MCP_BETA_HEADER;
  }
  return null;
}

/**
 * Session state key for persisting chrome MCP usage across --resume/--continue
 */
export const CHROME_MCP_SESSION_STATE_KEY = "chromeInChromeMcpUsed";

/**
 * Get the session state to persist across --resume/--continue
 */
export function getSessionState(): { chromeInChromeMcpUsed: boolean } {
  return {
    chromeInChromeMcpUsed,
  };
}

/**
 * Restore session state from --resume/--continue
 */
export function restoreSessionState(state: { chromeInChromeMcpUsed?: boolean }): void {
  if (state.chromeInChromeMcpUsed === true) {
    chromeInChromeMcpUsed = true;
  }
}

/**
 * Reset state (for testing purposes)
 */
export function resetState(): void {
  chromeInChromeMcpUsed = false;
}
