import { IPersonaProps } from '@fluentui/react/lib/Persona';
import { IChatMessage, IUser } from 'shared/model/IChat';
import { FieldNames } from 'shared/model/enums/FieldNames';

export function mapResponseData(responseData: any): IChatMessage[] {
  return responseData?.map((row) => {
    const chatMessage: IChatMessage = {
      id: row.id,
      name: row.name,
      username: row.username,
      message: row.message,
      created: row.created,
      modified: row.modified,
      enabled: row.enabled,
      shared: row.shared,
      displayName: row.displayName,
      sharedWith: row.sharedWith,
    };
    return chatMessage;
  });
}

export function mapSharedUsers(value: IPersonaProps[]): IUser[] {
  return value.map((p) => {
    return {
      username: p.tertiaryText,
    };
  });
}

export function mapSPListData(responseData: any): IChatMessage[] {
  return responseData?.map((row) => {
    const chatMessage: IChatMessage = {
      id: row[FieldNames.id],
      name: row[FieldNames.name],
      username: row[FieldNames.userName],
      message: row[FieldNames.message],
      created: row[FieldNames.created],
      modified: row[FieldNames.modified],
      enabled: row[FieldNames.enabled],
      shared: row[FieldNames.shared],
      displayName: row[FieldNames.displayName],
      sharedWith: row[FieldNames.sharedWith],
    };
    return chatMessage;
  });
}
