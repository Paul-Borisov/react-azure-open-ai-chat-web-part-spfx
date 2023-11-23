import { Checkbox, ISelectableOption, Label } from '@fluentui/react';
import { update, get } from '@microsoft/sp-lodash-subset';
import { IPropertyPaneCustomFieldProps, IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styles from './PropertyPaneFieldCheckboxGroup.module.scss';

interface IPropertyPaneCheckboxGroupProps {
  label?: string;
  options: ISelectableOption[];
  properties: any;
}

interface IPropertyPaneCheckboxGroupInternalProps extends IPropertyPaneCheckboxGroupProps, IPropertyPaneCustomFieldProps {}

interface ICheckboxGroupProps {
  label: string;
  options: ISelectableOption[];
  onChange: (newSelectedOptions: ISelectableOption[]) => void;
}
const CheckboxGroup: React.FunctionComponent<ICheckboxGroupProps> = (props) => {
  return React.createElement(React.Fragment, undefined, [
    React.createElement(Label, undefined, props.label),
    ...props.options.map((o) =>
      React.createElement(Checkbox, {
        label: o.text,
        value: o.key,
        checked: o.selected,
        onChange: (e, checked) => {
          o.selected = checked;
          props.onChange([...props.options]);
        },
        className: styles.checkbox,
      })
    ),
  ]);
};

export default class PropertyPaneFieldCheckboxGroup implements IPropertyPaneField<IPropertyPaneCheckboxGroupProps> {
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
  public targetProperty: string;
  public properties: IPropertyPaneCheckboxGroupInternalProps;
  private elem: HTMLElement;

  constructor(targetProperty: string, properties: IPropertyPaneCheckboxGroupProps) {
    this.targetProperty = targetProperty;
    this.properties = {
      ...properties,
      key: properties.label || 'PropertyPaneCheckboxGroup',
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

  private onRender(elem: HTMLElement): void {
    if (!this.elem) {
      this.elem = elem;
    }

    let selectedKeys = get(this.properties.properties, this.targetProperty);
    if (typeof selectedKeys === 'string') selectedKeys = selectedKeys.split(',');
    const options = [...this.properties.options];
    options.forEach((o) => (o.selected = !selectedKeys || !!selectedKeys.find((k) => k === o.key)));

    const element: React.ReactElement<ICheckboxGroupProps> = React.createElement(CheckboxGroup, {
      label: this.properties.label,
      options: this.properties.options,
      onChange: this.onChange.bind(this),
    });
    ReactDOM.render(element, elem);
  }

  private onChange(newSelectedOptions: ISelectableOption[]): void {
    update(this.properties.properties, this.targetProperty, () =>
      newSelectedOptions
        .filter((o) => o.selected)
        .map((o) => o.key)
        .join(',')
    );
    this.render();
  }

  private onDispose(element: HTMLElement): void {
    ReactDOM.unmountComponentAtNode(element);
  }
}
