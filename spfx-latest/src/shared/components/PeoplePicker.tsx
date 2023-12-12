import { IPersonaProps } from '@fluentui/react/lib/Persona';
import {
  IBasePickerSuggestionsProps,
  IPeoplePickerItemSelectedProps,
  NormalPeoplePicker,
  PeoplePickerItem,
  ValidationState,
} from '@fluentui/react/lib/Pickers';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import { CustomShimmer } from 'shared/components/CustomShimmer/CustomShimmer';
import GraphQueries from 'shared/constants/GraphQueries';
import { mapSharedUsers } from 'shared/mappers/ChatMessageMapper';
import { IUser } from 'shared/model/IChat';
import { IODataQuery } from 'shared/model/IODataQuery';
import AadService from 'shared/services/AadApiService';
import LogService from 'shared/services/LogService';

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: strings.TextPeoplePickerSuggestedPeople,
  mostRecentlyUsedHeaderText: strings.TextPeoplePickerSuggestedContacts,
  noResultsFoundText: strings.TextPeoplePickerNoResults,
  loadingText: strings.TextPeoplePickerLoading,
  showRemoveButtons: true,
  suggestionsAvailableAlertText: strings.TextPeoplePickerSuggestionsAvailable,
  suggestionsContainerAriaLabel: strings.TextPeoplePickerSuggestedContacts,
};

interface IPeopePicker {
  header?: JSX.Element;
  selectedUserIds: string[];
  onChange: (selectedPeople: IUser[]) => void;
}

export const PeoplePicker: React.FunctionComponent<IPeopePicker> = (props) => {
  const [isNoData, setIsNoData] = React.useState<boolean>(false);
  const [peopleList, setPeopleList] = React.useState<IPersonaProps[]>([]);
  const [defaultSelectedItems, setDefaultSelectedItems] = React.useState<IPersonaProps[]>(undefined);

  const picker = React.useRef(null);

  React.useMemo(async () => {
    const getOrgPeople = (data: any[]): IPersonaProps[] => {
      LogService.debug(null, data);
      const filtered = data.filter((a) => a.jobTitle);
      return filtered
        .sort((a, b) => (a.displayName > b.displayName ? 1 : a.displayName < b.displayName ? -1 : 0))
        .map((person) => {
          const entry: IPersonaProps = {
            text: person.displayName,
            secondaryText: person.jobTitle,
            optionalText: person.userPrincipalName,
            tertiaryText: person.id,
          };
          return entry;
        });
    };

    let query: IODataQuery = GraphQueries.users;
    let data: any[];
    data = await AadService.getData(query).catch((error) => LogService.error(error));

    let orgPeople: IPersonaProps[];
    if (data) {
      orgPeople = getOrgPeople(data);
    } else {
      query = GraphQueries.myWorkingWithColleagues;
      data = await AadService.getData(query).catch((error) => LogService.error(error));
      if (data) orgPeople = getOrgPeople(data);
    }

    if (orgPeople) {
      if (orgPeople.length === 0) {
        setIsNoData(true);
        return;
      }
      setDefaultSelectedItems(orgPeople.filter((p) => props.selectedUserIds?.some((oid) => oid === p.tertiaryText)));
      setPeopleList(orgPeople);
    } else {
      setIsNoData(true);
    }
  }, []);

  const filterPersonasByText = (filterText: string): IPersonaProps[] => {
    return peopleList.filter((item) => doesTextStartWith(item.text as string, filterText));
  };

  const filterPromise = (personasToReturn: IPersonaProps[]): IPersonaProps[] | Promise<IPersonaProps[]> => {
    return personasToReturn;
  };

  const onFilterChanged = (
    filterText: string,
    currentPersonas: IPersonaProps[],
    limitResults?: number
  ): IPersonaProps[] | Promise<IPersonaProps[]> => {
    if (filterText) {
      let filteredPersonas: IPersonaProps[] = filterPersonasByText(filterText);

      filteredPersonas = removeDuplicates(filteredPersonas, currentPersonas);
      filteredPersonas = limitResults ? filteredPersonas.slice(0, limitResults) : filteredPersonas;
      return filterPromise(filteredPersonas);
    } else {
      return [];
    }
  };

  const returnMostRecentlyUsed = (currentPersonas: IPersonaProps[]): IPersonaProps[] | Promise<IPersonaProps[]> => {
    return filterPromise(removeDuplicates(peopleList, currentPersonas));
  };

  const onRemoveSuggestion = (item: IPersonaProps): void => {
    const indexPeopleList: number = peopleList.indexOf(item);

    if (indexPeopleList >= 0) {
      const newPeople: IPersonaProps[] = peopleList.slice(0, indexPeopleList).concat(peopleList.slice(indexPeopleList + 1));
      setPeopleList(newPeople);
    }
  };

  const renderItemWithSecondaryText = (props: IPeoplePickerItemSelectedProps) => {
    const newProps = {
      ...props,
      item: {
        ...props.item,
        ValidationState: ValidationState.valid,
        showSecondaryText: true,
      },
    };

    return <PeoplePickerItem {...newProps} />;
  };

  return isNoData ? null : peopleList?.length > 0 ? (
    <div>
      {props.header}
      <NormalPeoplePicker
        // eslint-disable-next-line react/jsx-no-bind
        onResolveSuggestions={onFilterChanged}
        // eslint-disable-next-line react/jsx-no-bind
        onEmptyResolveSuggestions={returnMostRecentlyUsed}
        getTextFromItem={getTextFromItem}
        pickerSuggestionsProps={suggestionProps}
        className={'ms-PeoplePicker'}
        key={'normal'}
        // eslint-disable-next-line react/jsx-no-bind
        onRemoveSuggestion={onRemoveSuggestion}
        onRenderItem={renderItemWithSecondaryText}
        onValidateInput={validateInput}
        removeButtonAriaLabel={strings.TextRemove}
        inputProps={{
          'aria-label': strings.TextPeoplePicker,
        }}
        componentRef={picker}
        onChange={(e) => props.onChange(mapSharedUsers(e))}
        resolveDelay={300}
        itemLimit={15} // To save no more than 555 chars like guid1;guid2;... into the column sharedwith
        defaultSelectedItems={defaultSelectedItems}
      />
    </div>
  ) : (
    <>
      <CustomShimmer isCompact={true} />
    </>
  );
};

function doesTextStartWith(text: string, filterText: string): boolean {
  return text.toLowerCase().indexOf(filterText.toLowerCase()) === 0;
}

function removeDuplicates(personas: IPersonaProps[], possibleDupes: IPersonaProps[]) {
  return personas.filter((persona) => !listContainsPersona(persona, possibleDupes));
}

function listContainsPersona(persona: IPersonaProps, personas: IPersonaProps[]) {
  if (!personas || !personas.length || personas.length === 0) {
    return false;
  }
  return personas.filter((item) => item.text === persona.text).length > 0;
}

function getTextFromItem(persona: IPersonaProps): string {
  return persona.text as string;
}

function validateInput(input: string): ValidationState {
  if (input.indexOf('@') !== -1) {
    return ValidationState.valid;
  } else if (input.length > 1) {
    return ValidationState.warning;
  } else {
    return ValidationState.invalid;
  }
}
