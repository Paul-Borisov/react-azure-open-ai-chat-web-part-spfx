import { IAzureOpenAiChatProps } from 'components/IAzureOpenAiChatProps';
import HtmlHelper from 'shared/helpers/HtmlHelper';
import { Utils } from 'shared/helpers/Utils';
import { IChatHistory, IChatMessage } from 'shared/model/IChat';
import { IItemConfig } from 'shared/model/IItemConfig';
import { IItemPayload } from 'shared/model/IItemPayload';
import { FunctionCallingOptions } from 'shared/model/enums/FunctionCallingOptions';
import { FunctionServices } from 'shared/model/enums/FunctionServices';
import AzureApiService from 'shared/services/AzureApiService';
import EncryptionService from 'shared/services/EncryptionService';

const defaultResponseTokens = 2048; // Using 800 may produce incomplete output.

export default class ChatHelper {
  public static replaceSpecialCharacters(content: string): string {
    if (!content) return content;

    let newContent = content;
    // `[${String.fromCharCode(0xab)}${String.fromCharCode(0xbb)}${String.fromCharCode(0x201c)}${String.fromCharCode(0x201c)}]`
    const re1: RegExp = /[«»““]/g;
    if (re1.test(newContent)) {
      newContent = newContent.replace(re1, '"');
    }
    return newContent;
  }

  public static maxContentLength(model: string, responseTokens: number): number {
    // maxContentLength = max allowed length of previous Chat history + prompt.
    // It's only used in calculations of "unlimited" chat history feature.
    if (!responseTokens) responseTokens = this.maxResponseTokens(model);

    // 4 is for English, ussage of other languages may reduce the average like Finnish 3.8, Russian 3.6, Chinese 3.4, ...
    const averageCharsPerToken = 3.6;
    const largeContentDeduction = 1500;

    let returnValue = Math.floor((4 * 1024 - responseTokens) * averageCharsPerToken);
    if (/4o/i.test(model) || /4-(1106|turbo|vision)/i.test(model) || /o1-mini|o1-preview/i.test(model)) {
      returnValue = Math.floor((128 * 1024 - responseTokens) * averageCharsPerToken) - largeContentDeduction;
    } else if (/32k/i.test(model)) {
      returnValue = Math.floor((32 * 1024 - responseTokens) * averageCharsPerToken) - largeContentDeduction;
    } else if (/16k|-1106/i.test(model)) {
      returnValue = Math.floor((16 * 1024 - responseTokens) * averageCharsPerToken) - largeContentDeduction;
    } else if (/8k/i.test(model) || /gpt-4/i.test(model)) {
      returnValue = Math.floor((8 * 1024 - responseTokens) * averageCharsPerToken) - largeContentDeduction;
    } else if (/o\d/i.test(model)) {
      returnValue = Math.floor((200 * 1024 - responseTokens) * averageCharsPerToken) - largeContentDeduction;
    }
    return returnValue - 200; // 200 extra chars reserved for service needs (redundancy).
  }

  public static maxRequestLength(model: string, responseTokens: number, chatHistoryLength: number): number {
    // maxRequestLength = max allowed number of characters in the prompt.
    let maxCharacters = 4_000; // GPT-35-turbo, 4k
    if (/4o/i.test(model) || /4-(1106|turbo|vision)/i.test(model) || /o1-mini|o1-preview/i.test(model)) {
      maxCharacters = 125_000; // ~ (128 * 1024 * 3.6) / 3.75 long questions - answers.
    } else if (/32k/i.test(model)) {
      maxCharacters = 30_000; // ~ (32 * 1024 * 3.6) / 3.75 long questions - answers.
    } else if (/16k|-1106/i.test(model)) {
      maxCharacters = 15_000; // ~ (16 * 1024 * 3.6) / 3.75 long questions - answers.
    } else if (/8k/i.test(model) || /gpt-4/i.test(model)) {
      maxCharacters = 7_500; // ~ (8 * 1024 * 3.6) / 3.75 long questions - answers.
    } else if (/o\d/i.test(model)) {
      maxCharacters = 195_000; // ~ (200 * 1024 * 3.6) / 3.75 long questions - answers.
    }
    const maxLength = this.maxContentLength(model, responseTokens);
    const allowedLength = maxLength - chatHistoryLength;
    return allowedLength > maxCharacters ? maxCharacters : allowedLength > 0 ? allowedLength : 0;
  }

