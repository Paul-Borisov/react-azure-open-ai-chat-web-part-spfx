export interface IODataQuery {
  id?: string;
  endpoint: string;
  version?: string;
  select?: string;
  expand?: string;
  filter?: string;
  orderby?: string;
  top?: number;
  count?: boolean;
  customQueryString?: string;
  isSiteRelative?: boolean;
  isAdvancedQuery?: boolean; //https://docs.microsoft.com/en-us/graph/api/application-list?view=graph-rest-1.0&tabs=http#request-headers
}
