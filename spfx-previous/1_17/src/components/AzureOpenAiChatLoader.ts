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
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { getHighlightStyles } from 'shared/components/CodeHighlighter/CodeHighlighter';
import Placeholder from 'shared/components/Placeholder/Placeholder';
import Application, { StorageType } from 'shared/constants/Application';
import SearchResultMapper from 'shared/mappers/SearchResultMapper';
import { IAzureApiServiceConfig } from 'shared/model/IAzureApiServiceConfig';
import PropertyPaneFieldCheckboxGroup from 'shared/propertyPaneFields/PropertyPaneFieldCheckboxGroup';
import PropertyPaneFieldCustomListUrl from 'shared/propertyPaneFields/PropertyPaneFieldCustomListUrl';
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
        spListUrl: this.properties.spListUrl || `${PageContextService.context.pageContext.web.absoluteUrl}/Lists/dbChats`,
        //apiKey: this.properties.apiKey,
        apiKey: PropertyPanePasswordField.decrypt(this.context, this.properties.apiKey),
        sharing: this.properties.sharing,
        streaming: this.properties.streaming,
        fullScreen: this.properties.fullScreen,
        functions: this.properties.functions,
        highlight: this.properties.highlight,
        highlightStyles: this.properties.highlightStyles,
        highlightStyleDefault: this.properties.highlightStyleDefault,
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
    return Version.parse('1.0');
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

    const hasDirectEndpoints = (): boolean => {
      return (
        this.apiService.isOpenAiServiceUrl(this.properties.endpointBaseUrlForOpenAi) ||
        this.apiService.isOpenAiServiceUrl(this.properties.endpointBaseUrlForOpenAi4) ||
        this.apiService.isOpenAiNativeUrl(this.properties.endpointBaseUrlForOpenAi) ||
        this.apiService.isOpenAiNativeUrl(this.properties.endpointBaseUrlForOpenAi4) ||
        this.apiService.isNative(this.properties.endpointBaseUrlForOpenAi) ||
        this.apiService.isNative(this.properties.endpointBaseUrlForOpenAi4)
      );
    };

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
                PropertyPaneTextField('endpointBaseUrlForChatHistory', {
                  label: strings.FieldLabelEndpointBaseUrlForChatHistory,
                }),
                /*PropertyPaneTextField('apiKey', {
                  label: strings.FieldLabelApiKey,
                }),*/
                new PropertyPanePasswordField('apiKey', {
                  label: strings.FieldLabelApiKey,
                  wpContext: this.context,
                  properties: this.properties,
                }),
                hasDirectEndpoints()
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
