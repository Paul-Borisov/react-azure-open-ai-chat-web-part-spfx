import { Checkbox, Dropdown, FontIcon, IDropdownOption, ResponsiveMode, TooltipHost, appendFunction } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import ChatHelper from 'helpers/ChatHelper';
import { FunctionComponent } from 'react';
import * as React from 'react';
import { getStylesSelector } from 'shared/components/CodeHighlighter/CodeHighlighter';
import { getConfirmationDialog } from 'shared/components/CustomDialog';
import { PeoplePicker } from 'shared/components/PeoplePicker';
import Application from 'shared/constants/Application';
import HtmlHelper from 'shared/helpers/HtmlHelper';
import MarkdownHelper from 'shared/helpers/MarkdownHelper';
import { IChatHistory, IChatMessage, IUser } from 'shared/model/IChat';
import LogService from 'shared/services/LogService';
import PageContextService from 'shared/services/PageContextService';
import SessionStorageService from 'shared/services/SessionStorageService';
import { IChatProps } from './Chat';
import styles from './Chat.module.scss';

interface INavigationPanel {
  chatHistory: IChatHistory[];
  chatHistoryId: string;
  chatName: string;
  isCustomPanelOpen: boolean;
  firstLoad: boolean;
  myChats: IChatMessage[];
  props: IChatProps;
  refNavigation: React.LegacyRef<HTMLDivElement>;
  reloadNavigation: boolean;
  selectedCodeStyle: string;
  selectedSharedChat: IChatMessage;
  sharedChats: IChatMessage[];
  storageService: any;
  wpId: string;
  clearChatMessages: () => void;
  loadChats: (callback: () => void) => void;
  reloadChatHistory: (id: string, name: string, newChatHistory: IChatHistory[], e?: any) => void;
  scrollContentToBottom: () => void;
  setChatHistory: (history: IChatHistory[]) => void;
  setChatName: (name: string) => void;
  setDisabledHighlights: (disabledHighlights: string[]) => void;
  setIsCustomPanelOpen: (value: boolean) => void;
  setFirstLoad: (value: boolean) => void;
  setMyChats: (chats: IChatMessage[]) => void;
  setReloadNavigation: (value: boolean) => void;
  setSelectedCodeStyle: (style: string) => void;
  setSelectedSharedChat: (chat: IChatMessage) => void;
  setSharedChats: (chats: IChatMessage[]) => void;
}

