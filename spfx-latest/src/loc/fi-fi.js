define([], function () {
  return {
    BasicGroupName: 'Asetukset',
    FieldLabelApiKey: 'Valinnainen api-avain Azure OpenAI:lle (vianmääritystä varten, ei tuotantoa varten)',
    FieldLabelApiKeyPlaceholder: 'Lisää, jos APIM-päätepistettä ei käytetä',
    FieldLabelAppId: 'Client ID: luo user_impersonation-sovellus nimellä=openaiwp',
    FieldLabelEndpointBaseUrlForChatHistory: 'Chat WebApin perus-URL-osoite (APIM API tai täysi)',
    FieldLabelEndpointBaseUrlForOpenAi: 'GPT-päätepisteen perus-URL-osoite (APIM API tai täysi)',
    FieldLabelEndpointBaseUrlForOpenAi4: 'GPT4-päätepisteen perus-URL-osoite (APIM API tai täysi)',
    FieldLabelBing: 'Bing-haku',
    FieldLabelBingApiKey: 'Valinnainen api-avain Bingille',
    FieldLabelBingApiKeyPlaceholder: 'Lisää, jos APIM-päätepistettä ei ole määritetty',
    FieldLabelEncryption: 'Ota tallennustilan salaus käyttöön',
    FieldLabelExamples: 'Ota esimerkit käyttöön kehotetekstissä',
    FieldLabelGoogle: 'Google-haku',
    FieldLabelGoogleApiKey: 'Valinnainen avain Googlelle: key=API_AVAIN&cx=HAKUKONEEN_ID',
    FieldLabelImages: 'Kuvan luominen (Dalle)',
    FieldLabelImagesApim: 'Kuvan luominen: konfiguroi /dalle (docs)',
    FieldLabelLanguageModels: 'Kielimallit',
    FieldLabelLocale: 'Päivämäärien kielikieli (oletus on fi-FI)',
    FieldLabelSharing: 'Ota jakaminen käyttöön',
    FieldLabelStreaming: 'Ota suoratoisto käyttöön',
    FieldLabelFullScreen: 'Ota käyttöön koko näytön tila',
    FieldLabelFunctions: 'Ota integraatiot käyttöön',
    FieldLabelHighlight: 'Koodikorostus',
    FieldLabelHighlightStyles: 'Näytä korostustyylit',
    FieldLabelDefaultStyle: 'Oletustyyli',
    FieldLabelSharePointImageLibraryUrl: 'Kuvakirjaston URL-osoite (jätä se tyhjäksi oletus-URL-osoitteelle)',
    FieldLabelSharePointListUrl: 'SharePoint-luettelon URL-osoite (jätä se tyhjäksi oletus-URL-osoitteelle)',
    FieldLabelStorageType: 'Tallennustyyppi chattihistorialle',
    FieldLabelStorageTypeDatabase: 'Tietokanta',
    FieldLabelStorageTypeLocalStorage: 'Paikallinen varasto',
    FieldLabelStorageTypeSharePoint: 'SharePoint-luettelo',
    FieldLabelDemoOnly: '(vain demo)',
    FieldLabelPromptAtBottom: 'Näytä kehotealue alareunassa',
    FieldLabelUnlimitedHistoryLength: 'Rajoittamaton chatin historian pituus (AI-vastaukset pitkissä keskusteluissa voivat olla vähemmän tarkkoja)',
    FieldLabelVision: 'Kuvaanalyysi (Vision)',
    FieldLabelVisionApim: 'Kuvaanalyysi: konfiguroi /vision (docs)',
    FieldLabelVoiceInput: 'Ota äänisyöttö käyttöön',
    FieldLabelVoiceOutput: 'Ota äänilähtö käyttöön (teksti puheeksi)',

    PlaceholderDescription: 'Määritä tämä verkko-osa.',
    PlaceholderText: 'Määritä verkko-osa',

    TextAllResults: 'Kaikki tulokset',
    TextAuthenticationError: 'Todennusvirhe (katso lisätietoja konsolin viesteistä)',
    TextCancel: 'Peruuta',
    TextCharacters: 'merkit',
    TextChat: 'ChatGPT',
    TextClose: 'Sulje',
    TextCodeStyle: 'Koodityyli',
    TextCollapse: 'Tiivistä',
    TextCommands: 'tulos',
    TextConfigure: 'Määritä',
    TextCopy: 'Kopioi',
    TextCreate: 'Luota',
    TextCreated: 'Luotu',
    TextDelete: 'Poista',
    TextDeleteMessage: 'Haluatko poistaa',
    TextDescribeImage: 'Mitä tässä kuvassa on?',
    TextDescribeImages: 'Mitä näissä kuvissa on?',
    TextDeviceUnavailable: 'Laite ei ole käytettävissä',
    TextEdit: 'Muokkaa',
    TextError: 'Tapahtui virhe',
    TextExamples: 'Esimerkit',
    TextExists: 'On olemassa',
    TextExpand: 'Laajenna',
    TextFormat: 'Raaka',
    TextFullScreen: 'Koko näyttöön',
    TextGpt35: 'GPT-3.5',
    TextGpt4: 'GPT-4',
    TextGpt4o: 'GPT-4o',
    TextGpt4oMini: 'GPT-4o Mini',
    TextGpt41: 'GPT-4.1',
    TextGpt41Mini: 'GPT-4.1 Mini',
    TextGpt41Nano: 'GPT-4.1 Nano',
    TextGpt4Turbo: 'GPT-4 Turbo',
    TextO1Mini: 'O1 Mini',
    TextO1Preview: 'O1 Preview',
    TextO1: 'O1',
    TextO3Mini: 'O3 Mini',
    TextO4Mini: 'O4 Mini',
    TextHideMySharedChats: 'Piilota chattini',
    TextInvalidListUrl: 'Virheellinen luettelon URL-osoite. Luettelo samalla nimella on jo olemassa sivustolla',
    TextLanguage: 'Kieli',
    TextListCreated: 'Luettelo on luotu',
    TextListDoesNotExist: 'Mukautettua luetteloa ei ole olemassa',
    TextListExists: 'Luettelo on jo olemassa',
    TextListUpdated: 'Luettelo on päivitetty',
    TextMaxContentLengthExceeded: 'Valitun kielimallin sallima chatin historian enimmäispituus ylitetty. Lisää uusi chatti tai valitse toinen kielimalli.',
    TextModified: 'Viimeksi muokattu',
    TextMoreCharactersAllowed: 'merkkiä lisää sallittu',
    TextNewChat: 'Lisää chatti',
    TextPeoplePicker: 'Tilin valitsin',
    TextPeoplePickerLoading: 'Ladataan',
    TextPeoplePickerNoResults: 'Tuloksia ei löytynyt',
    TextPeoplePickerSuggestedContacts: 'Ehdotetut yhteystiedot',
    TextPeoplePickerSuggestedPeople: 'Ehdotetut ihmiset',
    TextPeoplePickerSuggestionsAvailable: 'Ihmisten valinnan ehdotuksia saatavilla',
    TextPreview: 'Esikatselu, ei tuotantoon',
    TextRecentChats: 'Omat chatit',
    TextRefresh: 'Päivitä',
    TextRemove: 'Poista',
    TextSave: 'Tallenna',
    TextSendMessage: 'Lähetä viesti',
    TextShare: 'Jaa',
    TextShared: 'Jaettu',
    TextShareMessage: 'Haluatko jakaa',
    TextSharedChats: 'Jaetut chatit',
    TextShareWith: 'Tietyt ihmiset, joiden kanssa jakaa (jos haluat rajoittaa pääsyä tähän keskusteluun, enintään 15 henkilöä)',
    TextStop: 'Lopeta',
    TextStreamingUnsupported: 'suoratoisto-ominaisuutta ei tueta tässä mallissa',
    TextSubmit: 'Lähetä',
    TextSummarizePdf: 'Tee yhteenveto PDF-sisällöstä',
    TextUndeterminedError: 'Odottamaton virhe',
    TextUnshare: 'Peruuta jakaminen',
    TextUnshareMessage: 'Haluatko peruuttaa jakamisen',
    TextUpdate: 'Päivitä',
    TextUpdated: 'Päivitetty',
    TextUpload: 'Lataa',
    TextUploadFiles: 'Lataa tiedostoja',
    TextUploadImage: 'Lataa kuvia',
    TextUploadPdf: 'Lataa PDF',
    TextVoiceInput: 'Äänisyöttö',
    TextVoiceOutput: 'Lue ulos',
  };
});
