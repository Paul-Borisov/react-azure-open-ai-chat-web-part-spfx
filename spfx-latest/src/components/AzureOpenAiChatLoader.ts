import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneCheckbox,
  PropertyPaneTextField,
  PropertyPaneDropdown,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import AzureOpenAiChat from 'components/AzureOpenAiChat';
import { IAzureOpenAiChatProps } from 'components/IAzureOpenAiChatProps';
import ChatHelper from 'helpers/ChatHelper';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { getHighlightStyles } from 'shared/components/CodeHighlighter/CodeHighlighter';
import Placeholder from 'shared/components/Placeholder/Placeholder';
import Application, { StorageType } from 'shared/constants/Application';
import SearchResultMapper from 'shared/mappers/SearchResultMapper';
import { IAzureApiServiceConfig } from 'shared/model/IAzureApiServiceConfig';
import PropertyPaneFieldCheckboxGroup from 'shared/propertyPaneFields/PropertyPaneFieldCheckboxGroup';
import PropertyPaneFieldCustomListUrl, { ListType } from 'shared/propertyPaneFields/PropertyPaneFieldCustomListUrl';
import PropertyPanePasswordField from 'shared/propertyPaneFields/PropertyPanePasswordField';
import AzureApiService from 'shared/services/AzureApiService';
import LogService from 'shared/services/LogService';
import PageContextService from 'shared/services/PageContextService';
import SessionStorageService from 'shared/services/SessionStorageService';
import SharepointService from 'shared/services/SharepointService';

export default class AzureOpenAiChatLoader extends BaseClientSideWebPart<IAzureOpenAiChatProps> {
  private apiService: AzureApiService;
  private spService: SharepointService;
  private isDarkTheme: boolean = false;
  private webPartWidth: number;
  private isFullWidth: boolean;

  private isImpersonationRequired(): boolean {
    return (
      this.properties.appId === '00000000-0000-0000-0000-000000000000' &&
      (this.apiService.isApiManagementUrl(this.properties.endpointBaseUrlForOpenAi) ||
        this.apiService.isApiManagementUrl(this.properties.endpointBaseUrlForOpenAi4) ||
        this.apiService.isApiManagementUrl(this.properties.endpointBaseUrlForChatHistory) ||
        this.properties.storageType === StorageType.Database)
    );
  }

