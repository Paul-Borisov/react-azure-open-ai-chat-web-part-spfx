define([], function () {
  return {
    BasicGroupName: 'Settings',
    FieldLabelApiKey: 'Optional api-key for Azure OpenAI (for troubleshooting, not for Production)',
    FieldLabelApiKeyPlaceholder: 'Add if you use direct endpoints to services',
    FieldLabelAppId: 'Client ID: create a user_impersonation app with name=openaiwp',
    FieldLabelEndpointBaseUrlForChatHistory: 'Base URL for Chat WebApi (APIM API or full)',
    FieldLabelEndpointBaseUrlForOpenAi: 'Base URL for GPT endpoint (APIM API or full)',
    FieldLabelEndpointBaseUrlForOpenAi4: 'Base URL for GPT4 endpoint (APIM API or full)',
    FieldLabelBing: 'Bing search',
    FieldLabelBingApiKey: 'Optional api-key for Bing',
    FieldLabelBingApiKeyPlaceholder: 'Add if APIM endpoint is not configured',
    FieldLabelExamples: 'Enable examples for the prompt text',
    FieldLabelGoogle: 'Google search',
    FieldLabelGoogleApiKey: 'Optional key for Google: key=API_KEY&cx=SEARCH_ENGINE_ID',
    FieldLabelImages: 'Image generation (Dalle)',
    FieldLabelImagesApim: 'Image generation: configure /dalle (docs)',
    FieldLabelLanguageModels: 'Language models',
    FieldLabelLocale: 'Locale for dates (default is fi-FI)',
    FieldLabelSharing: 'Enable sharing',
    FieldLabelStreaming: 'Enable streaming',
    FieldLabelFullScreen: 'Enable full screen mode',
    FieldLabelFunctions: 'Enable integrations',
    FieldLabelHighlight: 'Code highlighting',
    FieldLabelHighlightStyles: 'Show highlighting styles',
    FieldLabelDefaultStyle: 'Default style',
    FieldLabelSharePointImageLibraryUrl: 'Image library URL (leave it empty for default URL)',
    FieldLabelSharePointListUrl: 'SharePoint list URL (leave it empty for default URL)',
    FieldLabelStorageType: 'Storage type for chat history',
    FieldLabelStorageTypeDatabase: 'Database',
    FieldLabelStorageTypeLocalStorage: 'Local storage',
    FieldLabelStorageTypeSharePoint: 'SharePoint list',
    FieldLabelDemoOnly: '(demo only)',
    FieldLabelPromptAtBottom: 'Show prompt area at bottom',
    FieldLabelUnlimitedHistoryLength: 'Unlimited chat history length (AI-responses in long chats may be less accurate)',
    FieldLabelVision: 'Image analysis (Vision)',
    FieldLabelVisionApim: 'Image analysis: configure /vision (docs)',
    FieldLabelVoiceInput: 'Enable voice input',
    FieldLabelVoiceOutput: 'Enable voice output (text to speech)',

    PlaceholderDescription: 'Please configure this web part.',
    PlaceholderText: 'Configure your web part',

    TextAllResults: 'All results',
    TextAuthenticationError: 'Authentication error (refer to console messages for details)',
    TextCancel: 'Cancel',
    TextCharacters: 'characters',
    TextChat: 'ChatGPT',
    TextClose: 'Close',
    TextCodeStyle: 'Code style',
    TextCollapse: 'Collapse',
    TextCommands: 'commands',
    TextConfigure: 'Configure',
    TextCopy: 'Copy',
    TextCreate: 'Create',
    TextCreated: 'Created',
    TextDelete: 'Delete',
    TextDeleteMessage: 'Do you want to delete',
    TextDescribeImage: 'What is in this image?',
    TextDescribeImages: 'What is in these images?',
    TextEdit: 'Edit',
    TextError: 'Error occurred',
    TextExamples: 'Examples',
    TextExists: 'Exists',
    TextExpand: 'Expand',
    TextFormat: 'Raw',
    TextFullScreen: 'To full screen',
    TextGpt35: 'GPT-3.5',
    TextGpt4: 'GPT-4',
    TextGpt4Turbo: 'GPT-4 Turbo',
    TextHideMySharedChats: 'Hide my chats',
    TextInvalidListUrl: 'Invalid list URL. List with the same name already exists at the site',
    TextLanguage: 'Language',
    TextListCreated: 'List has been created',
    TextListDoesNotExist: 'List does not exist',
    TextListExists: 'List already exists',
    TextListUpdated: 'List has been updated',
    TextMaxContentLengthExceeded: 'Max chat history length allowed by the selected language model exceeded. Start a New chat or select another language model.',
    TextModified: 'Last modified',
    TextMoreCharactersAllowed: 'more allowed',
    TextNewChat: 'New chat',
    TextPeoplePicker: 'People Picker',
    TextPeoplePickerLoading: 'Loading',
    TextPeoplePickerNoResults: 'No results found',
    TextPeoplePickerSuggestedContacts: 'Suggested contacts',
    TextPeoplePickerSuggestedPeople: 'Suggested people',
    TextPeoplePickerSuggestionsAvailable: 'People Picker Suggestions available',
    TextPreview: 'beta, not for Production',
    TextRecentChats: 'My chats',
    TextRefresh: 'Refresh',
    TextRemove: 'Remove',
    TextSave: 'Save',
    TextSendMessage: 'Send a message',
    TextShare: 'Share',
    TextShared: 'Shared',
    TextShareMessage: 'Do you want to share',
    TextSharedChats: 'Shared chats',
    TextShareWith: 'Specific people to share with (if you want to limit access to this chat, max 15 persons)',
    TextStop: 'Stop',
    TextSubmit: 'Submit',
    TextSummarizePdf: 'Summarise PDF content',
    TextUndeterminedError: 'Unexpected error',
    TextUnshare: 'Unshare',
    TextUnshareMessage: 'Do you want to unshare',
    TextUpdate: 'Update',
    TextUpdated: 'Updated',
    TextUpload: 'Upload',
    TextUploadFiles: 'Upload files',
    TextUploadImage: 'Upload images',
    TextUploadPdf: 'Upload PDF',
    TextVoiceInput: 'Voice input',
    TextVoiceOutput: 'Read out',
  };
});
