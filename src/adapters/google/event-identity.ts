export interface EventIdentityInput {
  pageId: string;
  databaseId: string;
}

export function buildIdentity(
  input: EventIdentityInput,
): Record<string, string> {
  return {
    source: 'notion',
    notionPageId: input.pageId,
    notionDatabaseId: input.databaseId,
  };
}
