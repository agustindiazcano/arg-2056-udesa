/**
 * Axe violations the suite accepts, each one explicit. An exception names the rule, the selector of the element it
 * applies to (axe's own css selector for the node, matched as a substring) and the reason it is accepted.
 * Nothing is excepted by rule alone: a rule that fails anywhere else still fails the test.
 *
 * Every entry is listed in the PR and in docs/performance.md. Today there are none.
 */
export interface AxeException {
  ruleId: string;
  selector: string;
  reason: string;
}

export const AXE_EXCEPTIONS: readonly AxeException[] = [];

/** True when `ruleId` on a node whose axe selector is `selector` has an exception. */
export function isExcepted(ruleId: string, selector: string, exceptions: readonly AxeException[] = AXE_EXCEPTIONS): boolean {
  return exceptions.some((e) => e.ruleId === ruleId && selector.includes(e.selector));
}
