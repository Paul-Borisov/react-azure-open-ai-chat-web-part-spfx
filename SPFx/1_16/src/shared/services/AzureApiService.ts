import { fetchEventSource } from '@microsoft/fetch-event-source';
import { AadHttpClient, AadTokenProvider, HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { GptModels, GptModelTokenLimits } from 'shared/constants/Application';
import FunctionHelper from 'shared/helpers/FunctionHelper';
import HtmlHelper from 'shared/helpers/HtmlHelper';
import AzureServiceResponseMapper from 'shared/mappers/AzureServiceResponseMapper';
import { mapResponseData } from 'shared/mappers/ChatMessageMapper';
import { IAzureApiServiceConfig } from 'shared/model/IAzureApiServiceConfig';
import { IChatHistory, IChatMessage } from 'shared/model/IChat';
import { IItemPayload } from 'shared/model/IItemPayload';
import LogService from 'shared/services/LogService';
import AadApiService from './AadApiService';
import PageContextService from './PageContextService';
import SessionStorageService from './SessionStorageService';

// These operations with sub-URLs must be configured in APIM below APIM > Open AI > All operations.
enum Operations {
  StandardTextModel = '/chat', // gpt-3.5-turbo (URL reads as https://customer.azure-api.net/openai/chat)
  AdvancedTextModel = '/completion', // text-davinci-003
  ChatMessageLoadHistory = '/api/chatmessage/list',
  ChatMessageLoadHistoryShared = '/api/chatmessage/list/shared',
  ChatMessageCreate = '/api/chatmessage',
  ChatMessageUpdate = ChatMessageCreate,
  ChatMessageDelete = ChatMessageCreate,
}

export default class AzureApiService {
  private config: IAzureApiServiceConfig = undefined;
  private aadClient: AadHttpClient = undefined;
  private authenticate: boolean = true;

  public async init(config: IAzureApiServiceConfig, authenticate: boolean = true): Promise<boolean> {
    this.config = config;
    if (!authenticate) {
      this.authenticate = false;
      return this.isConfigured();
    } else {
      if (this.aadClient && (this.aadClient as any)._resourceUrl === config.appId) {
        //LogService.info(null, (this.aadClient as any)._resourceUrl);
        return true;
      }
      try {
        this.aadClient = await AadApiService.getClientForAzureApp(config.appId);
        //LogService.info(null, 'config.appId', config.appId);
        //LogService.info(null, 'this.aadClient', this.aadClient);
      } catch (e) {
        LogService.error(null, 'OpenAI not configured: resource (appId) is not valid', config.appId);
      }
      if (this.isConfigured()) {
        return true;
      } else {
        LogService.info(null, 'OpenAI not configured: check values for appId, endpointBaseUrlForOpenAi');
        return false;
      }
    }
  }

  public isConfigured(): boolean {
    return (this.authenticate ? this.aadClient !== undefined : true) && this.config?.endpointBaseUrl !== undefined;
  }

  public isDisabled(): boolean {
    return this.config?.isDisabled;
  }

  // Checks for a proxy URL of Azure API Management service.
  public isApiManagementUrl(url: string): boolean {
    return /\.azure-api\.net/i.test(url);
  }

  // Checks for an explicit URL of Azure OpenAI service (which can be used instead of APIM-published one).
  public isOpenAiServiceUrl(url: string): boolean {
    return /openai\.azure\.com/i.test(url);
  }

  public isOpenAiNativeUrl(url: string): boolean {
    return /api\.openai.com/i.test(url);
  }

  // /openainative and /openainative4 endpoints in APIM
  public isNative(url: string): boolean {
    return /native/i.test(url);
  }

  private adjustModels(endpointUri: string, commonParameters: any): void {
    if (this.isOpenAiNativeUrl(endpointUri) || this.isNative(endpointUri)) {
      if (/gpt-35/i.test(commonParameters.model)) {
        commonParameters.model = commonParameters.model.replace(/gpt-35/i, 'gpt-3.5');
      } else if (/gpt-4-32k/i.test(commonParameters.model)) {
        //commonParameters.model = commonParameters.model.replace(/gpt-4-32k/i, 'gpt-4');
      }
    }
  }

  public async callQueryText(
    payload: IItemPayload,
    stream?: boolean,
    callback?: (message: any, done?: boolean, isError?: boolean) => void,
    extendedMessages?: any[]
  ): Promise<string | undefined> {
    const commonParameters = {
      model: payload.model ? payload.model : 'gpt-35-turbo',
      //Number of content responses to generate.
      n: payload.choices ? payload.choices : 1,
      //temperature controls randomness. Lowering the temperature means that the model will produce more repetitive
      //and deterministic responses. Increasing the temperature will result in more unexpected or creative responses.
      //Try adjusting temperature or Top P but not both.
      temperature: 0.7,
      //top_p is similar to temperature, this controls randomness but uses a different method.
      //Lowering Top P will narrow the model’s token selection to likelier tokens.
      //Increasing Top P will let the model choose from tokens with both high and low likelihood.
      //Try adjusting temperature or Top P but not both.
      top_p: 1,
      //frequency_penalty reduces the chance of repeating a token proportionally based on how often it has appeared
      //in the text so far. This decreases the likelihood of repeating the exact same text in a response.
      frequency_penalty: 0,
      //presence_penalty reduces the chance of repeating any token that has appeared in the text at all so far.
      //This increases the likelihood of introducing new topics in a response.
      presence_penalty: 0,
      // max_tokens sets a limit on the number of tokens per model response.
      // The API supports a maximum of 4000 tokens shared between the prompt
      // (including system message, examples, message history, and user query) and the model's response.
      //One token is roughly 4 characters for typical English text (can be 3.6 or less for more sophisticated languages).
      max_tokens: payload.maxTokens || 2048,
      //Make responses stop at a desired point, such as the end of a sentence or list.
      //Specify up to four sequences where the model will stop generating further tokens in a response.
      //The returned text will not contain the stop sequence.
      stop: null,
    };
    if (stream) {
      commonParameters['stream'] = true;
    }

    // You can use direct calls to Azure Open AI instead of APIM
    const isGpt: boolean = /gpt/i.test(commonParameters.model);
    const isGpt4: boolean = /gpt-4/i.test(commonParameters.model);
    const isOpenAiService: boolean = this.isOpenAiServiceUrl(isGpt4 ? this.config.endpointBaseUrl4 : this.config.endpointBaseUrl);
    const isOpenAiNative: boolean = this.isOpenAiNativeUrl(isGpt4 ? this.config.endpointBaseUrl4 : this.config.endpointBaseUrl);
    const isNative: boolean = this.isNative(isGpt4 ? this.config.endpointBaseUrl4 : this.config.endpointBaseUrl);

    const isVision: boolean = (isNative || isOpenAiNative) && payload.images?.length > 0;
    if (isVision && commonParameters.max_tokens > GptModelTokenLimits[GptModels.Vision]) {
      // gpt-4-vision-preview has been limited to max 4096 response tokens
      commonParameters.max_tokens = GptModelTokenLimits[GptModels.Vision];
    }

    const getEndpointUrl = (baseUrl: string): string => {
      let targetUrl: string;
      if (isOpenAiService) {
        // Full endpoint URL like https://customer.openai.azure.com/openai/deployments/gpt-35-turbo-16k/chat/completions?api-version=2023-07-01-preview
        targetUrl = `${baseUrl.replace(/\/deployments\/[^/]+\//i, '/deployments/' + commonParameters.model + '/')}`;
      } else if (isOpenAiNative) {
        // Full endpoint URL like https://api.openai.com/v1/chat/completions
        targetUrl = baseUrl;
      } else {
        // APIM endpoint URL like https://customer.azure-api.net/openai
        if (isGpt4) {
          //targetUrl = `${new URL(this.config.endpointBaseUrl).origin}${Operations.GPT4}`;
          targetUrl = this.config.endpointBaseUrl4 ? this.config.endpointBaseUrl4 : this.config.endpointBaseUrl;
        } else {
          targetUrl = baseUrl;
        }
        targetUrl += isGpt ? Operations.StandardTextModel : Operations.AdvancedTextModel;
      }
      return targetUrl;
    };
    const endpointUri = getEndpointUrl(isGpt4 ? this.config.endpointBaseUrl4 : this.config.endpointBaseUrl);
    this.adjustModels(endpointUri, commonParameters); // Native OpenAI uses slightly different naming for LLMs

    const messages = extendedMessages ? extendedMessages : [];
    if (!messages.length) {
      if (!isVision) {
        messages.push({ role: 'system', content: 'You are an AI assistant that helps people find information.' });
        if (payload.chatHistory?.length > 0) messages.push(...payload.chatHistory);
        messages.push({ role: 'user', content: HtmlHelper.htmlEncode(payload.queryText) });
      } else {
        //messages.push({ role: 'system', content: 'You are an AI assistant that helps people with image recognitions.' });
        //if (payload.chatHistory?.length > 0) messages.push(...payload.chatHistory);
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: HtmlHelper.htmlEncode(payload.queryText),
            },
            ...payload.images.map((url) => ({
              type: 'image_url',
              image_url: {
                url: url,
              },
            })),
          ],
        });
      }
    }

    const functionCalling = !isVision ? FunctionHelper.ensureFunctionCalling(payload.functions, commonParameters) : undefined;

    const body = JSON.stringify(
      isGpt
        ? {
            messages: messages,
            ...(isVision
              ? { model: GptModels.Vision, max_tokens: commonParameters.max_tokens, stream: stream ? true : false }
              : commonParameters),
          }
        : {
            prompt: HtmlHelper.htmlEncode(payload.queryText),
            ...commonParameters,
          }
    );

    if (!extendedMessages) SessionStorageService.clearRawResults();

    if (!stream) {
      const requestHeaders: Headers = new Headers();
      requestHeaders.append('content-type', 'application/json');

      // If you use direct calls to Azure Open AI or native OpenAI API instead of APIM, you should provide api-key
      if (isOpenAiService && this.config.apiKey) {
        requestHeaders.append('Api-Key', this.config.apiKey);
      } else if (isOpenAiNative && this.config.apiKey) {
        requestHeaders.append('Authorization', `Bearer ${this.config.apiKey}`);
      }

      const postOptions: IHttpClientOptions = {
        headers: requestHeaders,
        //body: JSON.stringify([{ Text: text.length > 5000 ? text.substring(0, 5000) : text }]),
        body: body,
      };

      let response: HttpClientResponse = undefined;
      try {
        if (this.authenticate) {
          response = await this.aadClient.post(endpointUri, AadHttpClient.configurations.v1, postOptions);
        } else {
          response = await PageContextService.context.httpClient.post(endpointUri, HttpClient.configurations.v1, postOptions);
        }
      } catch (e) {
        LogService.error(e);
        return undefined;
      }

      if (response.ok) {
        const json = await response.json();

        if (functionCalling) {
          // If this option enabled.
          AzureServiceResponseMapper.mapToFunctionCalling(json, functionCalling, stream);
          if (functionCalling.length) {
            // If AI requested function calling.
            const functionCallingResults = await FunctionHelper.call(functionCalling);
            const newMessages = FunctionHelper.getExtendedMessages(json, messages, functionCalling, functionCallingResults);
            return await this.callQueryText(payload, stream, callback, newMessages);
          } else {
            return HtmlHelper.htmlDecode(AzureServiceResponseMapper.mapResponseQueryText(json));
          }
        } else {
          return HtmlHelper.htmlDecode(AzureServiceResponseMapper.mapResponseQueryText(json));
        }
      } else {
        const error = await response.text();
        LogService.error(error);
        AzureServiceResponseMapper.saveErrorDetails(error);
        return undefined;
      }
    } else {
      const requestHeaders = {
        accept: 'text/event-stream',
        'content-type': 'application/json',
      };
      if (this.authenticate) {
        const aadToken = await PageContextService.context.aadTokenProviderFactory
          .getTokenProvider()
          .then((tokenProvider: AadTokenProvider): Promise<string> => {
            return tokenProvider.getToken(this.config.appId);
          });
        requestHeaders['Authorization'] = `Bearer ${aadToken}`;
      }

      // If you use direct calls to Azure Open AI or native OpenAI API instead of APIM, you should provide api-key
      if (isOpenAiService && this.config.apiKey) {
        requestHeaders['Api-Key'] = this.config.apiKey;
      } else if (isOpenAiNative && this.config.apiKey) {
        requestHeaders['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const onMessage = (event) => {
        if (!event.data || /\[done\]/i.test(event.data)) return;

        const json = JSON.parse(event.data);
        AzureServiceResponseMapper.mapToFunctionCalling(json, functionCalling, stream);
        const text = HtmlHelper.htmlDecode(AzureServiceResponseMapper.mapResponseQueryText(json) || '');
        if (text && callback) {
          callback(text);
        }
      };

      const maxErrors = 1;
      let errorCounter = 0;
      try {
        fetchEventSource(endpointUri, {
          method: 'POST',
          headers: requestHeaders as any,
          body: body,
          onmessage: onMessage,
          onopen: async (response) => {
            LogService.debug(null, 'Connection opened');
            if (!response.ok) {
              try {
                response.text().then((error: string) => AzureServiceResponseMapper.saveErrorDetails(error));
              } catch (e) {}
            }
          },
          onclose: async () => {
            LogService.debug(null, 'Connection closed');
            if (functionCalling?.length) {
              const functionCallingResults = await FunctionHelper.call(functionCalling);
              const newMessages = FunctionHelper.getExtendedMessages(
                undefined,
                messages,
                functionCalling,
                functionCallingResults
              );
              this.callQueryText(payload, stream, callback, newMessages);
              //if (functionCallingResults && callback) callback(functionCallingResults);
            } else if (callback) {
              callback('', true);
            }
          },
          onerror: (error) => {
            //functionCalling.name = '';
            //functionCalling.arguments = '';
            LogService.error(error);
            if (callback) callback('', false, true);
            errorCounter++;
            if (errorCounter > maxErrors) throw 'Too many errors; disconnected.';
          },
        });
      } catch (e) {
        LogService.error(e);
        return undefined;
      }
    }
  }

  public async loadChatHistory(callback: (data: IChatMessage[]) => void, shared?: boolean) {
    const oid = window.location.search
      .split('&')
      .find((p) => p.startsWith('oid='))
      ?.replace('oid=', '');
    const endpointUri: string = !shared
      ? `${this.config.endpointBaseUrlForWebApi}${Operations.ChatMessageLoadHistory}/${
          //PageContextService.context.pageContext.user.loginName
          oid ?? PageContextService.context.pageContext.aadInfo.userId.toString() // ObjectID is more secure
        }`
      : `${this.config.endpointBaseUrlForWebApi}${Operations.ChatMessageLoadHistoryShared}`;

    let response: HttpClientResponse = undefined;
    try {
      if (this.authenticate) {
        response = await this.aadClient.get(endpointUri, AadHttpClient.configurations.v1);
      } else {
        response = await PageContextService.context.httpClient.get(endpointUri, HttpClient.configurations.v1);
      }
    } catch (e) {
      LogService.error(e);
      return undefined;
    }

    if (response.ok) {
      const json = await response.json();
      //console.log(AzureServiceResultMapper.mapResponseQueryText(json));
      //return HtmlHelper.htmlDecode(AzureServiceResponseMapper.mapResponseQueryText(json));
      callback(mapResponseData(json));
    } else {
      const error = await response.text();
      LogService.error(error);
    }
  }

  public async deleteChat(id: string, callback: () => void) {
    const endpointUri: string = `${this.config.endpointBaseUrlForWebApi}${Operations.ChatMessageDelete}/${id}`;

    let response: HttpClientResponse = undefined;
    try {
      if (this.authenticate) {
        response = await this.aadClient.fetch(endpointUri, AadHttpClient.configurations.v1, { method: 'DELETE' });
      } else {
        response = await PageContextService.context.httpClient.fetch(endpointUri, HttpClient.configurations.v1, {
          method: 'DELETE',
        });
      }
    } catch (e) {
      LogService.error(e);
      return undefined;
    }

    if (response.ok) {
      callback();
    } else {
      const error = await response.text();
      LogService.error(error);
    }
  }

  public async createChat(newChatName: string, newChatHistory: IChatHistory[], callback: (newChatGuid: string) => void) {
    const endpointUri: string = `${this.config.endpointBaseUrlForWebApi}${Operations.ChatMessageCreate}`;

    const newChatGuid = (crypto as any).randomUUID();
    const payload = {
      id: newChatGuid,
      name: newChatName,
      //username: PageContextService.context.pageContext.user.loginName,
      username: PageContextService.context.pageContext.aadInfo.userId.toString(), // ObjectID is more secure
      message: JSON.stringify(newChatHistory),
    };

    const options: IHttpClientOptions = {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    let response: HttpClientResponse = undefined;
    try {
      if (this.authenticate) {
        response = await this.aadClient.post(endpointUri, AadHttpClient.configurations.v1, options);
      } else {
        response = await PageContextService.context.httpClient.post(endpointUri, HttpClient.configurations.v1, options);
      }
    } catch (e) {
      LogService.error(e);
      return undefined;
    }

    if (response.ok) {
      callback(newChatGuid);
    } else {
      const error = await response.text();
      LogService.error(error);
    }
  }

  private async updateChat(id: string, payload: any, callback: () => void) {
    const endpointUri: string = `${this.config.endpointBaseUrlForWebApi}${Operations.ChatMessageUpdate}/${id}`;

    const options: IHttpClientOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    let response: HttpClientResponse = undefined;
    try {
      if (this.authenticate) {
        response = await this.aadClient.fetch(endpointUri, AadHttpClient.configurations.v1, options);
      } else {
        response = await PageContextService.context.httpClient.fetch(endpointUri, HttpClient.configurations.v1, options);
      }
    } catch (e) {
      LogService.error(e);
      return undefined;
    }

    if (response.ok) {
      if (callback) callback();
    } else {
      const error = await response.text();
      LogService.error(error);
    }
  }

  public async updateChatHistory(id: string, newChatHistory: IChatHistory[], callback: () => void, modified?: string) {
    const payload = {
      message: JSON.stringify(newChatHistory),
      modified: modified,
    };
    this.updateChat(id, payload, callback);
  }

  public async updateChatName(id: string, newChatHName: string, modified: string, callback: () => void) {
    const payload = {
      name: newChatHName,
    };
    this.updateChat(id, payload, callback);
  }

  public async shareChat(id: string, share: boolean, shareWith: string[], modified: string, callback: () => void) {
    const payload = {
      shared: !!share,
      sharedWith: shareWith?.join(';'),
    };
    this.updateChat(id, payload, callback);
  }
}