  public render(): void {
    if (
      this.displayMode === DisplayMode.Edit ||
      //this.properties.appId === '00000000-0000-0000-0000-000000000000' ||
      !this.properties.endpointBaseUrlForOpenAi ||
      this.isImpersonationRequired()
    ) {
      const element = React.createElement(Placeholder, {
        propertyPane: this.context.propertyPane,
        displayMode: this.displayMode,
        iconText: strings.PlaceholderText,
        description: strings.PlaceholderDescription,
      });
      ReactDom.render(element, this.domElement);
    } else {
      const locale = this.properties.locale || 'fi-FI';
      try {
        const hasComma =
          Intl.NumberFormat(locale)
            .format(1 / 2)
            .toString()
            .indexOf(',') > 0;
        SearchResultMapper.delimiter = hasComma ? ';' : ',';
      } catch (e) {}

      const element: React.ReactElement<IAzureOpenAiChatProps> = React.createElement(AzureOpenAiChat, {
        context: this.context,
        apiService: this.apiService,
        spService: this.spService,
        isDarkTheme: this.isDarkTheme,
        isFullWidthColumn: this.isFullWidth,
        webPartWidth: this.webPartWidth,
        appId: this.properties.appId,
        endpointBaseUrlForOpenAi: this.properties.endpointBaseUrlForOpenAi,
        endpointBaseUrlForOpenAi4: this.properties.endpointBaseUrlForOpenAi4,
        languageModels:
          typeof this.properties.languageModels === 'string'
            ? (this.properties.languageModels as any).split(',') // TODO: Replace with multi-select dropdown UI.
            : this.properties.languageModels,
        endpointBaseUrlForChatHistory: this.properties.endpointBaseUrlForChatHistory,
        spImageLibraryUrl: this.properties.spImageLibraryUrl || this.spService.imageLibraryUrl,
        spListUrl: this.properties.spListUrl || this.spService.listUrl,
        //apiKey: this.properties.apiKey,
        apiKey: PropertyPanePasswordField.decrypt(this.context, this.properties.apiKey),
        sharing: this.properties.sharing,
        streaming: this.properties.streaming,
        fullScreen: this.properties.fullScreen,
        vision: this.properties.endpointBaseUrlForOpenAi4 && this.properties.functions && this.properties.vision,
        functions: this.properties.functions,
        bing: this.properties.functions && this.properties.bing,
        apiKeyBing:
          this.properties.functions && this.properties.bing && this.properties.apiKeyBing
            ? PropertyPanePasswordField.decrypt(this.context, this.properties.apiKeyBing)
            : undefined,
        google: this.properties.functions && this.properties.google,
        apiKeyGoogle:
          this.properties.functions && this.properties.google && this.properties.apiKeyGoogle
            ? PropertyPanePasswordField.decrypt(this.context, this.properties.apiKeyGoogle)
            : undefined,
        images: this.properties.functions && this.properties.images,
        examples: this.properties.examples,
        voiceInput: this.properties.voiceInput,
        voiceOutput: this.properties.voiceOutput,
        highlight: this.properties.highlight,
        highlightStyles: this.properties.highlightStyles,
        highlightStyleDefault: this.properties.highlightStyleDefault,
        storageEncryption: this.properties.storageEncryption,
        storageType: this.properties.storageType || StorageType.Database,
        promptAtBottom: this.properties.promptAtBottom,
        unlimitedHistoryLength: this.properties.unlimitedHistoryLength,
        locale: locale,
      });
      ReactDom.render(element, this.domElement);
    }
  }

  protected async onInit(): Promise<void> {
    this.webPartWidth = this.domElement.clientWidth;
    this.isFullWidth = this.isFullWidthColumn();
    LogService.init(Application.Name);
    PageContextService.init(this.context as any);
    this.spService = new SharepointService();
    if (this.properties.storageType === StorageType.SharePoint) {
      await this.spService.init(this.properties.spListUrl ? this.properties.spListUrl : undefined);
    }
    SessionStorageService.hasFunctions = this.properties.functions;
    LogService.debug(null, `${this.title} initialized`);

    const getApiServiceConfig = (): IAzureApiServiceConfig => {
      const config: IAzureApiServiceConfig = {
        appId: this.properties.appId,
        endpointBaseUrl: this.properties.endpointBaseUrlForOpenAi,
        endpointBaseUrl4: this.properties.endpointBaseUrlForOpenAi4,
        endpointBaseUrlForWebApi: this.properties.endpointBaseUrlForChatHistory
          ? this.properties.endpointBaseUrlForChatHistory
          : `${new URL(this.properties.endpointBaseUrlForOpenAi).origin}/chatwebapi`,
        apiKey: PropertyPanePasswordField.decrypt(this.context, this.properties.apiKey),
        isDisabled: false || /isdisabled=true/i.test(window.location.search),
      };
      return config;
    };
    const config = getApiServiceConfig();
    //const authenticate: boolean = config.appId !== undefined && config.appId !== null;
    const authenticate: boolean = ![undefined, null, '00000000-0000-0000-0000-000000000000'].some((s) => s === config.appId);
    this.apiService = new AzureApiService();
    return this.apiService.init(config, authenticate).then((isConfigured) => {
      LogService.debug(null, `${AzureApiService.name} configured: ${isConfigured}`);
    });
  }

  private isFullWidthColumn(): boolean {
    let returnValue: boolean = false;
    let element: HTMLElement = this.domElement;
    do {
      element = element.parentElement;
      if (/CanvasZone/i.test(element?.className)) {
        returnValue = /CanvasZone--fullWidth/i.test(element?.className);
        break;
      }
    } while (element);
    return returnValue;
  }

