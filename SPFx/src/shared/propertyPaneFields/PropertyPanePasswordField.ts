import { Label, TextField } from '@fluentui/react';
import { update, get } from '@microsoft/sp-lodash-subset';
import { IPropertyPaneCustomFieldProps, IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as cryptoJS from 'crypto-js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface IPropertyPanePasswordFieldProps {
  label?: string;
  wpContext: WebPartContext;
  properties: any;
}

interface IPropertyPanePasswordFieldInternalProps extends IPropertyPanePasswordFieldProps, IPropertyPaneCustomFieldProps {}

interface IPasswordFieldProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
}
const PropertyPanePasswordField: React.FunctionComponent<IPasswordFieldProps> = (props) => {
  return React.createElement(React.Fragment, undefined, [
    React.createElement(Label, undefined, props.label),
    React.createElement(TextField, {
      onChange: (e, newValue: string) => props.onChange(newValue),
      value: props.value,
      type: 'password',
    }),
  ]);
};

export default class PropertyPaneFieldPasswordField implements IPropertyPaneField<IPropertyPanePasswordFieldProps> {
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
  public targetProperty: string;
  public properties: IPropertyPanePasswordFieldInternalProps;
  private elem: HTMLElement;

  constructor(targetProperty: string, properties: IPropertyPanePasswordFieldProps) {
    this.targetProperty = targetProperty;
    this.properties = {
      ...properties,
      key: properties.label || 'Password',
      onRender: this.onRender.bind(this),
      onDispose: this.onDispose.bind(this),
    };
  }

  private static getEncryptionKey(context: WebPartContext): string {
    return context.webPartTag
      .substring(context.webPartTag.lastIndexOf('.') + 1)
      .split('')
      .reverse()
      .join('');
  }

  public static decrypt(context: WebPartContext, value: string) {
    if (!value) return '';

    const key = context.webPartTag
      .substring(context.webPartTag.lastIndexOf('.') + 1)
      .split('')
      .reverse()
      .join('');
    const returnValue = cryptoJS.AES.decrypt(value, this.getEncryptionKey(context)).toString(cryptoJS.enc.Utf8);
    return returnValue ? returnValue : '<Invalid decryption key>';
  }

  public static encrypt(context: WebPartContext, value: string) {
    return cryptoJS.AES.encrypt(value, this.getEncryptionKey(context)).toString();
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

    const value = get(this.properties.properties, this.targetProperty);

    const element: React.ReactElement<IPasswordFieldProps> = React.createElement(PropertyPanePasswordField, {
      label: this.properties.label,
      value: value,
      onChange: this.onChange.bind(this),
    });
    ReactDOM.render(element, elem);
  }

  private onChange(newValue: string): void {
    const context = this.properties.wpContext;
    const key = context.webPartTag
      .substring(context.webPartTag.lastIndexOf('.') + 1)
      .split('')
      .reverse()
      .join('');
    const encrypted = newValue ? PropertyPaneFieldPasswordField.encrypt(this.properties.wpContext, newValue) : '';
    update(this.properties.properties, this.targetProperty, () => encrypted);
    this.render();
  }

  private onDispose(element: HTMLElement): void {
    ReactDOM.unmountComponentAtNode(element);
  }
}
