/** A Kubernetes-style condition, as status.conditions has them. */
export interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown' | string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  observedGeneration?: number;
}

export type ConditionTone = 'ok' | 'warn' | 'bad' | 'neutral';

export function findCondition<C extends Condition>(conditions: readonly C[] | null | undefined, type: string): C | undefined {
  return conditions?.find((c) => c.type === type);
}

/**
 * True is ok, Unknown (or not reported) neutral, False bad — unless its reason
 * only passes on a dependency's trouble (`inherited`): then the resource
 * itself is fine and the condition is a warning, so the one resource actually
 * at fault stands out. (From the mcp-gateway console.)
 */
export function conditionTone(c: Condition | undefined, inherited: readonly string[] = []): ConditionTone {
  if (!c || c.status === 'Unknown') return 'neutral';
  if (c.status === 'True') return 'ok';
  return c.reason && inherited.includes(c.reason) ? 'warn' : 'bad';
}

/** A condition as a sort value: False before Unknown before True, so what is broken comes first. */
export function conditionRank(c: Condition | undefined): number {
  return c?.status === 'False' ? 0 : c?.status === 'True' ? 2 : 1;
}

/** Healthy is every listed condition being True; not reported yet is not healthy. */
export function healthy(conditions: readonly Condition[] | null | undefined, types: readonly string[]): boolean {
  return types.every((t) => findCondition(conditions, t)?.status === 'True');
}

/** The first listed condition that is not True: the one worth showing. */
export function firstProblem<C extends Condition>(conditions: readonly C[] | null | undefined, types: readonly string[]): C | undefined {
  for (const t of types) {
    const c = findCondition(conditions, t);
    if (c && c.status !== 'True') return c;
  }
  return undefined;
}