  protected onAfterResize(newWidth: number): void {
    if (newWidth !== this.webPartWidth) {
      this.webPartWidth = newWidth;
      //this.isFullWidth = this.isFullWidthColumn();
      this.render();
    }
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this.isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.3.2');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const optionsForHighlightStyles = getHighlightStyles().map(
      (style) =>
        ({
          key: style,
          text: style,
        } as IPropertyPaneDropdownOption)
    );
    const optionsForStorageType = [
      {
        key: StorageType.Database,
        text: strings.FieldLabelStorageTypeDatabase,
      },
      {
        key: StorageType.Local,
        text: strings.FieldLabelStorageTypeLocalStorage,
      },
      {
        key: StorageType.SharePoint,
        text: strings.FieldLabelStorageTypeSharePoint,
      },
    ];

    // To suppress the bug with empty aadInfo when the user refreshes the page in the Edit mode
    PageContextService.init(this.context as any);

    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('appId', {
                  label: strings.FieldLabelAppId,
                }),
                PropertyPaneTextField('endpointBaseUrlForOpenAi', {
                  label: strings.FieldLabelEndpointBaseUrlForOpenAi,
                }),
                PropertyPaneTextField('endpointBaseUrlForOpenAi4', {
                  label: strings.FieldLabelEndpointBaseUrlForOpenAi4,
                }),
                /*PropertyPaneTextField('languageModels', {
                  label: strings.FieldLabelLanguageModels,
                }),*/
                this.properties.storageType === StorageType.Database &&
                  PropertyPaneTextField('endpointBaseUrlForChatHistory', {
                    label: strings.FieldLabelEndpointBaseUrlForChatHistory,
                  }),
                /*PropertyPaneTextField('apiKey', {
                  label: strings.FieldLabelApiKey,
                }),*/
                new PropertyPanePasswordField('apiKey', {
                  disabled: !ChatHelper.hasDirectEndpoints(this.apiService, this.properties),
                  label: strings.FieldLabelApiKey,
                  placeholder: strings.FieldLabelApiKeyPlaceholder,
                  properties: this.properties,
                  wpContext: this.context,
                }),
                ChatHelper.hasDirectEndpoints(this.apiService, this.properties, true)
                  ? // Show language models in textbox with comma-separated values
                    PropertyPaneTextField('languageModels', {
                      // Provides options to modify LM values
                      label: strings.FieldLabelLanguageModels,
                    })
                  : // All endpoints are for APIM. Show language models as checkboxes.
                    new PropertyPaneFieldCheckboxGroup('languageModels', {
                      // Shows two predefined options for LMs. Their mappings should be changed in APIM if needed.
                      label: strings.FieldLabelLanguageModels,
                      options: [
                        { key: 'gpt-35-turbo-16k', text: strings.TextGpt35 },
                        { key: 'gpt-4-32k', text: strings.TextGpt4 },
                        { key: 'gpt-4-1106-preview', text: `${strings.TextGpt4Turbo} (${strings.TextPreview})` },
                        { key: 'gpt-4o-mini', text: strings.TextGpt4oMini },
                        { key: 'gpt-4o', text: strings.TextGpt4o },
                        { key: 'o1-mini', text: strings.TextO1Mini },
                        { key: 'o3-mini', text: strings.TextO3Mini },
                      ],
                      properties: this.properties,
                    }),
                PropertyPaneDropdown('storageType', {
                  label: strings.FieldLabelStorageType,
                  options: optionsForStorageType,
                  selectedKey: this.properties.storageType || StorageType.Database,
                }),
                new PropertyPaneFieldCustomListUrl('spListUrl', {
                  label: strings.FieldLabelSharePointListUrl,
                  properties: this.properties,
                  spService: this.spService,
                  disabled: this.properties.storageType !== StorageType.SharePoint,
                  sharing: this.properties.sharing,
                  listType: ListType.CustomList,
                }),
                PropertyPaneCheckbox('storageEncryption', {
                  text: strings.FieldLabelEncryption,
                }),
                PropertyPaneCheckbox('sharing', {
                  text: `${strings.FieldLabelSharing}${
                    this.properties.storageType === StorageType.Local ? ` ${strings.FieldLabelDemoOnly}` : ''
                  }`,
                }),
                PropertyPaneCheckbox('streaming', {
                  text: strings.FieldLabelStreaming,
                }),
                PropertyPaneCheckbox('fullScreen', {
                  text: strings.FieldLabelFullScreen,
                }),
                PropertyPaneCheckbox('functions', {
                  text: strings.FieldLabelFunctions,
                }),
                this.properties.functions &&
                  PropertyPaneCheckbox('bing', {
                    text: strings.FieldLabelBing,
                  }),
                new PropertyPanePasswordField('apiKeyBing', {
                  disabled: !(this.properties.functions && this.properties.bing),
                  label: strings.FieldLabelBingApiKey,
                  placeholder: strings.FieldLabelBingApiKeyPlaceholder,
                  properties: this.properties,
                  wpContext: this.context,
                }),
                this.properties.functions &&
                  PropertyPaneCheckbox('google', {
                    text: strings.FieldLabelGoogle,
                  }),
                new PropertyPanePasswordField('apiKeyGoogle', {
                  disabled: !(this.properties.functions && this.properties.google),
                  label: `${strings.FieldLabelGoogleApiKey}`,
                  placeholder: strings.FieldLabelBingApiKeyPlaceholder,
                  properties: this.properties,
                  wpContext: this.context,
                }),
                this.properties.endpointBaseUrlForOpenAi4 &&
                  this.properties.functions &&
                  PropertyPaneCheckbox('vision', {
                    text:
                      this.apiService?.isApiManagementUrl(this.properties?.endpointBaseUrlForOpenAi4) &&
                      !this.apiService?.isNative(this.properties?.endpointBaseUrlForOpenAi4)
                        ? strings.FieldLabelVisionApim
                        : strings.FieldLabelVision,
                  }),
                this.properties.functions &&
                  PropertyPaneCheckbox('images', {
                    text: this.apiService?.isApiManagementUrl(this.properties?.endpointBaseUrlForOpenAi)
                      ? strings.FieldLabelImagesApim
                      : strings.FieldLabelImages,
                  }),
                new PropertyPaneFieldCustomListUrl('spImageLibraryUrl', {
                  label: strings.FieldLabelSharePointImageLibraryUrl,
                  properties: this.properties,
                  spService: this.spService,
                  disabled: !(this.properties.functions && this.properties.images),
                  sharing: this.properties.sharing,
                  listType: ListType.ImageLibrary,
                }),
                PropertyPaneCheckbox('examples', {
                  text: strings.FieldLabelExamples,
                }),
                PropertyPaneCheckbox('voiceInput', {
                  text: strings.FieldLabelVoiceInput,
                }),
                PropertyPaneCheckbox('voiceOutput', {
                  text: strings.FieldLabelVoiceOutput,
                }),
                PropertyPaneCheckbox('highlight', {
                  text: strings.FieldLabelHighlight,
                }),
                PropertyPaneCheckbox('highlightStyles', {
                  text: strings.FieldLabelHighlightStyles,
                  disabled: !this.properties.highlight,
                }),
                PropertyPaneDropdown('highlightStyleDefault', {
                  label: strings.FieldLabelDefaultStyle,
                  options: optionsForHighlightStyles,
                  selectedKey: this.properties.highlightStyleDefault,
                  disabled: !this.properties.highlight,
                }),
                PropertyPaneCheckbox('promptAtBottom', {
                  text: strings.FieldLabelPromptAtBottom,
                }),
                PropertyPaneCheckbox('unlimitedHistoryLength', {
                  text: strings.FieldLabelUnlimitedHistoryLength,
                }),
                PropertyPaneTextField('locale', {
                  label: strings.FieldLabelLocale,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
