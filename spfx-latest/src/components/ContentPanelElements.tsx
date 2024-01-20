import { DefaultButton, FontIcon, TooltipHost, TooltipOverflowMode } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import ChatHelper from 'helpers/ChatHelper';
import { IMessageLength } from 'hooks/useChatHistory';
import * as React from 'react';
import { formatCode } from 'shared/components/CodeHighlighter/CodeHighlighter';
import { getSimpleDialog } from 'shared/components/CustomDialog';
import { CustomShimmer } from 'shared/components/CustomShimmer/CustomShimmer';
import LinkButton from 'shared/components/LinkButton/LinkButton';
import MessageBar, { MessageType } from 'shared/components/MessageBar/MessageBar';
import VoiceInput from 'shared/components/Speech/VoiceInput';
import { IChatHistory } from 'shared/model/IChat';
import SessionStorageService from 'shared/services/SessionStorageService';
import { IChatProps } from './Chat';
import styles from './Chat.module.scss';
import * as Icons from './Icons';
import Prompts from './Prompts';
import UploadFiles from './UploadFiles';

export default class ContentPanelElements {
  private props: IChatProps;

  constructor(props: IChatProps) {
    this.props = props;
  }

  public getChatName(chatName, isCustomPanelOpen: boolean, className: string = undefined): JSX.Element {
    const props = this.props;

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
  }

  public getContentArea(responseContentError: string, panelContentPane: JSX.Element, promptContainer: JSX.Element): JSX.Element {
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
    return this.props.promptAtBottom ? (
      <>
        {panelContentPane}
        <div className={styles.inputAreaWrap}>{promptContainer}</div>
        {messageBar}
      </>
    ) : (
      <>
        {promptContainer}
        {messageBar}
        {panelContentPane}
      </>
    );
  }

  public getFileUpload(
    model: string,
    showUploadDialog: boolean,
    imageUrls: string[],
    pdfFileContent: { [key: string]: string },
    setShowUploadDialog: (state: boolean) => void,
    setImageUrls: (newUrls: string[]) => void,
    setPdfFileContent: (newContent: { [key: string]: string }) => void
  ): JSX.Element {
    const props = this.props;

    const isVisionSupported = props.vision;
    const isPdfSupported = true;
    // Upload button should be visible only if Enable integrations is turned on in web part settings.
    return props.functions && (isVisionSupported || isPdfSupported) ? (
      <>
        {getSimpleDialog(strings.TextUpload, strings.TextUploadFiles, showUploadDialog, setShowUploadDialog, [
          <UploadFiles
            setImageUrls={isVisionSupported ? setImageUrls : undefined}
            setPdfFileContent={isPdfSupported ? setPdfFileContent : undefined}
            setIsOpen={setShowUploadDialog}
          />,
        ])}
        <span className={[styles.fileUploadIcon, imageUrls?.length > 0 ? styles.selected : undefined].join(' ').trim()}>
          <FontIcon iconName="Attach" onClick={() => setShowUploadDialog(true)} title={strings.TextUploadFiles} />
          <span className={[styles.fileCounter, props.promptAtBottom ? styles.promptAtBottom : undefined].join(' ').trim()}>
            {imageUrls?.length ? `(${imageUrls?.length})` : pdfFileContent ? `(${Object.keys(pdfFileContent).length})` : ''}
          </span>
        </span>
      </>
    ) : null;
  }

