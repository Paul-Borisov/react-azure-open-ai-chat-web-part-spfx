import { AadHttpClient, HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import HtmlHelper from 'shared/helpers/HtmlHelper';
import AzureServiceResponseMapper from 'shared/mappers/AzureServiceResponseMapper';
import LogService from 'shared/services/LogService';
import AzureApiService from './AzureApiService';
import PageContextService from './PageContextService';

// These operations with sub-URLs must be configured in APIM below APIM > Open AI > All operations.
enum Operations {
  TextToSpeech = '/tts',
}

export default class SpeechService {
  private apiService: AzureApiService = undefined;

  constructor(apiService: AzureApiService) {
    this.apiService = apiService;
  }

  public async callTextToSpeech(queryText: string, highDefinition: boolean = false, voice = 'onyx'): Promise<ArrayBuffer> {
    const apiService = this.apiService;
    const config = apiService.getConfig();
    const aadClient = apiService.getAadClient();
    const apimNativeUrl =
      apiService.isApiManagementUrl(config.endpointBaseUrl) && apiService.isNative(config.endpointBaseUrl)
        ? config.endpointBaseUrl
        : apiService.isApiManagementUrl(config.endpointBaseUrl4) && apiService.isNative(config.endpointBaseUrl4)
        ? config.endpointBaseUrl4
        : undefined;
    const openAiNativeUrl = apiService.isOpenAiNativeUrl(config.endpointBaseUrl)
      ? config.endpointBaseUrl
      : apiService.isOpenAiNativeUrl(config.endpointBaseUrl4)
      ? config.endpointBaseUrl4
      : undefined;

    let endpointUri;
    if (apimNativeUrl) {
      endpointUri = apimNativeUrl + Operations.TextToSpeech;
    } else if (openAiNativeUrl) {
      endpointUri = `${new URL(openAiNativeUrl).origin}/v1/audio/speech`;
    } else {
      const message = 'Unsupported service type';
      LogService.error(message);
      AzureServiceResponseMapper.saveErrorDetails(message);
      Promise.resolve(undefined);
      return;
    }

    const requestHeaders: Headers = new Headers();
    requestHeaders.append('content-type', 'application/json');
    if (openAiNativeUrl && config.apiKey) {
      requestHeaders.append('Authorization', `Bearer ${config.apiKey}`);
    }

    const requestParameters = {
      model: `tts-1${highDefinition ? '-hd' : ''}`,
      input: HtmlHelper.stripHtml(queryText),
      voice: voice,
    };

    const postOptions: IHttpClientOptions = {
      headers: requestHeaders,
      body: JSON.stringify(requestParameters),
    };

    const handleError = async (response: HttpClientResponse) => {
      const error = await response.text();
      LogService.error(error);
      AzureServiceResponseMapper.saveErrorDetails(error);
      return Promise.resolve(undefined);
    };

    let response: HttpClientResponse = undefined;
    try {
      if (aadClient && apimNativeUrl) {
        response = await aadClient.post(endpointUri, AadHttpClient.configurations.v1, postOptions);
      } else {
        response = await PageContextService.context.httpClient.post(endpointUri, HttpClient.configurations.v1, postOptions);
      }
    } catch (e) {
      LogService.error(e);
      AzureServiceResponseMapper.saveErrorDetails(e);
      return Promise.resolve(undefined);
    }

    if (response.ok) {
      return response.arrayBuffer();
    } else {
      return handleError(response);
    }
  }
}
