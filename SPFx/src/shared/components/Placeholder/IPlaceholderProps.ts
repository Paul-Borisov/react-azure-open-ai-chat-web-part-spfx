import { DisplayMode } from '@microsoft/sp-core-library';
import { IPropertyPaneAccessor } from '@microsoft/sp-webpart-base';

export interface IPlaceholderProps {
  propertyPane?: IPropertyPaneAccessor;
  displayMode?: DisplayMode;
  iconName?: string;
  iconText?: string;
  description?: string;
  buttonLabel?: string;
  useRoundedCorners?: string;
  onConfigure?: () => void;
}