  public getHighlightedContent(
    content: string,
    index: number,
    isStreamProgress: boolean,
    selectedCodeStyle: string,
    formattedContent: JSX.Element[]
  ): JSX.Element {
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

  private getLanguageModelIcon(star: boolean): JSX.Element {
    return star ? Icons.getStarIcon() : Icons.getLighteningIcon();
  }

  private getLanguageModelText(languageModel: string, isGpt3: boolean, isGpt4: boolean, isGpt4Turbo: boolean): string {
    if (isGpt3) {
      return strings.TextGpt35;
    } else if (isGpt4Turbo) {
      return strings.TextGpt4Turbo;
    } else if (isGpt4) {
      return strings.TextGpt4;
    } else {
      return languageModel;
    }
  }

  public getLanguageModels(
    model: string,
    stopSignal: AbortController,
    signalReload: boolean,
    isCustomPanelOpen: boolean,
    isStreamProgress: boolean,
    setIsStreamProgress: (state: boolean) => void,
    setSignalReload: (state: boolean) => void,
    setModel: (newModel: string) => void
  ): JSX.Element {
    const props = this.props;

    return (
      <div className={[styles.topbarcontent, props.promptAtBottom ? styles.promptAtBottom : undefined].join(' ').trim()}>
        {isStreamProgress ? this.getStopButton(stopSignal, signalReload, setIsStreamProgress, setSignalReload) : null}
        {props.languageModels?.length > 1 &&
          (ChatHelper.hasDirectEndpoints(props.apiService, props, true) ? props.languageModels.sort() : props.languageModels).map(
            (languageModel, index) => {
              languageModel = languageModel.trim();
              const isGpt3 = /gpt-3/i.test(languageModel);
              const isGpt4 = /gpt-4/i.test(languageModel);
              const isGpt4Turbo = /gpt-4-(1106|turbo)/i.test(languageModel);
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
                    {this.getLanguageModelIcon(isGpt4)}
                    {this.getLanguageModelText(languageModel, isGpt3, isGpt4, isGpt4Turbo)}
                  </DefaultButton>
                </TooltipHost>
              );
            }
          )}
      </div>
    );
  }

  public getPanelContentPane(
    refContentPane: React.LegacyRef<HTMLDivElement>,
    chatHistory: IChatHistory[],
    isCustomPanelOpen: boolean,
    rows: JSX.Element[],
    isProgress: boolean
  ): JSX.Element {
    const props = this.props;

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
  }

  public getPromptContainer(
    refPromptArea: React.LegacyRef<HTMLTextAreaElement>,
    isProgress: boolean,
    isStreamProgress: boolean,
    isSubmitDisabled: boolean,
    chatHistoryParams: IMessageLength,
    requestCharsCount: number,
    clearChatMessages: () => void,
    resizePrompt: (e: any) => void,
    setPrompt: (text: string) => void,
    submitPayload: () => void,
    panelLanguageModels: JSX.Element,
    fileUpload: JSX.Element
  ): JSX.Element {
    const props = this.props;

    const submitButton = this.getSubmitButton(isProgress, isSubmitDisabled, submitPayload);

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
          {props.examples ? (
            <Prompts
              settings={props}
              setPrompt={(text: string) => {
                clearChatMessages();
                //setPrompt(text);
                setTimeout(() => setPrompt(text), 0); // This trick provides reset of the same value stored into a state variable
              }}
            />
          ) : null}
          {fileUpload}
          {props.voiceInput ? <VoiceInput setText={setPrompt} shortLeftMargin={!props.functions} /> : null}
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
            className={
              !props.functions && !props.voiceInput
                ? styles.noLeftMargin
                : !(props.functions && props.voiceInput)
                ? styles.shortLeftMargin
                : undefined
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
          {props.promptAtBottom ? panelLanguageModels : null}
        </div>
      </>
    );
  }

  private getStopButton(
    stopSignal: AbortController,
    signalReload: boolean,
    setIsStreamProgress: (state: boolean) => void,
    setSignalReload: (state: boolean) => void
  ): JSX.Element {
    return (
      <TooltipHost content={strings.TextStop}>
        <FontIcon
          iconName="CircleStopSolid"
          className={styles.stopSignal}
          onClick={() => {
            stopSignal.abort();
            setIsStreamProgress(false);
            setSignalReload(!signalReload);
          }}
        />
      </TooltipHost>
    );
  }

  private getSubmitButton(isProgress: boolean, isSubmitDisabled: boolean, submitPayload: () => void): JSX.Element {
    const isDisabled: boolean = isProgress || isSubmitDisabled;
    return (
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
  }
}
