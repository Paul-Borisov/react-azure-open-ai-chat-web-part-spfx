import { Label, PrimaryButton, TextField } from '@fluentui/react';
import { update, get } from '@microsoft/sp-lodash-subset';
import { IPropertyPaneCustomFieldProps, IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getMessageDialog } from 'shared/components/CustomDialog';
import { CustomShimmer } from 'shared/components/CustomShimmer/CustomShimmer';
import SharepointService from 'shared/services/SharepointService';
import styles from './PropertyPaneFieldCustomListUrl.module.scss';

interface IPropertyPaneCustomListUrlProps {
  disabled: boolean;
  sharing: boolean;
  label?: string;
  properties: any;
  spService: SharepointService;
}

interface IPropertyPaneCustomListUrlInternalProps extends IPropertyPaneCustomListUrlProps, IPropertyPaneCustomFieldProps {}

interface ICustomListUrlProps {
  disabled: boolean;
  sharing: boolean;
  label: string;
  listExists: boolean;
  listUrl: string;
  onChange: (newValue: string) => void;
  spService: SharepointService;
}
const CustomListUrl: React.FunctionComponent<ICustomListUrlProps> = (props) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>();
  const [dialogHeader, setDialogHeader] = React.useState<string>();
  const [dialogText, setDialogText] = React.useState<string>();
  const [isProgress, setIsProgress] = React.useState<boolean>();
  const [listExists, setListExists] = React.useState<boolean>();

  React.useMemo(
    () => props.spService.doesListExist(props.listUrl ? props.listUrl : undefined).then((result) => setListExists(result)),
    [props.listUrl, listExists]
  );

  const createList = async () => {
    if (listExists) {
      setDialogHeader(strings.TextExists);
      setDialogText(strings.TextListExists);
      setIsDialogOpen(true);
      return;
    }
    setIsProgress(true);
    await props.spService.createListForChats(props.listUrl ? props.listUrl : undefined, props.sharing, (errorMessage: string) => {
      setIsProgress(false);
      if (errorMessage) {
        setDialogHeader(strings.TextError);
        setDialogText(errorMessage);
        setIsDialogOpen(true);
      } else {
        setListExists(true);
        setDialogHeader(strings.TextCreated);
        setDialogText(strings.TextListCreated);
        setIsDialogOpen(true);
      }
    });
  };

  const updateList = async () => {
    setIsProgress(true);
    await props.spService.updateListForChats(props.listUrl ? props.listUrl : undefined, props.sharing, (errorMessage: string) => {
      setIsProgress(false);
      if (errorMessage) {
        setDialogHeader(strings.TextError);
        setDialogText(errorMessage);
        setIsDialogOpen(true);
      } else {
        setDialogHeader(strings.TextUpdated);
        setDialogText(strings.TextListUpdated);
        setIsDialogOpen(true);
      }
    });
  };

  return !props.disabled && listExists !== undefined
    ? React.createElement(React.Fragment, undefined, [
        React.createElement(Label, undefined, props.label),
        React.createElement(TextField, {
          disabled: props.disabled,
          defaultValue: props.listUrl,
          onChange: (e, newValue: string) => props.onChange(newValue),
        }),
        !isProgress
          ? !listExists
            ? React.createElement(PrimaryButton, {
                text: strings.TextCreate,
                className: styles.button,
                onClick: createList,
                disabled: props.disabled,
              })
            : React.createElement(PrimaryButton, {
                text: strings.TextUpdate,
                className: styles.button,
                onClick: updateList,
                disabled: props.disabled,
              })
          : React.createElement(CustomShimmer, { isCompact: true }),
        getMessageDialog(dialogHeader, dialogText, isDialogOpen, setIsDialogOpen),
      ])
    : null;
};

export default class PropertyPaneFieldCustomListUrl implements IPropertyPaneField<IPropertyPaneCustomListUrlProps> {
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
  public targetProperty: string;
  public properties: IPropertyPaneCustomListUrlInternalProps;
  private elem: HTMLElement;

  constructor(targetProperty: string, properties: IPropertyPaneCustomListUrlProps) {
    this.targetProperty = targetProperty;
    this.properties = {
      ...properties,
      key: properties.label || 'PropertyPaneCustomListUrl',
      onRender: this.onRender.bind(this),
      onDispose: this.onDispose.bind(this),
    };
  }

  public render(): void {
    if (!this.elem) {
      return;
    }
    this.onRender(this.elem);
  }

  private async onRender(elem: HTMLElement) {
    if (!this.elem) {
      this.elem = elem;
    }

    const listUrl = get(this.properties.properties, this.targetProperty);
    const config = await this.properties.spService?.getListTitleByUrl(listUrl);

    const element: React.ReactElement<ICustomListUrlProps> = React.createElement(CustomListUrl, {
      disabled: this.properties.disabled,
      sharing: this.properties.sharing,
      label: this.properties.label,
      listExists: config?.listExists,
      listUrl: listUrl,
      onChange: this.onChange.bind(this),
      spService: this.properties.spService,
    });
    ReactDOM.render(element, elem);
  }

  private onChange(newValue: string): void {
    update(this.properties.properties, this.targetProperty, () => newValue?.trim());
    this.render();
  }

  private onDispose(element: HTMLElement): void {
    ReactDOM.unmountComponentAtNode(element);
  }
}
