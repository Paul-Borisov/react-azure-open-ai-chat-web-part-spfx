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
  }

  public encrypt(value: string, addPrefix: boolean = true): string {
    if (!value || !this.key) return value;
    return `${addPrefix ? EncryptionService.prefix : ''}${cryptoJS.AES.encrypt(value, this.key).toString()}`;
  }

  public decrypt(value: string, hasPrefix: boolean = true, oid?: string): string {
    if (!value?.startsWith(EncryptionService.prefix) || !this.key) return value;

    const key = oid ? oid.split('').reverse().join('') : this.key;
    const decrypted = cryptoJS.AES.decrypt(value.substring(hasPrefix ? EncryptionService.prefix.length : 0), key).toString(
      cryptoJS.enc.Utf8
    );
    return decrypted ? decrypted : value;
  }
}
