import { FunctionComponent } from 'react';
import * as React from 'react';
import { IItemConfig } from 'shared/model/IItemConfig';
import ContentPanel from './ContentPanel';
import { IAzureOpenAiChatProps } from './IAzureOpenAiChatProps';

export interface IChatProps extends IAzureOpenAiChatProps {
  config: IItemConfig;
  isOpen: boolean;
}

const Chat: FunctionComponent<IChatProps> = (props) => {
  return <ContentPanel props={props} />; // AzureOpenAiChatLoader > AzureOpenAiChat > Chat > ContentPanel > NavigationPanel
};

export default Chat;
