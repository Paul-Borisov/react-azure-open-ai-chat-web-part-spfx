import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import MessageBar, { MessageType } from 'shared/components/MessageBar/MessageBar';
import { IItemConfig } from 'shared/model/IItemConfig';
import Chat from './Chat';
import { IAzureOpenAiChatProps } from './IAzureOpenAiChatProps';

const appNameChatGpt: string = 'ChatGPT';
const preferredDefaultModels = ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o', 'o1-mini', 'gpt-35-turbo'];

const AzureOpenAiChat: React.FunctionComponent<IAzureOpenAiChatProps> = (props) => {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [itemConfig, setItemConfig] = React.useState<IItemConfig>(undefined);
  const [isAzureApiServiceConfigured, setIsAzureApiServiceConfigured] = React.useState<boolean>(false);

  const openChat = () => {
    const languageModels = new Set(props.languageModels);
    let selectedModel = '';
    for (const model of preferredDefaultModels) {
      if (languageModels.has(model)) {
        selectedModel = model;
        break;
      }
    }
    if (!selectedModel) {
      selectedModel = props.languageModels?.length > 0 ? props.languageModels[props.languageModels.length - 1] : '';
    }
    const config: IItemConfig = {
      name: appNameChatGpt,
      description: strings.TextChat,
      model: selectedModel,
    };
    setItemConfig(config);
    setIsChatOpen(true);
  };

  React.useEffect(() => {
    if (props.apiService.isConfigured() && !props.apiService.isDisabled()) {
      setIsAzureApiServiceConfigured(true);
      openChat();
    }
  }, [props.apiService.isConfigured(), props.apiService.isDisabled()]);

  return isAzureApiServiceConfigured ? (
    // AzureOpenAiChatLoader > AzureOpenAiChat > Chat > ContentPanel > NavigationPanel
    <>{itemConfig && React.createElement(Chat, { config: itemConfig, isOpen: isChatOpen, ...props })}</>
  ) : (
    <MessageBar type={MessageType.error} message={strings.TextUndeterminedError} />
  );
};
export default AzureOpenAiChat;
