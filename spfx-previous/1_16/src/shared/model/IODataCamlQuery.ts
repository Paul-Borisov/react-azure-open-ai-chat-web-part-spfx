export interface IODataCamlQuery {
  // Should you have the entire caml query ready you can put it here instead of adding separate params.
  fullCamlQuery?: string;
  orderBy?: string;
  orderByDescending?: boolean;
  recursive?: boolean;
  rowLimit?: number;
  viewFields?: string[];
  where?: string;
}