const NavigationPanel: FunctionComponent<INavigationPanel> = ({
  chatHistory,
  chatHistoryId,
  chatName,
  isCustomPanelOpen,
  firstLoad,
  myChats,
  props,
  refNavigation,
  reloadNavigation,
  selectedCodeStyle,
  selectedSharedChat,
  sharedChats,
  storageService,
  wpId,
  clearChatMessages,
  loadChats,
  reloadChatHistory,
  scrollContentToBottom,
  setChatHistory,
  setChatName,
  setDisabledHighlights,
  setIsCustomPanelOpen,
  setFirstLoad,
  setMyChats,
  setReloadNavigation,
  setSelectedCodeStyle,
  setSelectedSharedChat,
  setSharedChats,
}) => {
  const [collapseNavigation, setCollapseNavigation] = React.useState<boolean>();
  const [deleteChatName, setDeleteChatName] = React.useState<string>(undefined);
  const [deleteChatId, setDeleteChatId] = React.useState<string>(undefined);
  const [editingChatId, setEditingChatId] = React.useState<string>(undefined);
  const [hideMySharedChats, setHideMySharedChats] = React.useState<boolean>();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);
  const [showShareDialog, setShowShareDialog] = React.useState<boolean>(false);
  const [showUnshareDialog, setShowUnshareDialog] = React.useState<boolean>(false);
  const [shareWith, setShareWith] = React.useState<IUser[]>();

  React.useEffect(() => {
    const isNarrow = props.webPartWidth < 1024;
    if (isCustomPanelOpen && !canOpenCustomPanel(props)) {
      setIsCustomPanelOpen(false);
    }
    setCollapseNavigation(isNarrow);
  }, [props.webPartWidth]);

  const filteredSharedChats = sharedChats
    ?.filter((chat) =>
      !hideMySharedChats ? true : chat.username !== PageContextService.context.pageContext.aadInfo.userId.toString()
    )
    .sort((a, b) => (a.modified > b.modified ? -1 : a.modified < b.modified ? 1 : 0)); // Order by modified desc;

  return (
    <>
      {getConfirmationDialog(
        `${strings.TextDelete}?`,
        `${strings.TextDeleteMessage} '${deleteChatName}'?`,
        showDeleteDialog,
        setShowDeleteDialog,
        () => deleteChat(deleteChatId),
        strings.TextDelete
      )}
      {props.sharing &&
        getConfirmationDialog(
          `${strings.TextShare}?`,
          `${strings.TextShareMessage} '${chatName}'?`,
          showShareDialog,
          setShowShareDialog,
          () => shareChat(chatHistoryId, true),
          strings.TextShare,
          undefined,
          !props.context.pageContext.user.isExternalGuestUser
            ? [
                <PeoplePicker
                  header={<div className={styles.shareWithHeader}>{strings.TextShareWith}</div>}
                  selectedUserIds={myChats?.find((r) => r.id === chatHistoryId)?.sharedWith?.split(';') || []}
                  onChange={setShareWith}
                />,
              ]
            : undefined,
          !props.context.pageContext.user.isExternalGuestUser ? '50%' : undefined
        )}
      {props.sharing &&
        getConfirmationDialog(
          `${strings.TextUnshare}?`,
          `${strings.TextUnshareMessage} '${chatName}'?`,
          showUnshareDialog,
          setShowUnshareDialog,
          () => shareChat(chatHistoryId, false),
          strings.TextUnshare
        )}

      {props.isOpen && (
        <div
          className={[
            styles.panelNavigationPane,
            collapseNavigation ? styles.collapsed : undefined,
            isCustomPanelOpen ? styles.insidePanel : undefined,
          ]
            .join(' ')
            .trim()}
        >
          <div className={styles.navigationHeader}>
            <div>{strings.TextRecentChats}&nbsp;</div>
            <div className={styles.addnewchat} onClick={clearChatMessages}>
              <FontIcon iconName="AddTo" />
              &nbsp;{strings.TextNewChat}
            </div>
            <div className={styles.headerButtons}>
              <div
                className={styles.refresh}
                //onClick={() => props.apiService.loadChatHistory(setMyChats)} // Replaced with a visual effect
                onClick={() =>
                  loadChats(() => {
                    setReloadNavigation(true);
                    setSelectedSharedChat(undefined);
                    SessionStorageService.clearRawResults();
                  })
                }
              >
                <TooltipHost content={strings.TextRefresh}>
                  <FontIcon iconName="Refresh" />
                </TooltipHost>
              </div>
              <div className={styles.collapseMenu} onClick={() => setCollapseNavigation(true)}>
                {props.webPartWidth > 1024 && (
                  <TooltipHost content={collapseNavigation ? strings.TextExpand : strings.TextCollapse}>
                    <FontIcon iconName="CollapseMenu" />
                  </TooltipHost>
                )}
              </div>
            </div>
          </div>
          <div ref={refNavigation} className={styles.conversationContainer}>
            {getChatNavigation(myChats) ?? []}
          </div>
          <div className={styles.navigationFooter}>
            {sharedChats?.length > 0 && (
              <>
                <div className={styles.footerFirstRow}>
                  <div className={styles.footerTitle}>{strings.TextSharedChats}</div>
                  <Checkbox
                    label={strings.TextHideMySharedChats}
                    className={styles.checkbox}
                    onChange={(e, checked: boolean) => setHideMySharedChats(checked)}
                  />
                </div>
                <Dropdown
                  className={filteredSharedChats?.length === 0 ? styles.invisible : undefined}
                  selectedKey={selectedSharedChat?.id ?? null}
                  options={filteredSharedChats?.map((chat) => {
                    const option: IDropdownOption = {
                      key: chat.id,
                      text: `${ChatHelper.formatDate(chat.modified, props.locale)} ${chat.name}`,
                      data: chat,
                    };
                    return option;
                  })}
                  responsiveMode={ResponsiveMode.unknown}
                  onChange={(e, option: IDropdownOption) => {
                    clearChatMessages();
                    const selected = option.data;
                    setSelectedSharedChat(selected);
                    if (selected?.message) {
                      const message = selected.message;
                      setChatHistory(JSON.parse(message));
                      setDisabledHighlights([]);
                      scrollContentToBottom();
                    } else {
                      setChatHistory([]);
                    }
                  }}
                />
              </>
            )}
            {props.highlightStyles &&
              chatHistory?.find((r) => MarkdownHelper.hasMarkdownBlocks(r.content)) &&
              getStylesSelector(selectedCodeStyle, (newStyle) => setSelectedCodeStyle(newStyle))}
          </div>
        </div>
      )}
      <div
        className={[
          styles.collapseMenu2,
          !collapseNavigation ? styles.invisible : undefined,
          props.isFullWidthColumn && !isCustomPanelOpen ? styles.widecontent2 : undefined,
        ]
          .join(' ')
          .trim()}
        onClick={() => setCollapseNavigation(!collapseNavigation)}
      >
        <TooltipHost content={collapseNavigation ? strings.TextExpand : strings.TextCollapse}>
          <FontIcon iconName="CollapseMenu" />
        </TooltipHost>
      </div>
    </>
  );

  function getChatNavigation(rows: IChatMessage[]): JSX.Element[] {
    if (reloadNavigation) {
      setTimeout(() => setReloadNavigation(false), 100);
      return null;
    }

    if (rows?.length === 0 && firstLoad) {
      setFirstLoad(false);
    }
    if (!rows || rows.length === 0) return null;

    try {
      rows = rows.sort((a, b) => (a.modified > b.modified ? -1 : a.modified < b.modified ? 1 : 0)); // Order by modified desc
    } catch (e) {}

    return rows.map((r, index) => {
      const id: string = r.id;
      const name: string = r.name;
      const created: string = r.created;
      const modified: string = r.modified;
      const message: string = r.message;
      const shared: boolean = r.shared;

      if (index === 0 && firstLoad) {
        try {
          reloadChatHistory(id, name, JSON.parse(r.message));
        } catch (e) {
          LogService.error(e);
          reloadChatHistory(id, name, [], e);
        } finally {
          setFirstLoad(false);
        }
      }

      try {
        const strCreated = ChatHelper.formatDate(created, props.locale);
        const strModified = ChatHelper.formatDate(modified, props.locale);
        //const conversationId = `${btoa(id)}_${styles.conversation}`;
        const conversationId = `${styles.conversation}_${wpId}_${id}`;
        const conversationIdSelector = isCustomPanelOpen
          ? `.${styles.customPanel} div[id='${conversationId}']`
          : `div[id='${conversationId}']`;

        return (
          <div
            //id={btoa(id)}
            key={index}
            className={[styles.conversationRow, id === chatHistoryId ? styles.selected : undefined].join(' ').trim()}
            onClick={() => {
              try {
                if (editingChatId !== undefined && id !== editingChatId) {
                  //if (id !== editingChatId) {
                  setReloadNavigation(true); // This line helps to reset edited long name to its line start
                  setEditingChatId(undefined);
                }
                const storedChatMessages = JSON.parse(message);
                reloadChatHistory(id, name, storedChatMessages);
              } catch (e) {
                LogService.error(e);
                reloadChatHistory(id, name, []);
              } finally {
                setSelectedSharedChat(undefined);
              }
            }}
          >
            <div className={styles.rowTitle}>
              <TooltipHost
                content={
                  <>
                    <div>{name}</div>
                    <div>
                      {`${strings.TextCreated}: ${strCreated.replace(/:$/, '')}, ${strings.TextModified}: ${strModified.replace(
                        /:$/,
                        ''
                      )}`}
                      {r.shared ? `, ${strings.TextShared}` : undefined}
                    </div>
                  </>
                }
              >
                <div className={styles.date}>{strModified}</div>
                <div
                  id={conversationId}
                  className={[
                    styles.conversation,
                    editingChatId === id ? styles.outline : undefined,
                    r.shared && props.sharing ? styles.shared : undefined,
                  ]
                    .join(' ')
                    .trim()}
                  contentEditable={editingChatId === id ? true : false}
                  onKeyDown={(e) => {
                    if (id === editingChatId && e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as any;
                      let newName = target.innerText;
                      if (name !== newName) {
                        newName = HtmlHelper.stripHtml(newName);
                        target.innerHTML = newName;
                        saveEditedChatName(id, newName);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Handling the case if the user copy-pasted HTML.
                    const target = e.target as any;
                    const newHtml = target.innerHTML;
                    const newText = target.innerText;
                    if (newHtml !== newText) {
                      target.innerHTML = HtmlHelper.stripHtml(newText);
                    }
                  }}
                >
                  {name}
                </div>
              </TooltipHost>
            </div>
            {id === chatHistoryId && (
              <div className={styles.conversationActions}>
                {editingChatId !== id && (
                  <TooltipHost content={strings.TextEdit}>
                    <FontIcon
                      iconName="Edit"
                      onClick={(e) => {
                        e.stopPropagation(); // Check the line if (id !== editingChatId) setEditingChatId(undefined); above
                        editChatName(id);
                        setTimeout(() => (document.querySelector(conversationIdSelector) as any)?.focus(), 500);
                      }}
                    />
                  </TooltipHost>
                )}
                {editingChatId === id && (
                  <TooltipHost content={strings.TextSave}>
                    <FontIcon
                      iconName="CheckMark"
                      onClick={(e) => saveEditedChatName(id, (document.querySelector(conversationIdSelector) as any).innerText)}
                    />
                  </TooltipHost>
                )}
                {editingChatId === id && (
                  <TooltipHost content={strings.TextCancel}>
                    <FontIcon
                      iconName="Cancel"
                      onClick={(e) => {
                        setReloadNavigation(true); // This line helps to reset edited long name to its line start
                        setEditingChatId(undefined);
                      }}
                    />
                  </TooltipHost>
                )}
                {editingChatId !== id && (
                  <TooltipHost content={strings.TextDelete}>
                    <FontIcon iconName="Delete" onClick={(e) => confirmDeleteChat(id, name)} />
                  </TooltipHost>
                )}
                {props.sharing && !shared && editingChatId !== id && (
                  <TooltipHost content={strings.TextShare}>
                    <FontIcon iconName="Share" onClick={(e) => confirmShareChat(true)} />
                  </TooltipHost>
                )}
                {props.sharing && shared && editingChatId !== id && (
                  <TooltipHost content={strings.TextUnshare}>
                    <FontIcon iconName="Share" className={styles.unshare} onClick={(e) => confirmShareChat(false)} />
                  </TooltipHost>
                )}
              </div>
            )}
          </div>
        );
      } catch (e) {
        LogService.error('getChatNavigation', e);
        return null;
      }
    });
  }

  function confirmDeleteChat(id: string, name: string) {
    setDeleteChatId(id);
    setDeleteChatName(name);
    setShowDeleteDialog(true);
  }
  function deleteChat(id: string) {
    storageService.deleteChat(id, () => {
      //props.apiService.loadChatHistory(setMyChats);
      const newMyChats = [...myChats].filter((r) => r.id !== id);
      setMyChats([...newMyChats]);
      //setReloadNavigation(true);
      if (id === chatHistoryId) {
        clearChatMessages();
      }
      if (sharedChats?.length > 0) {
        const newSharedChats = [...sharedChats].filter((r) => r.id !== id);
        setSharedChats([...newSharedChats]);
      }
    });
  }

  function confirmShareChat(share: boolean) {
    if (share) {
      setShowShareDialog(true);
    } else {
      setShowUnshareDialog(true);
    }
  }
  function shareChat(id: string, share: boolean) {
    let newSharedWith = shareWith?.map((p) => p.username);
    if (!newSharedWith) {
      // The case when the user opened PeoplePicker and did not select any Persona (or just unshared the chat)
      newSharedWith = myChats.find((r) => r.id === id).sharedWith?.split(';');
    }
    const modified = myChats.find((r) => r.id === id)?.modified;
    storageService.shareChat(id, share, newSharedWith, modified, () => {
      if (shareWith) setShareWith(undefined);
      const newMyChats = [...myChats];
      const chat = newMyChats.find((r) => r.id === id);
      chat.shared = !!share;
      //if (chat.sharedWith !== newSharedWith) {
      chat.sharedWith = newSharedWith?.join(';');
      //}
      setMyChats([...newMyChats]);
      //setReloadNavigation(true);
      storageService.loadChatHistory(setSharedChats, true);
    });
  }

  function editChatName(id: string) {
    setEditingChatId(id);
  }
  function saveEditedChatName(id: string, newName: string) {
    if (!newName?.trim()) return;
    if (props.storageEncryption && newName.length > Application.MaxChatNameLengthEncrypted) {
      newName = newName.substring(0, Application.MaxChatNameLengthEncrypted);
    } else if (newName.length > Application.MaxChatNameLength) {
      newName = newName.substring(0, Application.MaxChatNameLength);
    }
    if (/\n+$/.test(newName)) newName = newName.replace(/\n+$/, '');
    if (chatName === newName) {
      setEditingChatId(undefined);
      setReloadNavigation(true);
      return;
    }
    const modified = myChats.find((r) => r.id === id)?.modified;
    const name: string = props.storageEncryption ? ChatHelper.encrypt(newName) : newName;
    storageService.updateChatName(id, name, modified, () => {
      setEditingChatId(undefined);
      setChatName(newName);
      const newMyChats = [...myChats];
      const chat = newMyChats.find((r) => r.id === id);
      chat.name = newName;
      setMyChats([...newMyChats]);
      if (sharedChats?.length > 0) {
        const newSharedChats = [...sharedChats];
        const shared = newSharedChats.find((r) => r.id === id);
        if (shared) {
          shared.name = newName;
          setSharedChats([...newSharedChats]);
        }
      }
      setReloadNavigation(true); // This line helps to reset edited long name to its line start
      //props.apiService.loadChatHistory(setMyChats).then(() => setReloadNavigation(true));
    });
  }
};

export default NavigationPanel;

export function canOpenCustomPanel(props: IChatProps) {
  // Custom panel does not work correctly in mobile UI if there is more than 1 WP on the page (1 + 1 in panel = 2 max allowed)
  return (
    props.fullScreen && (props.webPartWidth > 1024 || document.querySelectorAll(`.${styles.panelNavigationPane}`).length <= 2)
  );
}
