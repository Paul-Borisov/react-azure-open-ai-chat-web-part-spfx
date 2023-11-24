import { IODataCamlQuery } from 'shared/model/IODataCamlQuery';

export default class CamlHelper {
  public static composeCamlQuery(query: IODataCamlQuery): string {
    return query.fullCamlQuery
      ? query.fullCamlQuery
      : [
          `<View ${query.recursive ? 'Scope="RecursiveAll"' : ''}>`,
          query.viewFields?.length
            ? `<ViewFields>${query.viewFields.map((name) => `<FieldRef Name="${name}"/>`).join('')}</ViewFields>`
            : '',
          query.rowLimit ? `<RowLimit>${query.rowLimit}</RowLimit>` : '',
          query.where
            ? `<Query><Where>${query.where.replace(/^<Where>/i, '').replace(/<\/Where>$/i, '')}</Where>`
            : `<Query><Where/>`,
          query.orderBy
            ? `<OrderBy><FieldRef Name="${query.orderBy}" Ascending="${query.orderByDescending ? 'False' : 'True'}"/></OrderBy>`
            : '',
          '</Query>',
          '</View>',
        ].join('');
  }
}
