define([], function () {
  return {
    BasicGroupName: 'Настройки',
    FieldLabelApiKey: 'Опциональный API-ключ для Azure OpenAI (для устранения неполадок или прямого доступа)',
    FieldLabelApiKeyPlaceholder: 'Если используете прямые URL-адреса',
    FieldLabelAppId: 'Идентификатор клиента: создайте приложение user_impersonation с именем = openaiwp',
    FieldLabelEndpointBaseUrlForChatHistory: 'Базовый URL-адрес для Chat WebApi (APIM API или полный URL)',
    FieldLabelEndpointBaseUrlForOpenAi: 'Базовый URL-адрес GPT сервиса (APIM API или полный URL)',
    FieldLabelEndpointBaseUrlForOpenAi4: 'Базовый URL-адрес GPT4 сервиса (APIM API или полный URL)',
    FieldLabelBing: 'Поиск Bing',
    FieldLabelBingApiKey: 'Опциональный API-ключ для Bing',
    FieldLabelBingApiKeyPlaceholder: 'Если URL-адрес в APIM не настроен',
    FieldLabelExamples: 'Включить примеры для текста подсказки',
    FieldLabelGoogle: 'Поиск Google',
    FieldLabelGoogleApiKey: 'Опциональный ключ для Google: key=API_KEY&cx=SEARCH_ENGINE_ID',
    FieldLabelImages: 'Генерация изображения (Dalle)',
    FieldLabelImagesApim: 'Создание изображения: настройте URL-адрес /dalle (docs)',
    FieldLabelLanguageModels: 'Языковые модели',
    FieldLabelLocale: 'Локализация дат (по умолчанию fi-FI)',
    FieldLabelSharing: 'Включить общий доступ',
    FieldLabelStreaming: 'Включить потоковый вывод ответов',
    FieldLabelFullScreen: 'Включить полноэкранный режим',
    FieldLabelFunctions: 'Включить интеграцию',
    FieldLabelHighlight: 'Форматирование кода',
    FieldLabelHighlightStyles: 'Показать стили форматирования',
    FieldLabelDefaultStyle: 'Стиль форматирования по умолчанию',
    FieldLabelSharePointImageLibraryUrl: 'URL-адрес библиотеки изображений (оставьте пустым для URL-адреса по умолчанию)',
    FieldLabelSharePointListUrl: 'URL-адрес списка SharePoint (оставьте пустым для URL-адреса по умолчанию)',
    FieldLabelStorageType: 'Тип хранилища для истории чата',
    FieldLabelStorageTypeDatabase: 'База данных',
    FieldLabelStorageTypeLocalStorage: 'Локальное хранилище',
    FieldLabelStorageTypeSharePoint: 'Список SharePoint',
    FieldLabelDemoOnly: '(только демо)',
    FieldLabelPromptAtBottom: 'Показывать область ввода текста снизу',
    FieldLabelUnlimitedHistoryLength: 'Неограниченная длина истории чата (ответы ИИ в длинных чатах могут быть менее точными)',
    FieldLabelVision: 'Анализ изображения (Vision)',
    FieldLabelVisionApim: 'Анализ изображения: настройте URL-адрес /vision (docs)',
    FieldLabelVoiceInput: 'Включить голосовой ввод',
    FieldLabelVoiceOutput: 'Включить голосовой вывод (текст в речь)',

    PlaceholderDescription: 'Пожалуйста, настройте эту веб-часть.',
    PlaceholderText: 'Настройте Вашу веб-часть',

    TextAllResults: 'Все результаты',
    TextAuthenticationError: 'Ошибка аутентификации (подробную информацию см. в сообщениях консоли)',
    TextCancel: 'Отмена',
    TextCharacters: 'символы',
    TextChat: 'ChatGPT',
    TextClose: 'Закрыть',
    TextCodeStyle: 'Стиль кода',
    TextCollapse: 'Свернуть',
    TextCommands: 'команды',
    TextConfigure: 'Настроить',
    TextCopy: 'Копировать',
    TextCreate: 'Создать',
    TextCreated: 'Создано',
    TextDelete: 'Удалить',
    TextDeleteMessage: 'Вы хотите удалить',
    TextDescribeImage: 'Что находится на этом изображении?',
    TextDescribeImages: 'Что находится на этих изображениях?',
    TextEdit: 'Редактировать',
    TextError: 'Произошла ошибка',
    TextExamples: 'Примеры',
    TextExists: 'Существует',
    TextExpand: 'Развернуть',
    TextFormat: 'Необработанный',
    TextFullScreen: 'На полный экран',
    TextGpt35: 'GPT-3.5',
    TextGpt4: 'GPT-4',
    TextGpt4Turbo: 'GPT-4 Турбо',
    TextHideMySharedChats: 'Скрыть мои чаты',
    TextInvalidListUrl: 'Неверный URL-адрес списка. Список с таким названием уже существует на сайте',
    TextLanguage: 'Язык',
    TextListCreated: 'Список создан',
    TextListDoesNotExist: 'Список не существует',
    TextListExists: 'Список уже существует',
    TextListUpdated: 'Список обновлен',
    TextMaxContentLengthExceeded: 'Превышена максимальная длина истории чата, разрешенная выбранной языковой моделью. Начните новый чат или выберите другую языковую модель.',
    TextModified: 'Последнее изменение',
    TextMoreCharactersAllowed: 'можно добавить',
    TextNewChat: 'Новый чат',
    TextPeoplePicker: 'Выбор пользователей',
    TextPeoplePickerLoading: 'Загрузка',
    TextPeoplePickerNoResults: 'Результаты не найдены',
    TextPeoplePickerSuggestedContacts: 'Предлагаемые контакты',
    TextPeoplePickerSuggestedPeople: 'Предлагаемые пользователи',
    TextPeoplePickerSuggestionsAvailable: 'Доступны следующие пользователи',
    TextPreview: 'бета-версия, только для тестов',
    TextRecentChats: 'Мои чаты',
    TextRefresh: 'Обновить',
    TextRemove: 'Удалить',
    TextSave: 'Сохранить',
    TextSendMessage: 'Отправить сообщение',
    TextShare: 'Поделиться',
    TextShared: 'Общий',
    TextShareMessage: 'Хотите поделиться',
    TextSharedChats: 'Общие чаты',
    TextShareWith: 'Пользователи для совместного использования (если вы хотите ограничить доступ к этому чату, максимум 15 человек)',
    TextStop: 'Стоп',
    TextSubmit: 'Отправить',
    TextSummarizePdf: 'Обзор содержимого PDF',
    TextUndeterminedError: 'Неожиданная ошибка',
    TextUnshare: 'Отменить совместное использование',
    TextUnshareMessage: 'Вы хотите отменить совместное использование',
    TextUpdate: 'Обновить',
    TextUpdated: 'Обновлено',
    TextUpload: 'Загрузить',
    TextUploadFiles: 'Загрузить файлы',
    TextUploadImage: 'Загрузить картинки',
    TextUploadPdf: 'Загрузить PDF',
    TextVoiceInput: 'Голосовой ввод',
    TextVoiceOutput: 'Прочитать',
  };
});
