import { AadHttpClient, IHttpClientOptions } from '@microsoft/sp-http';
import { IODataQuery } from 'shared/model/IODataQuery';
import LogService from 'shared/services/LogService';
import PageContextService from 'shared/services/PageContextService';

export default class AadService {
  private static aadClient: AadHttpClient;

  public static getClientForAzureApp(appId: string): Promise<AadHttpClient> {
    return PageContextService.context.aadHttpClientFactory
      .getClient(appId)
      .then((client: AadHttpClient) => {
        return client;
      })
      .catch((error: Error) => {
        LogService.error(`Error getting the AAD client for ${appId}`, error);
        return undefined;
      });
  }

  public static getData(query: IODataQuery, endpoint?: string, resource?: string): Promise<any> {
    return this.init(resource ? resource : endpoint).then((client) => {
      const options: IHttpClientOptions = {};
      if (query.isAdvancedQuery) {
        //https://docs.microsoft.com/en-us/graph/api/application-list?view=graph-rest-1.0&tabs=http#request-headers
        //ConsistencyLevel eventual header and $count are required when using $search,
        //or when using $filter with the $orderby query parameter.
        //It uses an index that may not be up-to-date with recent changes to the object.
        query.count = true;
        const reqHeaders: HeadersInit = new Headers();
        reqHeaders.append('ConsistencyLevel', 'eventual');
        options.headers = reqHeaders;
      }

      const odataQuery = this.composeUrl(query, endpoint);

      return client
        .get(odataQuery, AadHttpClient.configurations.v1, options)
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          LogService.verbose('getData', query.endpoint, odataQuery, json);
          if (json.error) {
            throw json.error;
          }
          return json.value || json;
        })
        .catch((error) => {
          LogService.error(`Error getting data from ${query.endpoint}`, error);
          throw error;
        });
    });
  }

  private static init(resource: string): Promise<AadHttpClient> {
    if (!this.aadClient) {
      return PageContextService.context.aadHttpClientFactory
        .getClient(resource || 'https://graph.microsoft.com')
        .then((client: AadHttpClient) => {
          this.aadClient = client;
          return client;
        })
        .catch((error: Error) => {
          LogService.error('Error getting the AAD client', error);
          throw error;
        });
    } else {
      return Promise.resolve(this.aadClient);
    }
  }

  private static composeUrl(query: IODataQuery, endpoint: string): string {
    return `${endpoint || 'https://graph.microsoft.com'}${query.version ? '/' + query.version : ''}${query.endpoint}${
      query.select ? '&$select=' + query.select : ''
    }${query.filter ? '&$filter=' + query.filter : ''}${query.orderby ? '&$orderby=' + query.orderby : ''}${
      query.top ? '&$top=' + query.top : ''
    }${query.count ? '&$count=' + query.count : ''}${query.customQueryString ? '&' + query.customQueryString : ''}`.replace(
      '&$',
      '?$'
    );
  }
}
