import { DefaultButton, FontIcon, Panel, PanelType, TooltipHost, TooltipOverflowMode } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import ChatHelper from 'helpers/ChatHelper';
import useChatHistory from 'hooks/useChatHistory';
import useStorageService from 'hooks/useStorageService';
import { FunctionComponent } from 'react';
import * as React from 'react';
import { formatCode, hasMarkdown } from 'shared/components/CodeHighlighter/CodeHighlighter';
import { getSimpleDialog } from 'shared/components/CustomDialog';
import { CustomShimmer } from 'shared/components/CustomShimmer/CustomShimmer';
import LinkButton from 'shared/components/LinkButton/LinkButton';
import MessageBar, { MessageType } from 'shared/components/MessageBar/MessageBar';
import { GptModels } from 'shared/constants/Application';
import HtmlHelper from 'shared/helpers/HtmlHelper';
import { IChatHistory, IChatMessage } from 'shared/model/IChat';
import LogService from 'shared/services/LogService';
import SessionStorageService from 'shared/services/SessionStorageService';
import { IChatProps } from './Chat';
import styles from './Chat.module.scss';
import * as Icons from './Icons';
import NavigationPanel, { canOpenCustomPanel } from './NavigationPanel';
import UploadFiles from './UploadFiles';

export interface IContentPanelProps {
  props: IChatProps;
}

