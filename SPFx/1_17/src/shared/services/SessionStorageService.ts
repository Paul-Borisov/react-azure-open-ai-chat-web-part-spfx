import Application from 'shared/constants/Application';

const prefix = Application.Name;

enum SessionStorageKeys {
  rawResults = 'rawResults',
  errorDetails = 'errorDetails',
}

export default class SessionStorageService {
  public static hasFunctions = false;
  public static keys = SessionStorageKeys;

  public static clearData(key: string): void {
    if (typeof sessionStorage !== 'undefined' && this.getData(key)) {
      sessionStorage.removeItem(`${prefix}_${key}`);
    }
  }

  public static clearRawResults() {
    if (this.hasFunctions) SessionStorageService.clearData(SessionStorageService.keys.rawResults);
  }

  public static clearErrorDetails() {
    SessionStorageService.clearData(SessionStorageService.keys.errorDetails);
  }

  public static getData(key: string): string {
    return typeof sessionStorage !== undefined ? sessionStorage.getItem(`${prefix}_${key}`) : undefined;
  }

  public static setData(key: string, data: string): void {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(`${prefix}_${key}`, data);
  }
}
