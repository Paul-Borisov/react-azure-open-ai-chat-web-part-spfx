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
    const isApim = apiService.isApiManagementUrl(config.endpointBaseUrl); // Includes /openainative endpoint
    const isOpenAiService = apiService.isOpenAiServiceUrl(config.endpointBaseUrl);
    const isOpenAiNative = apiService.isOpenAiNativeUrl(config.endpointBaseUrl);

    let endpointUri;
    if (isApim) {
      endpointUri = config.endpointBaseUrl + Operations.ImageGeneration + (apiVersion ? apiVersion : '');
    } else if (isOpenAiService) {
      endpointUri = `${
        new URL(config.endpointBaseUrl).origin
      }/openai/deployments/dalle3/images/generations?api-version=2023-12-01-preview`;
    } else if (isOpenAiNative) {
      endpointUri = `${new URL(config.endpointBaseUrl).origin}/v1/images/generations`;
    } else {
      LogService.error('Unsupported service type');
      Promise.resolve(undefined);
      return;
    }

    const requestHeaders: Headers = new Headers();
    requestHeaders.append('content-type', 'application/json');
    if (isOpenAiService && config.apiKey) {
      requestHeaders.append('Api-Key', config.apiKey);
    } else if (isOpenAiNative && config.apiKey) {
      requestHeaders.append('Authorization', `Bearer ${config.apiKey}`);
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
    //if (quality && !isOpenAiNative) requestParameters['quality'] = quality;
    if (quality) requestParameters['quality'] = quality;

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
      if (aadClient && isApim) {
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

      if (response.status === 202) {
        return Promise.resolve(await this.olderHandlingLogic(requestHeaders, response, json));
      }
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

  // Backup of the previous image generation (POST) and image retrieval (202 > GET) logic for Dall-e-2 endpoints of APIM / Azure Open AI.
  // Version 1:
  //   POST https://customer.openai.azure.com/dalle/text-to-image?api-version=2022-08-03-preview
  //   GET  https://customer.openai.azure.com/dalle/text-to-image/operations/{operationid}?api-version=2022-08-03-preview
  // Version 2:
  //   POST https://customer.openai.azure.com/openai/images/generations:submit?api-version=2023-06-01-preview
  //   GET  https://customer.openai.azure.com/openai/operations/images/{operationid}?api-version=2023-06-01-preview
  private async olderHandlingLogic(requestHeaders: Headers, response: HttpClientResponse, json: any): Promise<string> {
    const apiService = this.apiService;
    const config = apiService.getConfig();
    const aadClient = apiService.getAadClient();
    const isApim = apiService.isApiManagementUrl(config.endpointBaseUrl);
    const isOpenAiService = apiService.isOpenAiServiceUrl(config.endpointBaseUrl);

    const handleError = async (response: HttpClientResponse) => {
      const error = await response.text();
      LogService.error(error);
      AzureServiceResponseMapper.saveErrorDetails(error);
    };

    const retryAfter: any = response.headers.get('retry-after') || response.headers.get('Retry-After') || 3;
    const operationLocationUri: string = response.headers.get('operation-location') || response.headers.get('Operation-Location');
    const operationId = json.id;

    let endpointUriGetImage;
    if (isApim) {
      endpointUriGetImage = config.endpointBaseUrl + '/image3'; // Ininitlly the GET endpoint /image was configured
    } else if (isOpenAiService) {
      endpointUriGetImage = operationLocationUri
        ? operationLocationUri
        : `${config.endpointBaseUrl}/openai/operations/images/${operationId}?api-version=2023-06-01-preview`;
    } else {
      LogService.error('Unsupported service type');
      Promise.resolve(undefined);
      return;
    }

    const imagePromise: Promise<string> = new Promise((resolve, reject) => {
      const id: any = setInterval(async () => {
        let responseGetImage: HttpClientResponse = undefined;
        try {
          if (aadClient && isApim) {
            responseGetImage = await aadClient.get(`${endpointUriGetImage}/${operationId}`, AadHttpClient.configurations.v1);
          } else {
            // isOpenAiService
            responseGetImage = await PageContextService.context.httpClient.get(
              `${endpointUriGetImage}/${operationId}`,
              HttpClient.configurations.v1,
              {
                headers: requestHeaders,
              }
            );
          }
        } catch (e) {
          clearInterval(id);
          LogService.error(e);
          resolve(undefined);
          return;
        }

        if (responseGetImage.ok) {
          const json = await responseGetImage.json();
          const status: string = json.status?.toLowerCase();
          if (['notstarted', 'running'].some((s) => s === status)) {
            //console.log('Running');
          } else if (status === 'succeeded') {
            const generatedImages = AzureServiceResponseMapper.mapResponseQueryImage(json);
            if (generatedImages?.length > 0) {
              const output: string[] = [];
              for (let i = 0; i < generatedImages.length; i++) {
                const savedImageUrl = await new SharepointService().saveImage(generatedImages[i], this.storageUrl);
                if (savedImageUrl) {
                  const img = document.createElement('img');
                  img.id = operationId;
                  img.src = savedImageUrl;
                  //console.log(img.src);
                  output.push(img.outerHTML);
                }
              }
              resolve(output.length > 0 ? output.join('\n\n') : undefined);
              //resolve(img.outerHTML);
            } else {
              resolve(undefined);
            }
            clearInterval(id);
          } else {
            clearInterval(id);
            handleError(responseGetImage);
            resolve(undefined);
          }
          //return resultJson2;
        } else {
          clearInterval(id);
          handleError(responseGetImage);
          resolve(undefined);
        }
      }, retryAfter * 1000);
    });
    return imagePromise;
  }
}
