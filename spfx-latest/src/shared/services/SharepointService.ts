import { HttpClient, ISPHttpClientOptions, SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import CamlHelper from 'shared/helpers/CamlHelper';
import UrlHelper from 'shared/helpers/UrlHelper';
import AzureServiceResponseMapper from 'shared/mappers/AzureServiceResponseMapper';
import { mapSPListData } from 'shared/mappers/ChatMessageMapper';
import SearchResultMapper from 'shared/mappers/SearchResultMapper';
import { IChatHistory, IChatMessage } from 'shared/model/IChat';
import { IODataCamlQuery } from 'shared/model/IODataCamlQuery';
import { IODataQuery } from 'shared/model/IODataQuery';
import { FieldGuids } from 'shared/model/enums/FieldGuids';
import { FieldNames } from 'shared/model/enums/FieldNames';
import { FieldTypes } from 'shared/model/enums/FieldTypes';
import LogService from './LogService';
import PageContextService from './PageContextService';

interface IChatsList {
  listExists: boolean;
  listTitle: string;
  webUrl: string;
}

export default class SharepointService {
  public listUrl: string = `${PageContextService.context.pageContext.web.absoluteUrl}/Lists/dbChats`;
  public imageLibraryUrl: string = `${PageContextService.context.pageContext.web.absoluteUrl}/ChatImages`;
  private webUrl: string;
  private listTitle: string;

  public async init(listUrl: string = this.listUrl) {
    const config = await this.getListTitleByUrl(listUrl);
    //if (config.listExists) {
    this.webUrl = config.webUrl;
    this.listTitle = config.listTitle;
    //}
  }

  public async getListTitleByUrl(listUrl: string = this.listUrl): Promise<IChatsList> {
    const re = /\/[^/]+\.aspx$/i; // If full URL of a list view has been added with "copy-paste".
    if (re.test(listUrl)) {
      listUrl = listUrl.replace(re, '');
    }

    const re1 = /\/lists\/.+/i;
    let webUrl = re1.test(listUrl) ? listUrl.replace(re1, '') : listUrl.substring(0, listUrl.lastIndexOf('/'));
    if (/\/sites\/*?$/i.test(webUrl)) {
      webUrl = listUrl.replace(/\/+$/, '');
      listUrl = '';
    }
    LogService.debug('SharepointService', `webUrl=${webUrl}`);

    const serverRelativeUrl = UrlHelper.getServerRelativeUrl(listUrl).toLocaleLowerCase();
    const endpoint = `${webUrl}/_api/web/lists?$expand=RootFolder&$select=Title,RootFolder/ServerRelativeUrl`;
    return PageContextService.context.spHttpClient
      .get(endpoint, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        if (response.ok) {
          return response.json();
        } else {
          return undefined;
        }
      })
      .then((json) => {
        if (json && json.value) {
          const listTitle = json.value.find(
            (list) => list.RootFolder.ServerRelativeUrl.toLocaleLowerCase() === serverRelativeUrl
          )?.Title;
          LogService.debug('SharepointService', `listTitle=${listTitle}`);
          return {
            listExists: !!listTitle,
            listTitle: listTitle || listUrl.substring(listUrl.lastIndexOf('/') + 1),
            webUrl: webUrl,
          } as IChatsList;
        } else {
          return {
            listExists: false,
            listTitle: '',
            webUrl: webUrl,
          } as IChatsList;
        }
      })
      .catch((error) => {
        LogService.error(`Error getting data from ${endpoint}`, error);
        return {
          listExists: false,
          listTitle: '',
          webUrl: webUrl,
        } as IChatsList;
      });
  }

  private getListItems(query: IODataCamlQuery): Promise<any> {
    const requestUrl: string = `${
      this.webUrl ? this.webUrl.replace(/\/+$/, '') : PageContextService.webUrlAbsolute
    }/_api/web/lists/getbytitle('${this.listTitle}')/getitems`;
    const options: ISPHttpClientOptions = {
      headers: { 'odata-version': '3.0' },
      body: `{'query': { 
        '__metadata': { 'type': 'SP.CamlQuery' },
        'ViewXml': '${CamlHelper.composeCamlQuery(query)}'
       }}`,
    };
    return PageContextService.context.spHttpClient
      .post(requestUrl, SPHttpClient.configurations.v1, options)
      .then((response: SPHttpClientResponse) => {
        if (response.ok) {
          return response.json();
        } else {
          response.json().then((json) => {
            const errorDetails = JSON.stringify(json);
            LogService.error(JSON.stringify(errorDetails));
            try {
              AzureServiceResponseMapper.saveErrorDetails(errorDetails);
            } catch (e) {}
          });
          return undefined;
        }
      })
      .then((json) => {
        if (json) {
          const returnValue = json.value || json;
          return returnValue;
        } else {
          return undefined;
        }
      })
      .catch((error) => {
        LogService.error(`Error getting data from ${requestUrl}`, error);
      });
  }

  private async getChatMessages(shared?: boolean): Promise<IChatMessage[]> {
    const userId = PageContextService.context.pageContext.aadInfo.userId.toString();
    const query: IODataCamlQuery = {
      orderBy: FieldNames.modified,
      orderByDescending: true,
      //recursive: false,
      //rowLimit: 100,
      viewFields: [
        FieldNames.id,
        FieldNames.name,
        FieldNames.userName,
        FieldNames.message,
        FieldNames.created,
        FieldNames.modified,
        FieldNames.enabled,
        FieldNames.shared,
        FieldNames.displayName,
        FieldNames.sharedWith,
      ],
      where: !shared
        ? `<Eq><FieldRef Name="${FieldNames.userName}"/><Value Type="Text">${userId}</Value></Eq>`
        : `<Eq><FieldRef Name="${FieldNames.shared}"/><Value Type="bit">true</Value></Eq>`,
    };
    const json = await this.getListItems(query);
    return json ? mapSPListData(json) : undefined;
  }

  public async postData(
    query: IODataQuery,
    payload: any,
    method?: string,
    etag?: string,
    suppressErrors?: boolean,
    additionalHeaders?: any,
    isBinaryPayload?: boolean
  ): Promise<SPHttpClientResponse> {
    const composeUrl = (query: IODataQuery): string => {
      const siteUrl = query.isSiteRelative === false ? '' : PageContextService.siteUrlServerRelative;
      return `${siteUrl}${query.endpoint}${query.select ? '&$select=' + query.select : ''}${
        query.expand ? '&$expand=' + query.expand : ''
      }${query.filter ? '&$filter=' + query.filter : ''}${query.orderby ? '&$orderby=' + query.orderby : ''}${
        query.top ? '&$top=' + query.top : ''
      }${query.customQueryString ? '&' + query.customQueryString : ''}`.replace('&$', '?$');
    };

    const url = composeUrl(query);
    const headers: any = { 'Content-length': JSON.stringify(payload).length };
    if (etag) {
      headers['IF-MATCH'] = etag;
    }
    if (method) {
      headers['X-HTTP-Method'] = method;
    }
    if (additionalHeaders) {
      Object.keys(additionalHeaders).map((k) => {
        headers[k] = additionalHeaders[k];
      });
    }
    const options = { headers };
    if (payload) {
      if (!isBinaryPayload) {
        options['body'] = typeof payload === 'object' ? JSON.stringify(payload) : payload;
      } else {
        options['body'] = payload;
      }
    }
    return PageContextService.context.spHttpClient
      .post(url, SPHttpClient.configurations.v1, options)
      .then((response: SPHttpClientResponse): any => {
        if (!response.ok) {
          if (response.statusText) {
            throw Error(response.statusText);
          }
          if (response.status === 429) {
            throw { status: 429, message: 'Too many requests', retryAfter: response.headers.get('retry-after') };
          }
          if (response.headers.get('content-type') && response.headers.get('content-type').indexOf('text/plain') > -1) {
            return response.text().then((text) => {
              throw Error(text);
            });
          } else {
            return response.json().then((json) => {
              throw Error(json.error ? json.error.message : response.status.toString());
            });
          }
        }
        //LogService.debug('postData', url, payload);
        return response;
      })
      .catch((error) => {
        if (!suppressErrors) {
          LogService.error(`Error posting data in ${query.endpoint}`, error, payload);
          throw error;
        }
      });
  }

  private async systemUpdate(id: string, formValues: any[], modified: string, callback: () => void) {
    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: `${this.webUrl}/_api/web/lists/getbytitle('${this.listTitle}')/items(${id})/ValidateUpdateListItem`,
    };

    return this.postData(query, { formValues }, 'POST', '*').then((response) => {
      if (response.ok) {
        if (callback) callback();
        if (modified) {
          // https://github.com/SharePoint/sp-dev-docs/issues/4917
          const formValues = [
            {
              ErrorMessage: null,
              FieldName: FieldNames.modified,
              //FieldValue: '24/10/2023 18:00',
              FieldValue: modified.replace(/T/, ' '),
              HasException: false,
            },
          ];
          this.postData(query, { formValues }, 'POST', '*');
        }
      }
    });
  }

  public async loadChatHistory(callback: (data: IChatMessage[]) => void, shared?: boolean) {
    let messages = await this.getChatMessages(shared);
    //console.log(messages);
    if (messages) {
      messages = messages.filter((m) => m.enabled);
      const userId = PageContextService.context.pageContext.aadInfo.userId.toString();
      callback(
        shared
          ? messages.filter((m) => m.shared && (m.username === userId || !m.sharedWith || m.sharedWith.indexOf(userId) > -1))
          : messages
      );
    } else {
      callback(undefined);
    }
  }

  public async createChat(newChatName: string, newChatHistory: IChatHistory[], callback: (newId: string) => void) {
    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: `${this.webUrl}/_api/web/lists/getbytitle('${this.listTitle}')/items`,
    };
    const payload = {
      [FieldNames.name]: newChatName,
      [FieldNames.userName]: PageContextService.context.pageContext.aadInfo.userId.toString(),
      [FieldNames.message]: JSON.stringify(newChatHistory),
      [FieldNames.enabled]: 'true',
      [FieldNames.displayName]: PageContextService.context.pageContext.user.displayName,
    };
    this.postData(query, payload, 'POST', '*').then((response) => {
      if (response.ok) {
        response.json().then((json) => {
          const newItem = mapSPListData([json])?.[0];
          if (callback) callback(newItem.id);
        });
      } else {
      }
    });
  }

  public async deleteChat(id: string, callback: () => void) {
    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: `${this.webUrl}/_api/web/lists/getbytitle('${this.listTitle}')/items(${id})`,
    };
    const payload = {
      [FieldNames.enabled]: 'false',
    };
    this.postData(query, payload, 'MERGE', '*').then((response) => {
      if (response.ok) {
        if (callback) callback();
      }
    });
  }

  public async updateChatHistory(id: string, newChatHistory: IChatHistory[], callback: () => void, modified?: string) {
    const formValues = [
      {
        ErrorMessage: null,
        FieldName: FieldNames.message,
        FieldValue: JSON.stringify(newChatHistory),
        HasException: false,
      },
    ];
    return this.systemUpdate(id, formValues, modified, callback);
  }

  public async updateChatName(id: string, newChatHName: string, modified: string, callback: () => void) {
    const formValues = [
      {
        ErrorMessage: null,
        FieldName: FieldNames.name,
        FieldValue: newChatHName,
        HasException: false,
      },
    ];
    return this.systemUpdate(id, formValues, modified, callback);
  }

  public async shareChat(id: string, share: boolean, shareWith: string[], modified: string, callback: () => void) {
    const formValues = [
      {
        ErrorMessage: null,
        FieldName: FieldNames.shared,
        FieldValue: !!share ? 'true' : 'false',
        HasException: false,
      },
      {
        ErrorMessage: null,
        FieldName: FieldNames.sharedWith,
        FieldValue: shareWith?.join(';'),
        HasException: false,
      },
    ];
    return this.systemUpdate(id, formValues, modified, callback);
  }

  public async createImageLibrary(
    listUrl: string = this.imageLibraryUrl,
    callback: (errorMessage: string) => void,
    force?: boolean
  ) {
    const config = await this.getListTitleByUrl(listUrl);
    if (!config) return;

    const listTitle = config.listTitle;
    const webUrl = config.webUrl;

    const endpoint = `${webUrl}/_api/web/lists?$filter=Title eq '${listTitle}'`;
    const lists = await PageContextService.context.spHttpClient
      .get(endpoint, SPHttpClient.configurations.v1)
      .then((r) => (r.ok ? r.json() : undefined));
    if (!lists) return;

    if (lists.value.length > 0 && !config.listExists) {
      const errorMessage = `${strings.TextInvalidListUrl} ${webUrl}`;
      LogService.error(null, errorMessage);
      if (callback) callback(errorMessage);
      return;
    }

    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: `${webUrl}/_api/web/lists`,
    };
    if (lists.value.length === 0) {
      const payload = {
        BaseTemplate: 101,
        Description: 'Chat images',
        Title: listTitle,
        NoCrawl: true,
      };
      await this.postData(query, payload, 'POST', '*');

      /*try {
        const serverRelativeUrl = UrlHelper.getServerRelativeUrl(listUrl);
        if (!/\/lists\//i.test(serverRelativeUrl)) {
          // Custom list was created under /Lists/... but listUrl looks different in settings. Correcting the mismatch.
          query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/RootFolder/MoveTo('${serverRelativeUrl}')`;
          await this.postData(query, {}, 'POST', '*');
        }
      } catch (e) {}*/

      // Break role imheritance and set Contribute permissions for "Everyone except external users"
      await this.ensureListPermissionsForEveryone(webUrl, listTitle);
    } else if (!force) {
      if (callback) callback(strings.TextListExists);
      return;
    }

    const removeViewField = async (name: string) => {
      const query: IODataQuery = {
        isSiteRelative: false,
        endpoint: `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview/viewfields/removeviewfield('${name}')`,
      };
      try {
        await this.postData(query, {}, 'POST', '*', true);
      } catch (e) {}
    };

    const addViewField = async (name: string) => {
      await removeViewField(name);
      const query: IODataQuery = {
        isSiteRelative: false,
        endpoint: `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview/viewfields/addviewfield('${name}')`,
      };
      await this.postData(query, {}, 'POST', '*');
    };

    await removeViewField('Modified');
    await removeViewField('Editor');
    await addViewField('Created');
    await addViewField('FileSizeDisplay');
    try {
      const updateDateFields = [
        {
          Id: FieldGuids.created,
          FriendlyDisplayFormat: 1, // 1 - Standard, 2 - Friendly, 0 - undefined (default is Friendly)
        },
        {
          Id: FieldGuids.modified,
          FriendlyDisplayFormat: 1,
        },
      ];

      for (const props of updateDateFields) {
        query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/fields/getbyid('${props.Id}')`;
        await this.postData(query, { FriendlyDisplayFormat: props.FriendlyDisplayFormat }, 'MERGE', '*');
      }
    } catch (e) {}

    query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview`;
    await this.postData(query, { ViewQuery: '<OrderBy><FieldRef Name="ID" Ascending="FALSE" /></OrderBy>' }, 'PATCH', '*');

    if (callback) callback('');
  }

  public async createListForChats(
    listUrl: string = this.listUrl,
    sharing: boolean,
    callback: (errorMessage: string) => void,
    force?: boolean
  ) {
    const config = await this.getListTitleByUrl(listUrl);
    if (!config) return;

    const listTitle = config.listTitle;
    const webUrl = config.webUrl;

    const endpoint = `${webUrl}/_api/web/lists?$filter=Title eq '${listTitle}'`;
    const lists = await PageContextService.context.spHttpClient
      .get(endpoint, SPHttpClient.configurations.v1)
      .then((r) => (r.ok ? r.json() : undefined));
    if (!lists) return;

    if (lists.value.length > 0 && !config.listExists) {
      const errorMessage = `${strings.TextInvalidListUrl} ${webUrl}`;
      LogService.error(null, errorMessage);
      if (callback) callback(errorMessage);
      return;
    }

    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: `${webUrl}/_api/web/lists`,
    };
    if (lists.value.length === 0) {
      const payload = {
        BaseTemplate: 100,
        Description: 'Azure OpenAI Chats',
        Title: listTitle,
        WriteSecurity: 2,
        NoCrawl: true,
      };
      await this.postData(query, payload, 'POST', '*');

      try {
        const serverRelativeUrl = UrlHelper.getServerRelativeUrl(listUrl);
        if (!/\/lists\//i.test(serverRelativeUrl)) {
          // Custom list was created under /Lists/... but listUrl looks different in settings. Correcting the mismatch.
          query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/RootFolder/MoveTo('${serverRelativeUrl}')`;
          await this.postData(query, {}, 'POST', '*');
        }
      } catch (e) {}

      // Read access: Read all items | Read items that were created by the user (sharing: true | false)
      // Break role imheritance and set Contribute permissions for "Everyone except external users"
      await this.updateListForChats(listUrl, sharing, undefined);
    } else if (!force) {
      if (callback) callback(strings.TextListExists);
      return;
    }

    query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/fields`;
    const newFields = [
      {
        Title: FieldNames.userName,
        FieldTypeKind: FieldTypes.Text,
      },
      {
        Title: FieldNames.message,
        FieldTypeKind: FieldTypes.Note,
      },
      {
        Title: FieldNames.enabled,
        FieldTypeKind: FieldTypes.Boolean,
        DefaultValue: '1',
      },
      {
        Title: FieldNames.shared,
        FieldTypeKind: FieldTypes.Boolean,
        DefaultValue: '0',
      },
      {
        Title: FieldNames.displayName,
        FieldTypeKind: FieldTypes.Text,
      },
      {
        Title: FieldNames.sharedWith,
        FieldTypeKind: FieldTypes.Note,
      },
    ];

    for (const payload of newFields) {
      const endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/fields?$filter=StaticName eq '${payload.Title}'`;
      const json = await PageContextService.context.spHttpClient
        .get(endpoint, SPHttpClient.configurations.v1)
        .then((r) => r.json());
      if (!json.value.length) {
        await this.postData(query, payload, 'POST', '*');
      }
    }

    const updateFields = [
      {
        Title: FieldNames.userName,
        MaxLength: 36,
      },
      {
        Title: FieldNames.displayName,
        MaxLength: 50,
      },
    ];

    for (const props of updateFields) {
      query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/fields/getbytitle('${props.Title}')`;
      await this.postData(query, { MaxLength: props.MaxLength }, 'MERGE', '*');
    }

    const removeViewField = async (name: string) => {
      const query: IODataQuery = {
        isSiteRelative: false,
        endpoint: `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview/viewfields/removeviewfield('${name}')`,
      };
      try {
        await this.postData(query, {}, 'POST', '*', true);
      } catch (e) {}
    };

    const addViewField = async (name: string) => {
      await removeViewField(name);
      const query: IODataQuery = {
        isSiteRelative: false,
        endpoint: `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview/viewfields/addviewfield('${name}')`,
      };
      await this.postData(query, {}, 'POST', '*');
    };

    await addViewField('ID');
    await addViewField('LinkTitle');
    for (const props of newFields) {
      await addViewField(props.Title);
    }
    await addViewField('Created');
    await addViewField('Modified');
    try {
      const updateDateFields = [
        {
          Id: FieldGuids.created,
          FriendlyDisplayFormat: 1, // 1 - Standard, 2 - Friendly, 0 - undefined (default is Friendly)
        },
        {
          Id: FieldGuids.modified,
          FriendlyDisplayFormat: 1,
        },
      ];

      for (const props of updateDateFields) {
        query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/fields/getbyid('${props.Id}')`;
        await this.postData(query, { FriendlyDisplayFormat: props.FriendlyDisplayFormat }, 'MERGE', '*');
      }
    } catch (e) {}

    query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview`;
    await this.postData(query, { ViewQuery: '<OrderBy><FieldRef Name="ID" Ascending="FALSE" /></OrderBy>' }, 'PATCH', '*');

    if (callback) callback('');
  }

  public async doesListExist(listUrl: string = this.listUrl): Promise<boolean> {
    const config = await this.getListTitleByUrl(listUrl);
    return Promise.resolve(config?.listExists ? true : false);
  }

  public async ensureListPermissionsForEveryone(webUrl: string, listTitle: string) {
    const endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/BreakRoleInheritance(CopyRoleAssignments=false,ClearSubscopes=true)`;
    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: endpoint,
    };
    // Remove permission inheritance and grant special permissions to Everyone except external users
    try {
      await this.postData(query, {}, 'POST', '*');
      const everyone = `c:0-.f|rolemanager|spo-grid-all-users/${PageContextService.context.pageContext.aadInfo.tenantId.toString()}`;
      query.endpoint = `${webUrl}/_api/web/ensureuser('${everyone}')`;
      const json = await this.postData(query, {}, 'POST', '*').then((r) => r.json());
      // https://sharepointcass.com/2021/04/22/sharepoint-online-rest-apis-part-vi-permissions/
      query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/RoleAssignments/AddRoleAssignment(PrincipalId=${json.Id},RoleDefId=1073741827)`;
      await this.postData(query, {}, 'POST', '*');
    } catch (e) {
      LogService.error(e);
    }
  }

  public async updateImageLibrary(listUrl: string = this.imageLibraryUrl, callback: (errorMessage: string) => void) {
    const config = await this.getListTitleByUrl(listUrl);
    if (!config) return;
    if (!config.listExists) {
      if (callback) callback(strings.TextListDoesNotExist);
      return;
    }

    await this.ensureListPermissionsForEveryone(config.webUrl, config.listTitle);
    if (callback) callback('');
  }

  public async updateListForChats(listUrl: string = this.listUrl, sharing: boolean, callback: (errorMessage: string) => void) {
    const config = await this.getListTitleByUrl(listUrl);
    if (!config) return;
    if (!config.listExists) {
      if (callback) callback(strings.TextListDoesNotExist);
      return;
    }

    const listTitle = config.listTitle;
    const webUrl = config.webUrl;

    const endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')`;
    const payload = {
      // If the sharing option is required, the list should be created with "Read access: Read all items".
      // Otherwise the more secure option "Read access: Read items that were created by the user" should be used.
      ReadSecurity: !sharing ? 2 : 1,
    };

    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: endpoint,
    };
    const message = await this.postData(query, payload, 'PATCH', '*').then((response) => {
      if (response.ok) {
        return '';
      } else {
        return response.json().then((error) => JSON.stringify(error));
      }
    });

    // Remove permission inheritance and grant special permissions to Everyone except external users
    try {
      query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/BreakRoleInheritance(CopyRoleAssignments=false,ClearSubscopes=true)`;
      await this.postData(query, {}, 'POST', '*');
      const everyone = `c:0-.f|rolemanager|spo-grid-all-users/${PageContextService.context.pageContext.aadInfo.tenantId.toString()}`;
      query.endpoint = `${webUrl}/_api/web/ensureuser('${everyone}')`;
      const json = await this.postData(query, {}, 'POST', '*').then((r) => r.json());
      // https://sharepointcass.com/2021/04/22/sharepoint-online-rest-apis-part-vi-permissions/
      query.endpoint = `${webUrl}/_api/web/lists/getbytitle('${listTitle}')/RoleAssignments/AddRoleAssignment(PrincipalId=${json.Id},RoleDefId=1073741827)`;
      await this.postData(query, {}, 'POST', '*');
    } catch (e) {}

    if (callback) callback(message);
  }

  public static async searchSharepoint(
    queryText: string,
    propertyNames: string[],
    rowLimit: number = 20,
    strict: boolean = true
  ): Promise<any[]> {
    const endpoint = `${PageContextService.context.pageContext.web.absoluteUrl}/_api/search/postquery`;
    const requestHeaders: Headers = new Headers();
    requestHeaders.append('accept', 'application/json;odata=nometadata');
    requestHeaders.append('odata-version', '3.0');
    const body = {
      request: {
        Querytext: strict ? `"${(queryText || '*').replace(/^"+/, '').replace(/"+$/, '')}"` : queryText || '*',
        RowLimit: rowLimit,
        ClientType: 'ContentSearchRegular',
      },
    };

    const options: ISPHttpClientOptions = {
      headers: {
        accept: 'application/json;odata=verbose',
        'odata-version': '3.0',
      },
      body: JSON.stringify(body),
    };

    const json = await PageContextService.context.spHttpClient
      .post(endpoint, SPHttpClient.configurations.v1, options)
      .then((r) => r.json());

    const results = SearchResultMapper.mapSearchResultsOfSharepoint(json, propertyNames);
    return Promise.resolve(results);
  }

  public async saveImage(imageUrl: string, storageUrl: string, fileExtension: string = 'png'): Promise<string> {
    const arrayBuffer = await PageContextService.context.httpClient
      .get(imageUrl, HttpClient.configurations.v1, {})
      .then((response) => response.arrayBuffer().then((buffer) => buffer));

    const fileName = `${(crypto as any).randomUUID()}.${fileExtension}`;

    let webUrl: string;
    let serverRelativeFolderUrl: string;
    if (storageUrl) {
      const rootFolderUrl: string = storageUrl.replace(/\/(lists)|(forms)\/.+/i, '').replace(/\/+$/, '');
      webUrl = rootFolderUrl.substring(0, rootFolderUrl.lastIndexOf('/'));
      serverRelativeFolderUrl = new URL(rootFolderUrl).pathname;
    } else {
      webUrl = PageContextService.context.pageContext.web.absoluteUrl;
      serverRelativeFolderUrl = new URL(this.imageLibraryUrl).pathname;
    }

    const query: IODataQuery = {
      isSiteRelative: false,
      endpoint: `${webUrl}/_api/web/GetFolderByServerRelativeUrl('${serverRelativeFolderUrl}')/files/add(url='${fileName}',overwrite=true)`,
    };

    const response = await this.postData(query, arrayBuffer, 'POST', undefined, undefined, undefined, true);
    if (response.ok) {
      return Promise.resolve(`${serverRelativeFolderUrl}/${fileName}`);
    } else {
      return Promise.resolve(null);
    }
    /*
    const request: XMLHttpRequest = new XMLHttpRequest();
    request.onreadystatechange = async () => {
      if (request.readyState === 4 && request.status === 200) {
        const arrayBuffer = request.response;
        const fileName = `${(crypto as any).randomUUID()}.${extension}`;
        const webUrl: string = PageContextService.context.pageContext.web.absoluteUrl;
        const serverRelativeWebUrl = PageContextService.context.pageContext.web.serverRelativeUrl;
        const serverRelativeFolderUrl: string = `${serverRelativeWebUrl.replace(/\/+$/, '')}/ChatImages`;
        const query: IODataQuery = {
          isSiteRelative: false,
          endpoint: `${webUrl}/_api/web/GetFolderByServerRelativeUrl('${serverRelativeFolderUrl}')/files/add(url='${fileName}',overwrite=true)`,
        };
        await this.postData(query, arrayBuffer, 'POST', undefined, undefined, undefined, true);
      }
    };
    request.responseType = 'arraybuffer';
    request.open('GET', imageUrl, true); // true for asynchronous xmlHttp.send(null);
    request.send(null);
    */
  }
}
