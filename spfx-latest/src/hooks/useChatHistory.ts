import ChatHelper from 'helpers/ChatHelper';
import * as React from 'react';
import LogService from 'shared/services/LogService';

export interface IMessageLength {
  defaultTextLength: number;
  maxContentLength: number;
  maxContentLengthExceeded: boolean;
  maxTextLength: number;
  messageLength: number;
}

export default function useChatHistory(
  chatHistory: any[],
  maxTokens: number,
  chatHistoryGuid: string,
  model: string
): IMessageLength {
  const memo = React.useMemo(() => {
    const maxContentLength = ChatHelper.maxContentLength(model, maxTokens);

    let messageLength = 10000000;
    const hasImages = ChatHelper.truncateImages(chatHistory, true);
    if (hasImages) {
      const newChatHistory = JSON.parse(JSON.stringify(chatHistory));
      ChatHelper.truncateImages(newChatHistory);
      messageLength = JSON.stringify(newChatHistory).length;
    } else {
      messageLength = JSON.stringify(chatHistory || []).length;
    }

    const maxContentLengthExceeded = messageLength > maxContentLength;
    const maxTextLength = ChatHelper.maxRequestLength(model, maxTokens, messageLength);
    if (maxContentLengthExceeded) {
      LogService.debug(
        null,
        `maxContentLength: ${maxContentLength}, messageLength: ${messageLength}, maxTextLength: ${maxTextLength}`
      );
    }
    const returnValue: IMessageLength = {
      defaultTextLength: ChatHelper.maxRequestLength(model, maxTokens, 0),
      maxContentLength: maxContentLength,
      maxContentLengthExceeded: maxContentLengthExceeded,
      maxTextLength: maxTextLength,
      messageLength: messageLength,
    };
    return returnValue;
  }, [chatHistoryGuid, model]);

  return memo;
}