const ContentPanel: FunctionComponent<IContentPanelProps> = ({ props }) => {
  const [firstLoad, setFirstLoad] = React.useState<boolean>(true);
  const [model, setModel] = React.useState<string>(props.config.model);
  const [isProgress, setIsProgress] = React.useState<boolean>(false);
  const [isStreamProgress, setIsStreamProgress] = React.useState<boolean>(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = React.useState<boolean>(true);

  const [chatName, setChatName] = React.useState<string>(undefined);

  const [chatHistory, setChatHistory] = React.useState<IChatHistory[]>([]);
  const [chatHistoryId, setChatHistoryId] = React.useState(undefined);
  const [myChats, setMyChats] = React.useState<IChatMessage[]>(undefined);
  const [sharedChats, setSharedChats] = React.useState<IChatMessage[]>(undefined);
  const [selectedSharedChat, setSelectedSharedChat] = React.useState(undefined);

  const [reloadNavigation, setReloadNavigation] = React.useState<boolean>();
  const [responseContentError, setResponseContentError] = React.useState<string>(undefined);

  const [requestCharsCount, setRequestCharsCount] = React.useState<number>(0);
  const [editingChatMessageId, setEditingChatMessageId] = React.useState<string>(undefined);

  const [selectedCodeStyle, setSelectedCodeStyle] = React.useState(props.highlightStyleDefault);
  const [disabledHighlights, setDisabledHighlights] = React.useState<string[]>([]);

  const [pageTitle] = React.useState<string>(document.querySelector('title')?.innerHTML);
  const [isCustomPanelOpen, setIsCustomPanelOpen] = React.useState<boolean>();

  const [formattedContent, setFormattedContent] = React.useState<JSX.Element[]>();

  const refPrompt = React.useRef<HTMLTextAreaElement>();
  const refPromptInCustomPanel = React.useRef<HTMLTextAreaElement>();
  const refPanelContentPane = React.useRef<HTMLDivElement>();
  const refPanelContentPaneInCustomPanel = React.useRef<HTMLDivElement>();

  const refConversationContainer = React.useRef<HTMLDivElement>();
  const refConversationContainerInCustomPanel = React.useRef<HTMLDivElement>();

  const [showUploadDialog, setShowUploadDialog] = React.useState<boolean>(false);
  const refFileUpload = React.useRef<HTMLInputElement>();
  const [imageUrls, setImageUrls] = React.useState<string[]>();
  const [pdfFileContent, setPdfFileContent] = React.useState<{ [key: string]: string }>();
  const clearImages = () => {
    setImageUrls(undefined);
    setPdfFileContent(undefined);
    if (refFileUpload.current?.value) refFileUpload.current.value = '';
  };

  const wpId = React.useMemo(() => props.context.webPartTag.substring(props.context.webPartTag.lastIndexOf('.') + 1), []);

  const chatHistoryParams = useChatHistory(
    chatHistory,
    props.config.maxTokens,
    chatHistoryId,
    imageUrls?.length ? GptModels.Vision : model
  );

  const storageService = useStorageService(props);

  React.useMemo(() => {
    if (props.isOpen && !myChats) {
      loadChats();
    }
  }, [props.isOpen]);

  React.useEffect(() => {
    if (isCustomPanelOpen || props.isOpen) {
      ChatHelper.changePageTitle(chatName ?? strings.TextNewChat);
    } else {
      ChatHelper.changePageTitle(pageTitle);
    }
  }, [props.isOpen, isCustomPanelOpen, chatName]);

  React.useEffect(() => {
    // Using additional delay to ensure refPanelContentPaneInCustomPanel.current has been set on the first load.
    setTimeout(scrollContentToBottom, 200);
    // Using additional delay to ensure refConversationContainerInCustomPanel.current has been set on the first load.
    setTimeout(scrollNavigationToTop, 200);
    setTimeout(() => {
      const sourceTextArea = isCustomPanelOpen ? refPrompt.current : refPromptInCustomPanel.current;
      const targetTextArea = !isCustomPanelOpen ? refPrompt.current : refPromptInCustomPanel.current;
      if (sourceTextArea && targetTextArea && sourceTextArea.value !== targetTextArea.value) {
        targetTextArea.value = sourceTextArea.value;
        resizePrompt({ target: targetTextArea });
      }
    }, 200);
  }, [isCustomPanelOpen]);

  React.useEffect(() => {
    if (!imageUrls?.length) return;
    setTimeout(() => {
      const targetTextArea = !isCustomPanelOpen ? refPrompt.current : refPromptInCustomPanel.current;
      if (
        !targetTextArea.value ||
        (targetTextArea.value === strings.TextDescribeImage && imageUrls?.length > 1) ||
        (targetTextArea.value === strings.TextDescribeImages && imageUrls?.length === 1)
      ) {
        targetTextArea.value = imageUrls?.length > 1 ? strings.TextDescribeImages : strings.TextDescribeImage;
        resizePrompt({ target: targetTextArea });
      }
    }, 200);
  }, [imageUrls?.length]);

  React.useEffect(() => {
    if (!pdfFileContent) return;
    setTimeout(() => {
      const targetTextArea = !isCustomPanelOpen ? refPrompt.current : refPromptInCustomPanel.current;
      targetTextArea.value = strings.TextSummarizePdf;
      resizePrompt({ target: targetTextArea });
    }, 200);
  }, [pdfFileContent]);

  React.useEffect(() => {
    setFormattedContent([]);
  }, [chatHistoryId, selectedCodeStyle]);

  React.useEffect(() => {
    if (model) {
      clearImages();
      setResponseContentError(undefined);
    }
  }, [model]);

  return (
    <>
      {getContentPanel(refPanelContentPane, refPrompt, refConversationContainer)}
      {isCustomPanelOpen !== undefined && (
        <Panel
          className={styles.customPanel}
          style={{ opacity: isCustomPanelOpen ? 1 : 0 }}
          isOpen={isCustomPanelOpen}
          hasCloseButton={false}
          onDismiss={() => {
            // Next line disables the standard close behavior on ESC and on clicking Close button. Custom ChromeClose buton below sets setIsCustomPanelOpen(false)}
            return false;
          }}
          isLightDismiss={false}
          isHiddenOnDismiss={true}
          type={PanelType.custom}
        >
          <span className={styles.container}>
            {getContentPanel(refPanelContentPaneInCustomPanel, refPromptInCustomPanel, refConversationContainerInCustomPanel)}
            <TooltipHost content={strings.TextClose}>
              <FontIcon className={styles.closepanel} iconName={'ChromeClose'} onClick={() => setIsCustomPanelOpen(false)} />
            </TooltipHost>
          </span>
        </Panel>
      )}
    </>
  );

  function loadChats(callback: () => void = undefined) {
    setIsProgress(true);
    setFormattedContent([]);
    setResponseContentError(undefined);
    storageService
      .loadChatHistory((data) => (data ? setMyChats(data) : setResponseContentError(strings.TextUndeterminedError)))
      .then(() => {
        if (typeof callback === 'function') callback();
        if (props.sharing) {
          storageService
            .loadChatHistory(
              (data) => (data ? setSharedChats(data) : setResponseContentError(strings.TextUndeterminedError)),
              true
            )
            .then(() => setIsProgress(false))
            .catch(() => setIsProgress(false));
        } else {
          setIsProgress(false);
        }
      })
      .catch(() => setIsProgress(false));
  }

  function clearChatMessages() {
    setChatHistoryId(undefined);
    setChatName(undefined);
    setChatHistory([]);
    setFormattedContent([]);
    if (refPrompt.current) refPrompt.current.value = '';
    if (refPromptInCustomPanel.current) refPromptInCustomPanel.current.value = '';
    SessionStorageService.clearRawResults();
    clearImages();
    setResponseContentError(undefined);
  }

  function editChatMessage(id: string) {
    setEditingChatMessageId(id);
  }
  function saveEditedChatMessage(chatMessageIndex: number, newContent: string) {
    const newChatHistory = [...chatHistory];
    const modified = myChats?.find((chat) => chat.id === chatHistoryId)?.modified;
    const message: IChatHistory = newChatHistory[chatMessageIndex];
    message.content = ChatHelper.sanitizeHtml(newContent);
    saveChatHistory(newChatHistory, modified);
    setEditingChatMessageId(undefined);
    setFormattedContent([]);
  }

  function reloadChatHistory(id: string, name: string, newChatHistory: IChatHistory[]) {
    setChatHistoryId(id);
    setChatName(name);
    setChatHistory(newChatHistory);
    setDisabledHighlights([]);
    scrollContentToBottom();
    SessionStorageService.clearRawResults();
    clearImages();
    setResponseContentError(undefined);
  }

  function scrollContentToBottom() {
    ChatHelper.scrollToBottom(!isCustomPanelOpen ? refPanelContentPane.current : refPanelContentPaneInCustomPanel.current);
  }

  function scrollNavigationToTop() {
    ChatHelper.scrollToTop(
      !isCustomPanelOpen ? refConversationContainer?.current : refConversationContainerInCustomPanel?.current
    );
  }

  function getContentPanel(
    refContentPane: React.LegacyRef<HTMLDivElement>,
    refPromptArea: React.LegacyRef<HTMLTextAreaElement>,
    refNavigation: React.LegacyRef<HTMLDivElement>
  ): JSX.Element {
    const rows: JSX.Element[] =
      //chatHistory.length > 0 ? getChatHistoryContent(chatHistory) : [];
      // Additional protection against incorrectly saved data
      chatHistory.length > 0 ? getChatHistoryContent(chatHistory.filter((r) => typeof r.content === 'string')) : [];

    const isDisabled: boolean = isProgress || isSubmitDisabled;
    const submitButton: JSX.Element = (
      <LinkButton
        onClick={submitPayload}
        className={[styles.linkButton, isDisabled ? styles.disabled : undefined].join(' ').trim()}
        disabled={isDisabled}
      >
        <TooltipHost content={strings.TextSubmit}>
          {<FontIcon iconName={'Send'} style={{ opacity: isProgress ? 0.5 : 1 }} />}
        </TooltipHost>
      </LinkButton>
    );

    const getChatName = (className: string = undefined) => {
      return (
        <div
          className={[
            styles.chatname,
            className,
            props.promptAtBottom ? styles.promptAtBottom : undefined,
            isCustomPanelOpen && props.promptAtBottom ? styles.insidePanel : undefined,
          ]
            .join(' ')
            .trim()}
        >
          <TooltipHost content={chatName ?? strings.TextNewChat} overflowMode={TooltipOverflowMode.Parent}>
            {chatName ?? strings.TextNewChat}
          </TooltipHost>
        </div>
      );
    };

    const getFileUpload = (): JSX.Element => {
      const isVisionSupported =
        /gpt-4/i.test(model) &&
        (props.apiService.isNative(props.endpointBaseUrlForOpenAi4) ||
          props.apiService.isOpenAiNativeUrl(props.endpointBaseUrlForOpenAi4));
      const isPdfSupported = true;
      return isVisionSupported || isPdfSupported ? (
        <TooltipHost content={strings.TextUploadFiles}>
          {getSimpleDialog(strings.TextUpload, strings.TextUploadFiles, showUploadDialog, setShowUploadDialog, [
            <UploadFiles
              setImageUrls={isVisionSupported ? setImageUrls : undefined}
              setPdfFileContent={isPdfSupported ? setPdfFileContent : undefined}
              setIsOpen={setShowUploadDialog}
            />,
          ])}
          <span className={[styles.fileUploadIcon, imageUrls?.length > 0 ? styles.selected : undefined].join(' ').trim()}>
            <FontIcon iconName="SkypeCircleArrow" onClick={() => setShowUploadDialog(true)} />
            <span className={[styles.fileCounter, props.promptAtBottom ? styles.promptAtBottom : undefined].join(' ').trim()}>
              {imageUrls?.length ? `(${imageUrls?.length})` : pdfFileContent ? `(${Object.keys(pdfFileContent).length})` : ''}
            </span>
          </span>
        </TooltipHost>
      ) : null;
    };

    const getLanguageModels = (): JSX.Element => {
      return (
        <div className={[styles.topbarcontent, props.promptAtBottom ? styles.promptAtBottom : undefined].join(' ').trim()}>
          {props.languageModels?.length > 1 &&
            props.languageModels.sort().map((languageModel, index) => {
              languageModel = languageModel.trim();
              const isGpt3 = /gpt-3/i.test(languageModel);
              const isGpt4 = /gpt-4/i.test(languageModel);
              const selectedClassName = model === languageModel || (!model && index === 0) ? styles.selectedModel : undefined;
              return (
                <TooltipHost content={`LLM: ${languageModel}`}>
                  <DefaultButton
                    className={[
                      styles.modelSelector,
                      styles.greenicon,
                      selectedClassName,
                      isCustomPanelOpen && !props.promptAtBottom ? styles.insidePanel : undefined,
                      props.isDarkTheme ? styles.darkTheme : undefined,
                    ]
                      .join(' ')
                      .trim()}
                    onClick={() => {
                      setModel(languageModel);
                    }}
                  >
                    {isGpt3 ? Icons.getLighteningIcon() : isGpt4 ? Icons.getStarIcon() : Icons.getLighteningIcon()}
                    {isGpt3 ? strings.TextGpt35 : isGpt4 ? strings.TextGpt4 : languageModel}
                  </DefaultButton>
                </TooltipHost>
              );
            })}
          {getFileUpload()}
        </div>
      );
    };

    const getPanelContentPane = (): JSX.Element => {
      const noUpperLanguageSelector = !props.promptAtBottom && !(props.languageModels?.length > 1);
      return (
        <div
          ref={refContentPane}
          className={[
            styles.panelContentPane,
            !chatHistory?.length ? styles.clearborder : undefined,
            noUpperLanguageSelector ? styles.noUpperLanguageSelector : undefined,
            isCustomPanelOpen ? styles.insidePanel : undefined,
          ]
            .join(' ')
            .trim()}
        >
          <div className={styles.responseRowsContainer}>
            {rows}
            {isProgress && <CustomShimmer />}
          </div>
        </div>
      );
    };

    const getPromptContainer = (): JSX.Element => {
      const charactersLeft =
        chatHistoryParams.maxTextLength > requestCharsCount
          ? chatHistoryParams.maxTextLength - requestCharsCount
          : props.unlimitedHistoryLength
          ? chatHistoryParams.defaultTextLength > requestCharsCount
            ? chatHistoryParams.defaultTextLength - requestCharsCount
            : 0
          : 0;

      return (
        <>
          <div className={[styles.promptContainer, props.promptAtBottom ? styles.promptAtBottom : undefined].join(' ').trim()}>
            <textarea
              ref={refPromptArea}
              placeholder={strings.TextSendMessage}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitPayload();
                } else {
                  resizePrompt(e);
                }
              }}
              onBlur={resizePrompt}
              onInput={resizePrompt}
              maxLength={!props.unlimitedHistoryLength ? chatHistoryParams.maxTextLength : chatHistoryParams.defaultTextLength}
              disabled={
                isProgress || isStreamProgress || (chatHistoryParams.maxContentLengthExceeded && !props.unlimitedHistoryLength)
              }
            />
            {(!chatHistoryParams.maxContentLengthExceeded || props.unlimitedHistoryLength) && submitButton}
          </div>
          <div className={styles.requestCharsCount}>
            {!chatHistoryParams.maxContentLengthExceeded || props.unlimitedHistoryLength
              ? `${requestCharsCount} ${
                  requestCharsCount === 1 ? strings.TextCharacters.replace(/s$/i, '') : strings.TextCharacters
                }, ${charactersLeft} ${strings.TextMoreCharactersAllowed}`
              : strings.TextMaxContentLengthExceeded}
            {props.promptAtBottom && getLanguageModels()}
          </div>
        </>
      );
    };

    const getContentArea = (): JSX.Element => {
      const errorDetails = SessionStorageService.getData(SessionStorageService.keys.errorDetails);
      //if (errorDetails) setTimeout(() => SessionStorageService.clearErrorDetails(), 1);
      const messageBar =
        responseContentError &&
        (errorDetails ? (
          <TooltipHost content={errorDetails}>
            <MessageBar className={styles.errorMessage} type={MessageType.error} message={responseContentError} />
          </TooltipHost>
        ) : (
          <MessageBar className={styles.errorMessage} type={MessageType.error} message={responseContentError} />
        ));
      return props.promptAtBottom ? (
        <>
          {getPanelContentPane()}
          <div className={styles.inputAreaWrap}>{getPromptContainer()}</div>
          {messageBar}
        </>
      ) : (
        <>
          {getPromptContainer()}
          {messageBar}
          {getPanelContentPane()}
        </>
      );
    };

    return (
      chatHistory && (
        <div className={[styles.panelContainer, !props.isFullWidthColumn ? styles.notFullWidth : undefined].join(' ').trim()}>
          <NavigationPanel
            chatHistory={chatHistory}
            chatHistoryId={chatHistoryId}
            chatName={chatName}
            clearChatMessages={clearChatMessages}
            isCustomPanelOpen={isCustomPanelOpen}
            firstLoad={firstLoad}
            loadChats={loadChats}
            myChats={myChats}
            props={props}
            refNavigation={refNavigation}
            reloadChatHistory={reloadChatHistory}
            reloadNavigation={reloadNavigation}
            scrollContentToBottom={scrollContentToBottom}
            selectedCodeStyle={selectedCodeStyle}
            selectedSharedChat={selectedSharedChat}
            setChatHistory={setChatHistory}
            setChatName={setChatName}
            setDisabledHighlights={setDisabledHighlights}
            setFirstLoad={setFirstLoad}
            setIsCustomPanelOpen={setIsCustomPanelOpen}
            setMyChats={setMyChats}
            setReloadNavigation={setReloadNavigation}
            setSelectedCodeStyle={setSelectedCodeStyle}
            setSelectedSharedChat={setSelectedSharedChat}
            setSharedChats={setSharedChats}
            sharedChats={sharedChats}
            storageService={storageService}
            wpId={wpId}
          />
          <div
            className={[
              styles.panelContentCanvas,
              props.isFullWidthColumn && !isCustomPanelOpen ? styles.widecontent : undefined,
              props.promptAtBottom ? styles.clearheight : undefined,
            ]
              .join(' ')
              .trim()}
          >
            <div className={styles.topbar}>
              {!firstLoad && getChatName()}
              {!props.promptAtBottom && getLanguageModels()}
              {canOpenCustomPanel(props) && (
                <span
                  className={[
                    styles.expandToPanel,
                    props.promptAtBottom ? styles.promptAtBottom : undefined,
                    isCustomPanelOpen ? styles.invisible : undefined,
                  ]
                    .join(' ')
                    .trim()}
                >
                  <TooltipHost content={!isCustomPanelOpen ? strings.TextFullScreen : undefined}>
                    <FontIcon iconName="MiniExpand" onClick={() => setIsCustomPanelOpen(true)} />
                  </TooltipHost>
                </span>
              )}
            </div>
            {getContentArea()}
          </div>
        </div>
      )
    );
  }

  function resizePrompt(e: any) {
    const minHeight = 34; // px
    const maxHeight = 100; // px
    const padding = 15; // px

    if (!e.target.value) {
      e.target.style.height = `${minHeight}px`;
      setIsSubmitDisabled(true);
      setRequestCharsCount(0);
      return;
    }

    setIsSubmitDisabled(false);
    setRequestCharsCount(e.target.value.length);
    e.target.style.height = 'inherit';
    e.target.style.height = `${e.target.scrollHeight - padding}px`;

    // In case you have a limitation
    const limit = Math.min(e.target.scrollHeight - padding, maxHeight);
    if (limit === maxHeight) {
      e.target.style.height = `${maxHeight}px`;
      e.target.style.overflowY = 'auto';
    } else {
      e.target.style.overflowY = 'hidden';
    }
  }

  function getPdfContent(requestText: string): string {
    if (!pdfFileContent) return '';

    let returnValue = '';
    Object.keys(pdfFileContent).forEach((fileName) => {
      let content = pdfFileContent[fileName];
      if (!content) return;
      const docName = `\n<!--${fileName}-->\n`;
      if (
        chatHistoryParams.maxContentLength <
        requestText.length + returnValue.length + docName.length + content.length + '<!---->'.length
      ) {
        const maxLength =
          chatHistoryParams.maxContentLength - (requestText.length + returnValue.length + docName.length + '<!---->'.length);
        if (maxLength > 0) {
          content = content.substring(0, maxLength);
        } else {
          return;
        }
      }
      returnValue += `${docName}<!--${content}-->`;
    });

    return returnValue;
  }

  function submitPayload() {
    setIsProgress(true);

    const textArea = !isCustomPanelOpen ? refPrompt.current : refPromptInCustomPanel.current;
    let requestText: string = ChatHelper.sanitizeHtml(textArea.value);
    if (pdfFileContent) requestText += getPdfContent(requestText);
    const payload = ChatHelper.getItemPayload(props.config, requestText, model, props.functions);

    payload.chatHistory = JSON.parse(JSON.stringify(chatHistory)); // Removes possible references and allows adjusting the history.
    ChatHelper.truncateImages(payload.chatHistory); // Truncates unnecessary images from the history to reduce request costs.

    if (chatHistoryParams.maxContentLengthExceeded && props.unlimitedHistoryLength) {
      do {
        if (payload.chatHistory.length > 1) payload.chatHistory = payload.chatHistory.slice(1);
      } while (
        payload.chatHistory.length > 1 &&
        JSON.stringify(payload.chatHistory).length + requestText.length > chatHistoryParams.maxContentLength
      );
    }
    /*
    console.log(JSON.stringify(payload.chatHistory).length);
    console.log(requestText.length);
    console.log(JSON.stringify(payload.chatHistory).length + requestText.length);
    console.log(chatHistoryParams.maxContentLength);
    */

    let newChatHistory = [...chatHistory];
    const userRole = { role: 'user', content: payload.queryText };
    newChatHistory.push(userRole);
    setChatHistory(newChatHistory);
    textArea.value = '';
    resizePrompt({ target: textArea });
    scrollContentToBottom();

    if (imageUrls?.length) {
      payload.images = [...imageUrls];
      payload.images.forEach((url) => {
        userRole.content += `\n\n<img src='${url}'/>`;
      });
      clearImages();
    } else if (pdfFileContent) {
      clearImages();
    }

    const handleResponse = (response) => {
      setIsProgress(false);
      if (response) {
        // The next line is important. It enforces the correct state change by changing array's memory address to new one.
        newChatHistory = [...newChatHistory];
        newChatHistory.push({
          role: 'assistant',
          content: ChatHelper.cleanupResponseContent(response),
        });
        setChatHistory(newChatHistory); // Sets the updated array with new memory address.
        scrollContentToBottom();
        setResponseContentError(undefined);
        saveChatHistory(newChatHistory);
      } else {
        setResponseContentError(strings.TextUndeterminedError);
        LogService.error('submitPayload', 'Empty response from Open AI');
        LogService.error('submitPayload', response);
      }
    };

    const handleResponseStream = (response, firstResponse: boolean) => {
      if (response) {
        // The next line is important. It enforces the correct state change by changing array's memory address to new one.
        newChatHistory = [...newChatHistory];
        if (firstResponse) {
          newChatHistory.push({
            role: 'assistant',
            content: ChatHelper.cleanupResponseContent(response),
          });
          //const chatMessageId = `${styles.message}_${newChatHistory.length - 1}`;
          const chatMessageId = `${styles.message}_${wpId}_${newChatHistory.length - 1}`;
          setDisabledHighlights([...disabledHighlights, chatMessageId]);
          setResponseContentError(undefined);
        } else {
          const assistantResponses = newChatHistory.filter((r) => r.role === 'assistant');
          assistantResponses[assistantResponses.length - 1].content += ChatHelper.cleanupResponseContent(response);
        }
        setChatHistory(newChatHistory); // Sets the updated array with new memory address.
        scrollContentToBottom();
      }
    };

    if (props.apiService.isConfigured()) {
      if (!props.streaming) {
        props.apiService.callQueryText(payload).then((response) => handleResponse(response));
      } else {
        let firstResponse = true;
        props.apiService.callQueryText(payload, true, (message: string, done?: boolean, isError?: boolean) => {
          setIsProgress(false);
          setIsStreamProgress(true);
          if (isError) {
            setResponseContentError(strings.TextUndeterminedError);
            setIsStreamProgress(false);
            setFormattedContent([]);
          } else if (!done) {
            if (message) {
              handleResponseStream(message, firstResponse);
              firstResponse = false;
              setResponseContentError(undefined);
            }
          } else {
            setIsStreamProgress(false);
            setFormattedContent([]);
            if (!firstResponse) {
              setResponseContentError(undefined);
              //const chatMessageId = `${styles.message}_${newChatHistory.length - 1}`;
              const chatMessageId = `${styles.message}_${wpId}_${newChatHistory.length - 1}`;
              setDisabledHighlights([...disabledHighlights.filter((id) => id !== chatMessageId)]);
              saveChatHistory(newChatHistory);
            } else {
              // Authentication error?
              setResponseContentError(strings.TextUndeterminedError);
            }
          }
        });
      }
    } else {
      setIsProgress(false);
      setResponseContentError(strings.TextUndeterminedError);
      LogService.error('submitPayload', 'OpenAI not configured: check values for appId, endpointBaseUrlForOpenAi');
    }
  }

  function saveChatHistory(newChatHistory: IChatHistory[], modified?: string) {
    if (!chatHistoryId) {
      // New chat
      const requestText = newChatHistory[0].content;
      const newChatName: string = HtmlHelper.stripHtml(requestText.length > 255 ? requestText.substring(0, 255) : requestText);
      storageService.createChat(newChatName, newChatHistory, (newChatHistoryId) => {
        setChatHistoryId(newChatHistoryId);
        setChatName(newChatName);
        storageService.loadChatHistory(setMyChats);
      });
    } else {
      storageService.updateChatHistory(
        chatHistoryId,
        newChatHistory,
        () => {
          const newMyChats = [...myChats];
          const chat = newMyChats.find((r) => r.id === chatHistoryId);
          if (chat && chat.message) {
            // Partial UI update without requerying DB
            chat.message = JSON.stringify(newChatHistory);
            chat.modified = modified ?? ChatHelper.toLocalISOString(); //new Date().toISOString();
            setMyChats(newMyChats);
            //setReloadNavigation(true);
            ChatHelper.scrollToTop(
              !isCustomPanelOpen ? refConversationContainer?.current : refConversationContainerInCustomPanel?.current
            );
          } else {
            storageService.loadChatHistory(setMyChats);
          }
        },
        modified
      );
    }
  }

  function getChatHistoryContent(rows: IChatHistory[]): JSX.Element[] {
    // Performance improvement to eliminate delays related to rendering of large chats with many code bocks.
    const formattedRows = props.highlight
      ? rows.map((r, index) => {
          return getHighlightedContent(r.content, index);
        })
      : undefined;
    if (!formattedContent?.length || formattedContent.length < formattedRows.length) {
      setFormattedContent(formattedRows);
    }

    return rows.map((r, index) => {
      const isAi = r.role !== 'user';
      const content = r.content;
      const rawResults =
        index + 1 === rows.length && props.functions && SessionStorageService.getData(SessionStorageService.keys.rawResults);

      //const chatMessageId = `${styles.message}_${index}`;
      const chatMessageId = `${styles.message}_${wpId}_${index}`;
      const chatMessageIdSelector = isCustomPanelOpen
        ? `.${styles.customPanel} div[id='${chatMessageId}']`
        : `div[id='${chatMessageId}']`;

      return (
        <div className={styles.responseRowPlaceholder}>
          <div key={index} className={styles.responseRow}>
            <div className={isAi ? styles.logo : styles.userLogo}>
              {isAi ? Icons.getOpenAILogo(strings.TextChat) : <FontIcon iconName={'UserFollowed'} className={styles.userIcon} />}
            </div>
            {isAi ? (
              props.highlight ? (
                <div className={[styles.message, isCustomPanelOpen ? styles.insidePanel : undefined].join(' ').trim()}>
                  {!disabledHighlights?.find((id) => id === chatMessageId) ? formattedRows[index] : content}
                </div>
              ) : (
                <div className={styles.message} dangerouslySetInnerHTML={{ __html: r.content }} />
              )
            ) : (
              <div
                id={chatMessageId}
                className={[
                  styles.message,
                  editingChatMessageId === chatMessageId ? styles.outline : undefined,
                  isCustomPanelOpen ? styles.insidePanel : undefined,
                ]
                  .join(' ')
                  .trim()}
                contentEditable={editingChatMessageId === chatMessageId ? true : false}
                dangerouslySetInnerHTML={{ __html: r.content }}
                onKeyDown={(e) => {
                  if (chatMessageId === editingChatMessageId && e.key === 'Enter') {
                    e.preventDefault();
                    const newContent = (e.target as any)?.innerHTML;
                    if (content !== newContent) {
                      saveEditedChatMessage(index, newContent);
                    }
                  }
                }}
              />
            )}
          </div>
          <div className={styles.actionIcons}>
            {!isAi ? (
              <>
                {editingChatMessageId !== chatMessageId && (
                  <TooltipHost content={strings.TextEdit}>
                    <FontIcon
                      iconName="Edit"
                      className={styles.editIcon}
                      onClick={(e) => {
                        e.stopPropagation(); // Check the line if (id !== editingChatMessageId) setEditingChatMessageId(undefined); above
                        const messageDiv = document.querySelector(chatMessageIdSelector) as HTMLDivElement;
                        editChatMessage(chatMessageId);
                        setTimeout(() => messageDiv.focus(), 500);
                      }}
                    />
                  </TooltipHost>
                )}
                {editingChatMessageId === chatMessageId && (
                  <TooltipHost content={strings.TextSave}>
                    <FontIcon
                      iconName="CheckMark"
                      className={styles.editIcon}
                      onClick={(e) =>
                        saveEditedChatMessage(index, (document.querySelector(chatMessageIdSelector) as any).innerHTML)
                      }
                    />
                  </TooltipHost>
                )}
                {editingChatMessageId === chatMessageId && (
                  <TooltipHost content={strings.TextCancel}>
                    <FontIcon iconName="Cancel" className={styles.deleteIcon} onClick={(e) => editChatMessage(undefined)} />
                  </TooltipHost>
                )}
              </>
            ) : (
              <>
                {rawResults && (
                  <TooltipHost content={strings.TextAllResults}>
                    <FontIcon
                      iconName="Installation"
                      className={styles.formatIcon}
                      onClick={() => {
                        ChatHelper.downloadCsvFile(rawResults, `${SessionStorageService.keys.rawResults}.csv`);
                      }}
                    />
                  </TooltipHost>
                )}
                {props.highlight && hasMarkdown(content) && (
                  <TooltipHost content={strings.TextFormat}>
                    <FontIcon
                      iconName="RawSource"
                      className={styles.formatIcon}
                      onClick={() => {
                        if (disabledHighlights?.find((id) => id === chatMessageId)) {
                          setDisabledHighlights([...disabledHighlights.filter((id) => id !== chatMessageId)]);
                        } else {
                          setDisabledHighlights([...disabledHighlights, chatMessageId]);
                        }
                      }}
                    />
                  </TooltipHost>
                )}
              </>
            )}
          </div>
        </div>
      );
    });
  }

  function getHighlightedContent(content: string, index: number): JSX.Element {
    if (formattedContent?.length > index) {
      if (isStreamProgress && formattedContent.length === index + 1) {
        return formatCode(content, selectedCodeStyle);
      } else {
        return formattedContent[index];
      }
    } else {
      return formatCode(content, selectedCodeStyle);
    }
  }
};

export default ContentPanel;
