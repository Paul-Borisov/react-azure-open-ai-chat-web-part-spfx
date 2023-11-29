import { IFunctionService } from './IFunctionService';
import { FunctionCallingOptions } from './enums/FunctionCallingOptions';

export interface IItemPayload {
  chatHistory?: any[];
  choices?: number;
  content?: string; // Undefined if queryText specified (ignored)
  maxTokens?: number;
  model?: string;
  queryText?: string;
  siteUrl?: string;
  size?: string;
  functions?: FunctionCallingOptions;
  services?: IFunctionService[];
  images?: string[];
  signal?: AbortController;
}
