import { Dropdown, DropdownMenuItemType, IDropdown, IDropdownOption } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import { LocalesPopular } from 'shared/constants/Locales';
import styles from './Speech.module.scss';

interface ILanguage {
  handleSelection: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
}

const Languages: React.FunctionComponent<ILanguage> = (props) => {
  const refLanguages = React.useRef<IDropdown>();

  React.useEffect(() => {
    if (props.isOpen) {
      document.getElementById((refLanguages.current as any)._id).click();
    }
  }, [props.isOpen]);

  const emptyOption = { key: '', text: strings.TextLanguage, itemType: DropdownMenuItemType.Header };
  const options: IDropdownOption[] = [{ ...emptyOption }];
  options.push(...LocalesPopular.map((l) => ({ key: l.code, text: l.label, title: l.title ?? l.label })));
  const languages = (
    <Dropdown
      className={styles.languages}
      componentRef={refLanguages}
      selectedKey={''}
      options={options}
      //responsiveMode={ResponsiveMode.unknown}
      onChange={(e, option: IDropdownOption) => {
        if (option.key) props.handleSelection(option.key.toString());
      }}
      onDismiss={() => {
        props.setIsOpen(false);
      }}
      dropdownWidth={'auto'}
    />
  );

  return props.isOpen ? languages : null;
};

export default Languages;
