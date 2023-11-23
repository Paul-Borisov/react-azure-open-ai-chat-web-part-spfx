export default class SearchResultMapper {
  public static delimiter = ',';

  public static mapSearchResults(data: any, propertyNames: string[]): any[] {
    const results = [];
    data?.d?.postquery?.PrimaryQueryResult?.RelevantResults?.Table?.Rows?.results?.forEach((r) => {
      const row = {};
      r.Cells?.results?.forEach((c) => {
        if (propertyNames.some((p) => p?.toLocaleLowerCase() === c.Key?.toLocaleLowerCase())) {
          row[c.Key] = c.Value;
        }
      });
      results.push(row);
    });
    return results;
  }

  public static mapToCsv(data: any[], delimiter: string = this.delimiter): string {
    if (!data.length) return '';

    const re = new RegExp(delimiter, 'g');
    const replaceDelimiter = (value: string): string => {
      return re.test(value) ? value.replace(re, delimiter === ';' ? ',' : ';') : value;
    };

    const keys = Object.keys(data[0]);
    const rows = data.map((r) => keys.map((k) => replaceDelimiter(r[k])).join(delimiter));
    return `${keys.join(delimiter)}\n${rows.join('\n')}`;
  }
}