  public static maxResponseTokens(model: string): number {
    let returnValue = defaultResponseTokens;
    if (/4-(1106|turbo)/i.test(model)) {
      //https://platform.openai.com/playground?mode=chat&model=gpt-4-1106-preview
      returnValue = defaultResponseTokens * 2;
    } else if (/32k/i.test(model)) {
      returnValue = defaultResponseTokens * 2; // * 3 and * 4 will also work, * 2 looks safer to avoid errors
    } else if (/16k|-1106/i.test(model)) {
      returnValue = defaultResponseTokens;
    } else if (/8k/i.test(model) || /gpt-4/i.test(model)) {
      returnValue = defaultResponseTokens;
    } else if (/o\d-mini/i.test(model)) {
      returnValue = 65_536;
    } else if (/o1-preview/i.test(model)) {
      returnValue = 32_768;
    } else if (/o\d/i.test(model)) {
      returnValue = 100_000;
    }
    return returnValue;
  }

  public static cleanupResponseContent(responseContent: any): any {
    // Reserved to make specific cleanup actions
    if (typeof responseContent !== 'string') {
      responseContent = responseContent?.toString() ?? '';
    }
    return responseContent;
  }

  public static getItemPayload(
    config: IItemConfig,
    requestText: string,
    model?: string,
    enableFunctionCalling?: boolean
  ): IItemPayload {
    const payload: IItemPayload = {
      queryText: requestText,
      model: model,
      maxTokens: this.maxResponseTokens(model),
    };

    if (payload.queryText) {
      payload.queryText = this.replaceSpecialCharacters(payload.queryText);
    }

    if (enableFunctionCalling) {
      // https://platform.openai.com/docs/guides/function-calling
      if (/(0613|16k|32k)/i.test(model) || /^gpt-4$|^gpt-3\.?5-turbo/i.test(model)) {
        payload.functions = FunctionCallingOptions.single;
      } else if (/1106/i.test(model) || /4o/i.test(model)) {
        payload.functions = FunctionCallingOptions.multiple;
      } else {
        payload.functions = FunctionCallingOptions.none;
      }
    }
    return payload;
  }

  public static addFunctionServices(payload: IItemPayload, props: IAzureOpenAiChatProps) {
    if (!payload || !props) return;

    if (props.functions && props.bing) {
      payload.services = payload.services || [];
      payload.services.push({ name: FunctionServices.bing, key: props.apiKeyBing, locale: props.locale });
    }
    if (props.functions && props.google) {
      payload.services = payload.services || [];
      payload.services.push({ name: FunctionServices.google, key: props.apiKeyGoogle, locale: props.locale });
    }
    if (props.functions && props.images) {
      payload.services = payload.services || [];
      payload.services.push({
        name: FunctionServices.image,
        key: undefined,
        locale: props.locale,
        storageUrl: props.spImageLibraryUrl,
      });
    }
  }

  public static isStreamingSupported = (model: string, props: IAzureOpenAiChatProps) => {
    // As of February 2025, the model o1-mini of Azure OpenAI did not support streaming and function calling.
    // - At the same time, native OpenAI models o1-mini, o3-mini, o1-preview supported streaming, but did not support function calling.
    // - The full-scale native OpenAI models o1 and o1-2024-12-17 did not support streaming and function calling.
    // On attempts to use streaming outputs, they have thrown errors. Note that this behaviour might change later.
    if (/^o\d$|o\d-\d{4}-\d{2}-\d{2}/i.test(model?.toLocaleLowerCase())) return false;

    return (
      props.streaming &&
      (!/o\d/.test(model) ||
        props.apiService?.isNative(props.endpointBaseUrlForOpenAi) ||
        props.apiService?.isOpenAiNativeUrl(props.endpointBaseUrlForOpenAi))
    );
  };

  public static formatDate(date: string | Date, locale: string): string {
    if (typeof date === 'string') date = new Date(date);
    return new Date().getFullYear() !== date.getFullYear()
      ? new Intl.DateTimeFormat(locale, {
          day: '2-digit',
          month: '2-digit',
          /*year: 'numeric',*/
        }).format(date) + ':'
      : new Intl.DateTimeFormat(locale, {
          day: '2-digit',
          month: '2-digit',
        })
          .format(date)
          .replace(/\.$/, ':');
  }

  public static toLocalISOString(): string {
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    return new Date(Date.now() - tzoffset).toISOString().slice(0, -1);
  }

  public static scrollToBottom(element: Element, delayInMilliseconds: number = 200) {
    if (element) {
      setTimeout(() => (element.scrollTop = element.scrollHeight), delayInMilliseconds);
    }
  }

  public static scrollToTop(element: Element, delayInMilliseconds: number = 200) {
    if (element) {
      setTimeout(() => (element.scrollTop = 0), delayInMilliseconds);
    }
  }

  public static changePageTitle(newPageTitle: string) {
    try {
      const title = document.querySelector('title');
      if (newPageTitle && title && newPageTitle !== title.innerHTML) {
        title.innerHTML = newPageTitle;
      }
    } catch (e) {}
  }

