import GraphQueries from 'shared/constants/GraphQueries';
import SearchResultMapper from 'shared/mappers/SearchResultMapper';
import { IODataQuery } from 'shared/model/IODataQuery';
import { FunctionCallingOptions } from 'shared/model/enums/FunctionCallingOptions';
import AadService from 'shared/services/AadApiService';
import LogService from 'shared/services/LogService';
import SessionStorageService from 'shared/services/SessionStorageService';
import SharepointService from 'shared/services/SharepointService';

export interface IFunctionCalling {
  id?: string;
  name: string;
  arguments: string;
}

const getCsvContent = (data: any[]): string => {
  const results = SearchResultMapper.mapToCsv(data);
  if (results?.length <= 512 * 1024) {
    // Max allowed CSV-data length to be stored into user's session should not exceed 0.5 MB.
    try {
      SessionStorageService.setData(SessionStorageService.keys.rawResults, results);
    } catch (e) {
      LogService.debug(e);
    }
  }
  return results;
};

// People search: all users with the name Magnus. Roles and emails.
// Get company users that have names starting with P. Format the results as an HTML table. => companyUsers
// SharePoint search: Resource Management System. Format the results as an HTML table. => searchSharepoint
// Search in SharePoint for "Tender Appendix D-Administration Requirements". Format the results as an HTML table. => searchSharepoint
// Search in SharePoint for "Resource Management System". Format the results as an HTML table. => searchSharepoint
// Date and time now => currentDateAndTime, currentDateOrTime
export default class FunctionHelper {
  private static available: { [key: string]: any } = {
    currentDateOrTime: this.currentDateOrTime,
    currentDateAndTime: this.currentDateAndTime,
    companyUsers: this.companyUsers,
    peopleSearch: this.companyUsers,
    searchSharepoint: this.searchSharepoint,
  };

  public static async call(allFunctions: IFunctionCalling[]): Promise<string[]> {
    if (!allFunctions?.length) return Promise.resolve(undefined);

    const returnValue: string[] = [];
    for (let i = 0; i < allFunctions.length; i++) {
      const functionCalling = allFunctions[i];
      if (functionCalling?.name) {
        const func = FunctionHelper.available[functionCalling.name];
        if (func) {
          let args;
          try {
            args = functionCalling.arguments
              ? JSON.parse(functionCalling.arguments.substring(functionCalling.arguments.lastIndexOf('}{') + 1))
              : {};
          } catch (e) {}
          returnValue.push(await func(args));
        }
      }
    }
    return Promise.resolve(returnValue);
  }

  public static getExtendedMessages(
    json: any,
    messages: any[],
    functionCalling: IFunctionCalling[],
    functionCallingResults: string[]
  ): any[] {
    const extendedMessages = [...messages];

    const toolCalls = functionCalling.some((t) => t.id);

    if (json?.choices?.length && json.choices[0].message) {
      json.choices[0].message['content'] = null;
      extendedMessages.push(json.choices[0].message);
    } else {
      if (!toolCalls) {
        functionCalling.forEach((func) => {
          extendedMessages.push({
            role: 'assistant',
            content: null,
            function_call: {
              name: func.name,
              arguments: func.arguments,
            },
          });
        });
      } else {
        extendedMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: functionCalling.map((func) => ({
            id: func.id,
            type: 'function',
            function: {
              name: func.name,
              arguments: func.arguments,
            },
          })),
        });
      }
    }

    functionCallingResults.forEach((value, index) => {
      if (!toolCalls) {
        extendedMessages.push({
          role: 'function',
          name: functionCalling[index].name,
          content: value,
        });
      } else {
        extendedMessages.push({
          tool_call_id: functionCalling[index].id,
          role: 'tool',
          name: functionCalling[index].name,
          content: value,
        });
      }
    });

    return extendedMessages;
  }

  private static async companyUsers(args: { myColleagues: boolean }): Promise<string> {
    const query: IODataQuery = args.myColleagues ? GraphQueries.myWorkingWithColleagues : GraphQueries.users;
    const orgPeople = await AadService.getData(query).then((data: any[]) => {
      data = args.myColleagues
        ? data.filter((a) => a.displayName && a.jobTitle)
        : data.filter((a) => a.imAddresses?.length > 0 && a.jobTitle);
      return data
        .sort((a, b) => (a.displayName > b.displayName ? 1 : a.displayName < b.displayName ? -1 : 0))
        .map((person) => {
          const entry = {
            name: person.displayName,
            title: person.jobTitle,
            mail: person.userPrincipalName,
            //id: person.id,
          };
          return entry;
        });
    });

    //return Promise.resolve(JSON.stringify(orgPeople));
    const results = getCsvContent(orgPeople);
    return Promise.resolve(results || 'Data not found');
  }

  private static async currentDateAndTime(args: {}, locale: string = 'fi-FI'): Promise<string> {
    const date = new Date();
    return Promise.resolve(
      `${new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)} ${new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
        .format(date)
        .replace(/\./g, ':')}`
    );
  }

  private static async currentDateOrTime(args: { timeNow: boolean }, locale: string = 'fi-FI'): Promise<string> {
    const date = new Date();
    return Promise.resolve(
      args.timeNow
        ? new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
            .format(date)
            .replace(/\./g, ':')
        : new Intl.DateTimeFormat(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(date)
    );
  }

  private static async searchSharepoint(args: { queryText: string }): Promise<string> {
    const data = await SharepointService.searchSharepoint(args.queryText, ['Title', 'Author', 'Size', 'Path']);
    const csvResults = getCsvContent(data);

    //return Promise.resolve(JSON.stringify(results));
    return Promise.resolve(csvResults);
  }

  public static ensureFunctionCalling(options: FunctionCallingOptions, commonParameters: any): IFunctionCalling[] {
    if (!options || !commonParameters) return undefined;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'currentDateOrTime',
          description: 'Get current date or time in separate requests',
          parameters: {
            type: 'object',
            properties: {
              timeNow: {
                type: 'boolean',
                description: 'If true then get current time else get current date',
              },
            },
            required: ['timeNow'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'currentDateAndTime',
          description: 'Get current date and time altogether',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'companyUsers',
          description: 'Search for company users, employees, people, persons.',
          parameters: {
            type: 'object',
            properties: {
              myColleagues: {
                type: 'boolean',
                description: 'If true then get only my close colleagues else get company users, employees, people, persons.',
              },
            },
            required: ['myColleagues'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'peopleSearch',
          description: 'Search for company users, employees, people, persons.',
          parameters: {
            type: 'object',
            properties: {
              myColleagues: {
                type: 'boolean',
                description: 'If true then get only my close colleagues else get company users, employees, people, persons.',
              },
            },
            required: ['myColleagues'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'searchSharepoint',
          description: 'Get data from SharePoint search API',
          parameters: {
            type: 'object',
            properties: {
              queryText: {
                type: 'string',
                description: 'Text to search data for',
              },
            },
            required: ['queryText'],
          },
        },
      },
    ];
    if (options === FunctionCallingOptions.multiple) {
      commonParameters['tools'] = tools;
      commonParameters['tool_choice'] = 'auto';
    } else {
      commonParameters['functions'] = tools.map((t) => t.function);
    }

    const functionCalling: IFunctionCalling[] = [];
    return functionCalling;
  }
}
