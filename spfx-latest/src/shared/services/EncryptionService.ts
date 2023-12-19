import * as cryptoJS from 'crypto-js';
import PageContextService from './PageContextService';

export interface IEncryption {
  encrypt: (text: string) => void;
  decrypt: (text: string) => void;
}

export default class EncryptionService {
  public static prefix = 'enc:';
  private key: string;

  constructor(key?: string) {
    this.key = key ? key : PageContextService.context.pageContext.aadInfo.userId.toString().split('').reverse().join('');
    //: `${PageContextService.context.pageContext.aadInfo.userId.toString().split('').reverse().join('')}@
    //${PageContextService.context.pageContext.aadInfo.tenantId.toString().split('').reverse().join('')}`;
  }

  public encrypt(value: string, addPrefix: boolean = true): string {
    if (!value || !this.key) return value;
    return `${addPrefix ? EncryptionService.prefix : ''}${cryptoJS.AES.encrypt(value, this.key).toString()}`;
  }

  public decrypt(value: string, hasPrefix: boolean = true): string {
    if (!value?.startsWith(EncryptionService.prefix) || !this.key) return value;
    const decrypted = cryptoJS.AES.decrypt(value.substring(hasPrefix ? EncryptionService.prefix.length : 0), this.key).toString(
      cryptoJS.enc.Utf8
    );
    return decrypted ? decrypted : value;
  }
}
