import { AadHttpClient, HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { GptImageModelTextLimits } from 'shared/constants/Application';
import AzureServiceResponseMapper from 'shared/mappers/AzureServiceResponseMapper';
import LogService from 'shared/services/LogService';
import AzureApiService from './AzureApiService';
import PageContextService from './PageContextService';
import SharepointService from './SharepointService';

// These operations with sub-URLs must be configured in APIM below APIM > Open AI > All operations.
enum Operations {
  ImageGeneration = '/dalle',
}

export default class ImageService {
  private apiService: AzureApiService = undefined;
  private storageUrl: string = undefined;

  constructor(apiService: AzureApiService, storageUrl: string) {
    this.apiService = apiService;
    this.storageUrl = storageUrl;
  }

  public async callQueryImage(
    queryText: string,
    quality: string = 'hd',
    apiVersion?: number,
    choices?: number,
    size?: string,
    precise: boolean = true
  ): Promise<string> {
    const apiService = this.apiService;
    const config = apiService.getConfig();
    const aadClient = apiService.getAadClient();
    const isApim = apiService.isApiManagementUrl(config.endpointBaseUrl);

    const endpointUri = isApim
      ? config.endpointBaseUrl + Operations.ImageGeneration + (apiVersion ? apiVersion : '')
      : 'https://api.openai.com/v1/images/generations';
    const requestHeaders: Headers = new Headers();
    requestHeaders.append('content-type', 'application/json');
    if (!isApim && config.apiKey) {
      if (apiService.isOpenAiServiceUrl(endpointUri)) {
        requestHeaders.append('Api-Key', config.apiKey);
      } else if (apiService.isOpenAiNativeUrl(endpointUri)) {
        requestHeaders.append('Authorization', `Bearer ${config.apiKey}`);
      }
    }

    // https://platform.openai.com/docs/guides/images/usage?context=node
    // With the release of DALL·E 3, the model now takes in the default prompt provided and automatically re-write it for safety reasons, and to add more detail (more detailed prompts generally result in higher quality images).
    //While it is not currently possible to disable this feature, you can use prompting to get outputs closer to your requested image by adding the following to your prompt: I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:.
    //The updated prompt is visible in the revised_prompt field of the data response object.
    const propmtPrefix = precise
      ? 'I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: '
      : '';

    const maxTextLimit = GptImageModelTextLimits[apiVersion?.toString() ?? ''];
    const requestParameters = {
      model: `dall-e-${apiVersion ? apiVersion : '3'}`,
      n: choices ?? 1,
      prompt: propmtPrefix + (queryText?.length > maxTextLimit ? queryText.substring(0, maxTextLimit) : queryText),
      response_format: 'b64_json', // 'url'
      size: size ?? '1024x1024',
    };
    if (quality) requestParameters['quality'] = quality;

    const postOptions: IHttpClientOptions = {
      headers: requestHeaders,
      body: JSON.stringify(requestParameters),
    };

    const handleError = async (response) => {
      const error = await response.text();
      LogService.error(error);
      AzureServiceResponseMapper.saveErrorDetails(error);
      return Promise.resolve(undefined);
    };

    let response: HttpClientResponse = undefined;
    try {
      if (aadClient) {
        response = await aadClient.post(endpointUri, AadHttpClient.configurations.v1, postOptions);
      } else {
        response = await PageContextService.context.httpClient.post(endpointUri, HttpClient.configurations.v1, postOptions);
      }
    } catch (e) {
      LogService.error(e);
      return Promise.resolve(undefined);
    }

    if (response.ok) {
      const json = await response.json();

      const generatedImages = json.data;
      const output: string[] = [];
      for (let i = 0; i < generatedImages.length; i++) {
        const data = generatedImages[i];
        let src = undefined;
        if (data.b64_json) {
          src = `data:image/png;base64,${data.b64_json}`;
          const savedImageUrl = await new SharepointService().saveImage(src, this.storageUrl);
          if (savedImageUrl) {
            const img = document.createElement('img');
            img.src = savedImageUrl;
            if (data.revised_prompt) {
              img.alt = data.revised_prompt;
              img.title = data.revised_prompt;
            }
            output.push(img.outerHTML);
            if (data.revised_prompt) output.push(data.revised_prompt);
          } else {
            const message = 'Unable to save the generated image';
            LogService.error(message);
            AzureServiceResponseMapper.saveErrorDetails(message);
            continue;
          }
        } else {
          const message = 'Image response is empty';
          LogService.error(message);
          AzureServiceResponseMapper.saveErrorDetails(message);
          continue;
        }
      }
      return Promise.resolve(output.length > 0 ? output.join('\n\n') : undefined);
    } else {
      return handleError(response);
    }
  }
}
