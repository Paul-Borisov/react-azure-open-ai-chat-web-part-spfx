import { FontIcon } from '@fluentui/react';
import { DisplayMode, Environment, EnvironmentType } from '@microsoft/sp-core-library';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import LinkButton from 'shared/components/LinkButton/LinkButton';
import { IPlaceholderProps } from './IPlaceholderProps';
import styles from './Placeholder.module.scss';

const Placeholder: React.FunctionComponent<IPlaceholderProps> = ({
  iconName,
  iconText,
  description,
  buttonLabel,
  displayMode,
  useRoundedCorners,
  onConfigure,
  propertyPane,
}) => {
  const isClassicPage: boolean = Environment.type === EnvironmentType.ClassicSharePoint;

  return (
    <section className={[styles.placeholder, useRoundedCorners ? styles.rounded : undefined].join(' ')}>
      <header>
        <FontIcon iconName={iconName || 'Edit'} />
        <p>{iconText || strings.PlaceholderText}</p>
      </header>
      <div>
        <p>{(description === undefined && strings.PlaceholderDescription) || description}</p>
        {!isClassicPage && displayMode !== DisplayMode.Read && (
          <LinkButton variant="primary" text={buttonLabel || strings.TextConfigure} onClick={onConfigure || onConfigureClick} />
        )}
      </div>
    </section>
  );

  function onConfigureClick(): void {
    if (propertyPane) {
      if (propertyPane.isPropertyPaneOpen() && propertyPane.isRenderedByWebPart()) {
        propertyPane.close();
      } else {
        propertyPane.open();
      }
    }
  }
};

export default Placeholder;