  public static sanitizeHtml(html: string): string {
    const rawHtml = HtmlHelper.htmlDecode(html);
    if (!HtmlHelper.hasHtmlTags(rawHtml)) return html;

    const sanitized = HtmlHelper.stripScripts(HtmlHelper.stripStyles(rawHtml));
    const re1 = /^<span>/i;
    const re2 = /<\/span>$/i;
    return re1.test(sanitized) && re2.test(sanitized) ? sanitized.replace(re1, '').replace(re2, '') : sanitized;
  }

  public static truncateImages(chatHistory: IChatHistory[], evaluate: boolean = false): boolean {
    let hasImages = false;
    if (!chatHistory?.length) return hasImages;

    const re = /<img [^>]+\/?>/gi;
    for (let i = 0; i < chatHistory.length; i++) {
      const chat = chatHistory[i];
      if (re.test(chat.content)) {
        hasImages = true;
        if (evaluate) {
          break;
        } else {
          chat.content = chat.content.replace(re, '');
        }
      }
    }

    return hasImages;
  }

  public static downloadCsvFile(content: string, fileName: string = 'download.csv', withBOM: boolean = true) {
    const url = window.URL.createObjectURL(
      new Blob([`${withBOM ? '\uFEFF' : ''}${content}`], {
        type: 'text/csv;charset=utf-8',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    try {
      document.body.removeChild(link);
    } catch (e) {}
  }

  public static downloadImage(imageUrl: string, fileName: string = 'download.png') {
    // https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    fetch(imageUrl).then((res) =>
      res.blob().then((url) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        try {
          document.body.removeChild(link);
        } catch (e) {}
      })
    );
  }

  public static hasDirectEndpoints(
    apiService: AzureApiService,
    props: IAzureOpenAiChatProps,
    checkForNativeApimEndpoint?: boolean
  ): boolean {
    if (!apiService || !props) return false;

    return (
      apiService.isOpenAiServiceUrl(props.endpointBaseUrlForOpenAi) ||
      apiService.isOpenAiServiceUrl(props.endpointBaseUrlForOpenAi4) ||
      apiService.isOpenAiNativeUrl(props.endpointBaseUrlForOpenAi) ||
      apiService.isOpenAiNativeUrl(props.endpointBaseUrlForOpenAi4) ||
      (checkForNativeApimEndpoint &&
        (apiService.isNative(props.endpointBaseUrlForOpenAi) || apiService.isNative(props.endpointBaseUrlForOpenAi4)))
    );
  }

  public static supportsTextToSpeech(props: IAzureOpenAiChatProps): boolean {
    if (!props?.apiService) return false;

    return (
      (props.apiService.isApiManagementUrl(props.endpointBaseUrlForOpenAi) &&
        props.apiService.isNative(props.endpointBaseUrlForOpenAi)) ||
      (props.apiService.isApiManagementUrl(props.endpointBaseUrlForOpenAi4) &&
        props.apiService.isNative(props.endpointBaseUrlForOpenAi4))
    );
  }

  public static async transformImages(imageUrls: string[], props: IAzureOpenAiChatProps): Promise<string[]> {
    const newImageUrls: string[] = [];
    if (imageUrls?.length > 0) {
      const spStorageUrl = props.spImageLibraryUrl || props.spService.imageLibraryUrl;
      const imageLibraryExists = await props.spService?.doesListExist(spStorageUrl);
      if (imageLibraryExists) {
        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];
          const savedImageUrl = await props.spService.saveImage(url, spStorageUrl);
          newImageUrls.push(savedImageUrl);
        }
      } else {
        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];
          if (url.length > 300 * 1024) {
            newImageUrls.push(await Utils.compressImageToDataURL(url));
          } else {
            newImageUrls.push(url);
          }
        }
      }
    }
    return Promise.resolve(newImageUrls);
  }

  public static encrypt(value: IChatHistory[] | string, encService?: EncryptionService): string {
    if (!value) return value?.toString();

    if (!encService) encService = new EncryptionService();

    return typeof value === 'string' ? encService.encrypt(value) : encService.encrypt(JSON.stringify(value));
  }

  public static decrypt(value: IChatMessage[], encService?: EncryptionService, shared?: boolean): void {
    if (!encService) encService = new EncryptionService();
    value.forEach((r) => {
      try {
        r.name = encService.decrypt(r.name, true, shared ? r.username : undefined);
        if (r.message?.startsWith('"enc:')) {
          r.message = encService.decrypt(r.message.replace(/^"/, '').replace(/"$/, '')); // A weird storage format in LocalStorage
        } else {
          r.message = encService.decrypt(r.message, true, shared ? r.username : undefined);
        }
      } catch (e) {}
    });
  }
}
