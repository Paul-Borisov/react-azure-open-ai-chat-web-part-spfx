export default class SearchResultMapper {
  public static delimiter = ',';

  private static findChildByPath(parent: any, path: string, separator: string = '.'): any {
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev?.[curr], parent);
  }

  public static mapSearchResultsOfBing(data: any, keys: string[]): any {
    const returnValue = {};
    if (!data) return returnValue;

    keys.forEach((k) => {
      const dataPart = data[k];
      if (dataPart) returnValue[k] = dataPart;
    });

    return Object.keys(returnValue).length > 0 ? returnValue : data;
  }

  public static mapCustomSearchResultsOfGoogle(data: any, keys: string[]): any[] {
    const returnValue = [];
    if (!data?.items) return returnValue;

    data.items.forEach((item) => {
      const dataItem = {};
      keys.forEach((k) => {
        const dataPart = k.indexOf('.') === -1 ? item[k] : this.findChildByPath(item, k);
        if (dataPart) dataItem[k] = dataPart;
      });
      if (Object.keys(dataItem).length > 0) {
        returnValue.push(dataItem);
      }
    });

    return returnValue.length > 0 ? returnValue : [data];
  }

  public static mapSearchResultsOfSharepoint(data: any, propertyNames: string[]): any[] {
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
