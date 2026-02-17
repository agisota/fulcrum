/**
 * Slack-specific utility functions.
 * Extracted from message-handler.ts to avoid circular imports
 * (slack-channel needs parseSlackResponse but can't import from message-handler).
 */

/**
 * Parse <slack-response> XML tags from assistant text output.
 * Returns { body, blocks? } on success, null on failure or missing tags.
 */
export function parseSlackResponse(text: string): { body: string; blocks?: unknown[]; filePath?: string } | null {
  const match = text.match(/<slack-response>([\s\S]*?)<\/slack-response>/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1])
    if (typeof parsed.body === 'string' && parsed.body.trim()) {
      return {
        body: parsed.body,
        ...(Array.isArray(parsed.blocks) && { blocks: parsed.blocks }),
        ...(typeof parsed.filePath === 'string' && parsed.filePath.trim() && { filePath: parsed.filePath }),
      }
    }
    return null
  } catch {
    return null
  }
}
