/**
 * Tests for chrome-in-chrome MCP beta header management
 */

import {
  isChromeInChromeMcpTool,
  markChromeInChromeMcpToolUsed,
  hasChromeInChromeMcpBeenUsed,
  getChromeInChromeMcpBetaHeader,
  getSessionState,
  restoreSessionState,
  resetState,
} from "./chrome-mcp-beta-header";

import {
  onToolExecuted,
  addChromeMcpBetaHeaderIfNeeded,
} from "./chrome-mcp-beta-header-integration";

describe("chrome-mcp-beta-header", () => {
  beforeEach(() => {
    resetState();
  });

  describe("isChromeInChromeMcpTool", () => {
    it("should return true for claude-in-chrome MCP tools", () => {
      expect(isChromeInChromeMcpTool("mcp__claude-in-chrome__navigate")).toBe(true);
      expect(isChromeInChromeMcpTool("mcp__claude-in-chrome__click")).toBe(true);
      expect(isChromeInChromeMcpTool("mcp__claude-in-chrome__computer")).toBe(true);
      expect(isChromeInChromeMcpTool("mcp__claude-in-chrome__read_page")).toBe(true);
    });

    it("should return false for non-chrome MCP tools", () => {
      expect(isChromeInChromeMcpTool("mcp__filesystem__read")).toBe(false);
      expect(isChromeInChromeMcpTool("mcp__github__create_issue")).toBe(false);
      expect(isChromeInChromeMcpTool("Read")).toBe(false);
      expect(isChromeInChromeMcpTool("Bash")).toBe(false);
    });
  });

  describe("markChromeInChromeMcpToolUsed", () => {
    it("should mark the tool as used", () => {
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);
      markChromeInChromeMcpToolUsed();
      expect(hasChromeInChromeMcpBeenUsed()).toBe(true);
    });

    it("should be idempotent", () => {
      markChromeInChromeMcpToolUsed();
      markChromeInChromeMcpToolUsed();
      markChromeInChromeMcpToolUsed();
      expect(hasChromeInChromeMcpBeenUsed()).toBe(true);
    });
  });

  describe("getChromeInChromeMcpBetaHeader", () => {
    it("should return null when no chrome MCP tool has been used", () => {
      expect(getChromeInChromeMcpBetaHeader()).toBe(null);
    });

    it("should return the beta header when a chrome MCP tool has been used", () => {
      markChromeInChromeMcpToolUsed();
      const header = getChromeInChromeMcpBetaHeader();
      expect(header).not.toBe(null);
      expect(typeof header).toBe("string");
    });
  });

  describe("session state persistence", () => {
    it("should persist state across getSessionState/restoreSessionState", () => {
      // Initially not used
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);

      // Mark as used
      markChromeInChromeMcpToolUsed();
      expect(hasChromeInChromeMcpBeenUsed()).toBe(true);

      // Get state
      const state = getSessionState();
      expect(state.chromeInChromeMcpUsed).toBe(true);

      // Reset and verify
      resetState();
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);

      // Restore state
      restoreSessionState(state);
      expect(hasChromeInChromeMcpBeenUsed()).toBe(true);
    });

    it("should handle restoring state when not previously used", () => {
      restoreSessionState({ chromeInChromeMcpUsed: false });
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);
    });

    it("should handle restoring state when undefined", () => {
      restoreSessionState({});
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);
    });

    it("should handle restoring state when true", () => {
      restoreSessionState({ chromeInChromeMcpUsed: true });
      expect(hasChromeInChromeMcpBeenUsed()).toBe(true);
    });
  });
});

