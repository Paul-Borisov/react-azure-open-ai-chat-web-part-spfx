import { FunctionServices } from './enums/FunctionServices';

export interface IFunctionService {
  name: FunctionServices;
  key: string;
  locale: string;
}
