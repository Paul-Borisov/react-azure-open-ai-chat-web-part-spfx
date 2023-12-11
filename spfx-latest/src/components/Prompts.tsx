import { Dropdown, DropdownMenuItemType, IDropdownOption } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import { IAzureOpenAiChatProps } from './IAzureOpenAiChatProps';
import styles from './Prompts.module.scss';

interface IPrompts {
  settings: IAzureOpenAiChatProps;
  setPrompt: (text: string) => void;
}
interface ISample {
  text: string;
  active: boolean;
}
const Prompts: React.FunctionComponent<IPrompts> = (props) => {
  const samples: ISample[] = [
    {
      text: 'Create an image: an illustration of a business meeting',
      active: props.settings.images,
    },
    {
      text: "Search on the Internet: Sam Altman's ouster",
      active: props.settings.bing || props.settings.google,
    },
    {
      text: 'Search on Bing: Microsoft Copilot, most recent news',
      active: props.settings.bing,
    },
    {
      text: 'Search on Google: Gemini AI, most recent news. Add Reddit.',
      active: props.settings.google,
    },
    {
      text: 'Search on Bing and Google: Open AI vs Gemini. Show 5 most recent results from each.',
      active: props.settings.bing && props.settings.google,
    },
    {
      text: 'Search on SharePoint: Resource Management System. Format the results as an HTML table.',
      active: props.settings.functions,
    },
    { text: 'People search: all users with the name John. Roles and emails.', active: props.settings.functions },
    {
      text: 'Get company users that have names starting with K. Format the results as an HTML table.',
      active: props.settings.functions,
    },
    { text: 'The current date and time', active: props.settings.functions },
    {
      text:
        'Generate CSV-table for all weeks of ' +
        new Date().getFullYear() +
        '. Columns: WeekNumber, StartDate;, EndDate. Use semicolon as column delimiter and ISO-date format. Start day is Monday. End day is Friday. Wrap into ```',
      active: true,
    },
    { text: 'Powershell code to connect to Azure SQL database', active: true },
  ];

  const emptyOption = { key: 0, text: strings.TextExamples, itemType: DropdownMenuItemType.Header };
  const options: IDropdownOption[] = [{ ...emptyOption, data: emptyOption }];
  options.push(
    ...samples.filter((r) => r.active).map((r, index) => ({ key: index + 1, text: r.text, data: r } as IDropdownOption))
  );
  const choices = (
    <Dropdown
      className={styles.prompts}
      selectedKey={emptyOption.key}
      options={options}
      //responsiveMode={ResponsiveMode.unknown}
      onChange={(e, option: IDropdownOption) => {
        props.setPrompt(option.key ? option.text : '');
      }}
      dropdownWidth={'auto'}
    />
  );
  return choices;
};
export default Prompts;
