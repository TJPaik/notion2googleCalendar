export type SyncAction = 'create' | 'update' | 'delete' | 'noop';

export interface SyncDecision {
  action: SyncAction;
  reason: string;
}