describe("chrome-mcp-beta-header-integration", () => {
  beforeEach(() => {
    resetState();
  });

  describe("onToolExecuted", () => {
    it("should mark state when a chrome MCP tool is executed", () => {
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);
      onToolExecuted("mcp__claude-in-chrome__navigate");
      expect(hasChromeInChromeMcpBeenUsed()).toBe(true);
    });

    it("should not mark state when a non-chrome tool is executed", () => {
      onToolExecuted("Read");
      onToolExecuted("Bash");
      onToolExecuted("mcp__filesystem__read");
      expect(hasChromeInChromeMcpBeenUsed()).toBe(false);
    });
  });

  describe("addChromeMcpBetaHeaderIfNeeded", () => {
    it("should not add header when no chrome MCP tool has been used", () => {
      const existingHeaders = ["beta-1", "beta-2"];
      const result = addChromeMcpBetaHeaderIfNeeded(existingHeaders);
      expect(result).toEqual(existingHeaders);
    });

    it("should add header when chrome MCP tool has been used", () => {
      markChromeInChromeMcpToolUsed();
      const existingHeaders = ["beta-1", "beta-2"];
      const result = addChromeMcpBetaHeaderIfNeeded(existingHeaders);
      expect(result.length).toBe(3);
      expect(result).toContain("beta-1");
      expect(result).toContain("beta-2");
      // Third element should be the chrome beta header
      expect(result[2]).not.toBe(null);
    });

    it("should not duplicate header if already present", () => {
      markChromeInChromeMcpToolUsed();
      const betaHeader = getChromeInChromeMcpBetaHeader()!;
      const existingHeaders = ["beta-1", betaHeader];
      const result = addChromeMcpBetaHeaderIfNeeded(existingHeaders);
      expect(result).toEqual(existingHeaders);
    });

    it("should work with empty existing headers", () => {
      markChromeInChromeMcpToolUsed();
      const result = addChromeMcpBetaHeaderIfNeeded([]);
      expect(result.length).toBe(1);
    });
  });
});

describe("end-to-end scenarios", () => {
  beforeEach(() => {
    resetState();
  });

  it("should correctly handle --resume scenario", () => {
    // Simulate first session: user calls chrome MCP tool
    onToolExecuted("mcp__claude-in-chrome__navigate");
    expect(hasChromeInChromeMcpBeenUsed()).toBe(true);

    // Save state before session ends
    const savedState = getSessionState();

    // Simulate session end by resetting
    resetState();
    expect(hasChromeInChromeMcpBeenUsed()).toBe(false);

    // Simulate --resume: restore state
    restoreSessionState(savedState);
    expect(hasChromeInChromeMcpBeenUsed()).toBe(true);

    // Beta header should be added to all subsequent requests
    const headers = addChromeMcpBetaHeaderIfNeeded([]);
    expect(headers.length).toBe(1);
  });

  it("should correctly handle --continue scenario", () => {
    // Simulate first session: no chrome MCP tools called
    expect(hasChromeInChromeMcpBeenUsed()).toBe(false);

    // Save state
    const savedState = getSessionState();

    // Simulate --continue
    resetState();
    restoreSessionState(savedState);

    // No beta header should be added
    const headers = addChromeMcpBetaHeaderIfNeeded(["existing-beta"]);
    expect(headers).toEqual(["existing-beta"]);

    // Now call a chrome MCP tool
    onToolExecuted("mcp__claude-in-chrome__click");
    expect(hasChromeInChromeMcpBeenUsed()).toBe(true);

    // Beta header should now be added
    const headersAfter = addChromeMcpBetaHeaderIfNeeded(["existing-beta"]);
    expect(headersAfter.length).toBe(2);
  });

  it("should handle multiple chrome MCP tool calls", () => {
    onToolExecuted("mcp__claude-in-chrome__navigate");
    onToolExecuted("mcp__claude-in-chrome__click");
    onToolExecuted("mcp__claude-in-chrome__read_page");
    onToolExecuted("mcp__claude-in-chrome__computer");

    // Should still only have one beta header
    const headers = addChromeMcpBetaHeaderIfNeeded([]);
    expect(headers.length).toBe(1);
  });
});
