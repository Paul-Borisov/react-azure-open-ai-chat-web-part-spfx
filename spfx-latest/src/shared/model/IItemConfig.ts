export interface IItemConfig {
  name: string;
  description?: string;
  allowHtml?: boolean;
  choices?: string;
  icon?: string;
  maxTokens?: number;
  model?: string;
  queryText?: string;
  showRefresh?: boolean;
  usePageContent?: boolean;
}
