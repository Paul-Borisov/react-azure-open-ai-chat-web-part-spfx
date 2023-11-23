export interface IUser {
  username: string;
}

export interface IChatMessage extends IUser {
  id: string;
  name: string;
  message: string;
  created: string;
  modified: string;
  enabled: boolean;
  shared?: boolean;
  displayName?: string;
  sharedWith?: string;
}

export interface IChatHistory {
  role: string;
  content: string;
}
