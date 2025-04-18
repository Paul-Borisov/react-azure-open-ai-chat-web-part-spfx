export enum StorageType {
  Database = 'database',
  Local = 'localstorage',
  SharePoint = 'splist',
}

export enum GptModels {
  //Vision = 'gpt-4-vision-preview',
  Vision = 'gpt-4o', // https://platform.openai.com/docs/deprecations, 2024-12-06, recommended replacement gpt-4o
  //Vision = 'gpt-4.1', // This works as well. Perhaps, a better replacement?
}

export const GptImageModelTextLimits: { [key: string]: number } = {
  ['']: 4096 - 25,
  ['4']: 4096 - 25,
};

export const GptModelTokenLimits: { [key: string]: number } = {
  //[GptModels.Vision]: 4096,
  [GptModels.Vision]: 8192,
};

export default class Application {
  public static readonly Name: string = 'OpenAI';
  public static readonly MaxChatNameLength: number = 255;
  public static readonly MaxChatNameLengthEncrypted: number = 150;
}
