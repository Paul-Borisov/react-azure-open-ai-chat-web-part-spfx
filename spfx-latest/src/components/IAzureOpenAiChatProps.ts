import { WebPartContext } from '@microsoft/sp-webpart-base';
import { StorageType } from 'shared/constants/Application';
import AzureApiService from 'shared/services/AzureApiService';
import SharepointService from 'shared/services/SharepointService';

export interface IAzureOpenAiChatProps {
  context: WebPartContext;
  apiService: AzureApiService;
  spService: SharepointService;
  isDarkTheme: boolean;
  isFullWidthColumn: boolean;
  webPartWidth: number;
  // Azure App registration (Client ID) to authenticate SPFx requests. It must match with package-solution.json > webApiPermissionRequests > resource nane
  appId: string;
  // Base endpoint URL of APIM sevice API for GPT3 or Azure OpenAI service (if you provide api-key)
  endpointBaseUrlForOpenAi: string;
  // Base endpoint URL of APIM sevice API fpr GPT4 or Azure OpenAI service (if you provide api-key)
  endpointBaseUrlForOpenAi4: string;
  // Optional base endpoint URL of ChatWebApi sevice in case you do not want to use more secure APIM-config
  // In such case you can additionally protect ChatWebApi using as same appId as above in Microsoft Authentication Provider for App Service
  endpointBaseUrlForChatHistory: string;
  // Optional SharePoint list URL if StorageType === spList selected. Default is <currentsiteurl>/Lists/dbChats
  spListUrl: string;
  // Default language model used to submit requests (gpt-35-turbo-16k / gpt-4-32k)
  //defaultLanguageModel: string;
  languageModels: string[];
  // Optional api-key for Azure OpenAI service in case you do not want to use more secure APIM-config
  apiKey: string;
  // Option to enable sharing feature in UI
  sharing: boolean;
  // Option to enable streamed response processing
  streaming: boolean;
  // Option to enable full screen mode
  fullScreen: boolean;
  // Option to enable (external) function calling
  functions: boolean;
  // Option to enable code highlighting
  highlight: boolean;
  // Option to show code highlighting styles (requires highlight == true)
  highlightStyles: boolean;
  // Option for default code highlighting style (requires highlight == true)
  highlightStyleDefault: string;
  // Option for various storage types. Default is Database (when empty)
  storageType: StorageType;
  // Option to choose desired location of prompt texarea above or below content panel
  promptAtBottom: boolean;
  // Option to use unlimited chat history length.
  // If it is used, it removes earlier messages from chat's history submitted to AI when its max allowed content length is exceeded.
  unlimitedHistoryLength: boolean;
  // Optional locale to format dates
  locale: string;
}
