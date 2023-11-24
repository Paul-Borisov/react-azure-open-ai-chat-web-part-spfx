export enum StorageType {
  Database = 'database',
  Local = 'localstorage',
  SharePoint = 'splist',
}

export enum GptModels {
  Vision = 'gpt-4-vision-preview',
}

export const GptModelTokenLimits: { [key: string]: number } = {
  [GptModels.Vision]: 4096,
};

export default class Application {
  public static readonly Name: string = 'OpenAI';
}
