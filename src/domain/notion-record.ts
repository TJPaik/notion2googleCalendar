export interface NotionDateValue {
  start: string | null;
  end: string | null;
  includesTime: boolean;
}

export interface NotionRecord {
  pageId: string;
  title: string;
  description: string | null;
  date: NotionDateValue | null;
  archived: boolean;
  deleted: boolean;
}
