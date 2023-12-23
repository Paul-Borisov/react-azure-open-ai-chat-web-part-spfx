export enum StorageType {
  Database = 'database',
  Local = 'localstorage',
  SharePoint = 'splist',
}

export enum GptModels {
  Vision = 'gpt-4-vision-preview',
}

export const GptImageModelTextLimits: { [key: string]: number } = {
  ['']: 4096 - 25,
  ['4']: 4096 - 25,
};

export const GptModelTokenLimits: { [key: string]: number } = {
  [GptModels.Vision]: 4096,
};

export default class Application {
  public static readonly Name: string = 'OpenAI';
  public static readonly MaxChatNameLength: number = 255;
  public static readonly MaxChatNameLengthEncrypted: number = 150;
}
