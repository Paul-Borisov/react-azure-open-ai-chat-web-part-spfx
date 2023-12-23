import Application from 'shared/constants/Application';
import { mapResponseData } from 'shared/mappers/ChatMessageMapper';
import { IChatHistory, IChatMessage } from 'shared/model/IChat';
import PageContextService from './PageContextService';

const prefix = Application.Name;

export default class LocalStorageService {
  private static getChatMessages(): IChatMessage[] {
    const userId = PageContextService.context.pageContext.aadInfo.userId.toString();
    const json = JSON.parse(localStorage.getItem(`${prefix}_${userId}`) || '[]');
    return mapResponseData(json);
  }

  private static saveChatMessages(messages: IChatMessage[]): any {
    const userId = PageContextService.context.pageContext.aadInfo.userId.toString();
    localStorage.setItem(`${prefix}_${userId}`, JSON.stringify(messages));
  }

  public static async loadChatHistory(callback: (data: IChatMessage[]) => void, shared?: boolean) {
    const messages = this.getChatMessages().filter((m) => m.enabled);
    callback(shared ? messages.filter((m) => m.shared) : messages);
  }

  public static async deleteChat(id: string, callback: () => void) {
    const messages = this.getChatMessages();
    /*const chatMessage = messages.find((m) => m.id === id);
    if (chatMessage) {
      chatMessage.enabled = false;
      chatMessage.modified = new Date().toISOString();
    }
    this.saveChatMessages(messages);*/
    // No reason to keep the localStorage occupied; just remove it.
    this.saveChatMessages(messages.filter((m) => m.id !== id));
    callback();
  }

  public static async createChat(
    newChatName: string,
    newChatHistory: IChatHistory[],
    callback: (newChatGuid: string) => void,
    displayName?: string
  ) {
    const newChatGuid = (crypto as any).randomUUID();
    const newChatMessage: IChatMessage = {
      id: newChatGuid,
      name: newChatName,
      username: PageContextService.context.pageContext.aadInfo.userId.toString(),
      message: JSON.stringify(newChatHistory),
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      enabled: true,
      shared: false,
      displayName: displayName === undefined ? PageContextService.context.pageContext.user.displayName : displayName,
      sharedWith: undefined,
    };
    const messages = this.getChatMessages();
    this.saveChatMessages([newChatMessage, ...messages]);
    callback(newChatGuid);
  }

  public static async updateChatHistory(id: string, newChatHistory: IChatHistory[], callback: () => void, modified?: string) {
    const messages = this.getChatMessages();
    const chatMessage = messages.find((m) => m.id === id);
    if (chatMessage) {
      chatMessage.message = JSON.stringify(newChatHistory);
      chatMessage.modified = modified ?? new Date().toISOString();
    }
    this.saveChatMessages(messages);
    if (callback) callback();
  }

  public static async updateChatName(id: string, newChatHName: string, modified: string, callback: () => void) {
    const messages = this.getChatMessages();
    const chatMessage = messages.find((m) => m.id === id);
    if (chatMessage) {
      chatMessage.name = newChatHName;
    }
    this.saveChatMessages(messages);
    if (callback) callback();
  }

  public static async shareChat(id: string, share: boolean, shareWith: string[], modified: string, callback: () => void) {
    const messages = this.getChatMessages();
    const chatMessage = messages.find((m) => m.id === id);
    if (chatMessage) {
      chatMessage.shared = !!share;
      chatMessage.sharedWith = shareWith?.join(';');
    }
    this.saveChatMessages(messages);
    if (callback) callback();
  }

  public static async clearDisplayName(id: string) {
    const messages = this.getChatMessages();
    const chatMessage = messages.find((m) => m.id === id);
    if (chatMessage) {
      chatMessage.displayName = null;
    }
    this.saveChatMessages(messages);
  }
}
