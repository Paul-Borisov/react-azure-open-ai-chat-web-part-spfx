import { IFunctionCalling } from 'shared/helpers/FunctionHelper';
import SessionStorageService from 'shared/services/SessionStorageService';

// Maps Azure Open AI service response to results
export default class AzureServiceResponseMapper {
  public static mapResponseQueryImage(data: any): string[] {
    const results = data?.result?.data;
    if (results?.length === 1) {
      return [results[0].url];
    } else if (results?.length > 1) {
      return results.map((r) => r.url);
    } else {
      return undefined;
    }
  }

  public static mapResponseQueryText(data: any): string {
    const texts: string = data?.choices?.map(
      (choice: any) => (choice.text || choice.message?.content || choice.delta?.content) as string
    );
    return !texts || texts.length === 0 ? undefined : texts.length === 1 ? texts[0] : JSON.stringify(texts);
  }

  public static mapToFunctionCalling(data: any, functionCalling: IFunctionCalling[], isStreaming: boolean) {
    if (!data || !functionCalling || !data.choices?.length) return;

    const allIds = [];
    const allFunctions = [];
    if (isStreaming) {
      if (data.choices[0].delta?.tool_calls) {
        allFunctions.push(...data.choices[0].delta.tool_calls.map((tool) => tool.function).filter((f) => f));
        allIds.push(...data.choices[0].delta.tool_calls.filter((t) => t.type === 'function').map((tool) => tool.id));
      } else if (data.choices[0].delta?.function_call) {
        allFunctions.push(data.choices[0].delta.function_call);
      }
    } else {
      if (data.choices[0].message?.tool_calls) {
        allFunctions.push(...data.choices[0].message.tool_calls.map((tool) => tool.function).filter((f) => f));
        allIds.push(...data.choices[0].message.tool_calls.filter((t) => t.type === 'function').map((tool) => tool.id));
      } else if (data.choices[0].message?.function_call) {
        allFunctions.push(data.choices[0].message.function_call);
      }
    }
    for (let i = 0; i < allFunctions.length; i++) {
      const id = allIds.length > i ? allIds[i] : undefined;
      const func = allFunctions[i];
      if (func) {
        let singleFunction: IFunctionCalling;
        if (func.name || functionCalling.length === 0) {
          singleFunction = { id: id, name: func.name, arguments: '' };
          functionCalling.push(singleFunction);
        } else {
          singleFunction = functionCalling[functionCalling.length - 1];
        }
        if (func.arguments) {
          singleFunction.arguments = (singleFunction.arguments ?? '') + func.arguments;
        }
      }
    }
  }

  public static clearErrorDetails() {
    SessionStorageService.clearData(SessionStorageService.keys.errorDetails);
  }

  public static saveErrorDetails(errorDetails: string) {
    if (!errorDetails) return;

    let message = errorDetails;
    // Use case 1: {"error":{"message":"Error message 1"}}
    // Use case 2: {"odata.error":{"code":"-1, System.ArgumentException","message":{"lang":"en-US","value":"Error message 2"}}}
    // TODO: redesign in a better way...
    const searchFor = [/"message":\s?"([^"]+)"/i, /"value":\s?"([^"]+)"/i];
    try {
      for (let i = 0; i < searchFor.length; i++) {
        const re = searchFor[i];
        if (re.test(errorDetails)) {
          const errorMessage = errorDetails.match(re)[1];
          if (errorMessage) {
            message = errorMessage;
            break;
          }
        }
      }
    } catch (e) {}
    SessionStorageService.setData(SessionStorageService.keys.errorDetails, message);
  }
}
