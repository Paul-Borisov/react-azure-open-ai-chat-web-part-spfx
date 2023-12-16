import { Dropdown, DropdownMenuItemType, FontIcon, IDropdown, IDropdownOption, TooltipHost } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { LocalesPopular } from 'shared/constants/Locales';
import styles from './VoiceInput.module.scss';

interface IVoiceInput {
  setText: (text: string) => void;
}

const VoiceInput: React.FunctionComponent<IVoiceInput> = (props) => {
  const defaultLocale = 'en-US';
  const {
    transcript,
    resetTranscript,
    browserSupportsContinuousListening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();
  const [showLocales, setShowLocales] = React.useState<boolean>(false);
  const [started, setStarted] = React.useState<boolean>(false);

  const refLanguages = React.useRef<IDropdown>();

  React.useEffect(() => {
    if (showLocales) {
      document.getElementById((refLanguages.current as any)._id).click();
    }
  }, [showLocales]);

  const handleSpeechRecognition = (locale: string = defaultLocale) => {
    if (!started) {
      setStarted(true);
      resetTranscript();
      const params = {};
      if (browserSupportsContinuousListening) params['continuous'] = true;
      if (locale) params['language'] = locale;
      SpeechRecognition.startListening(params);
    } else {
      setStarted(false);
      SpeechRecognition.stopListening();
      props.setText(transcript);
    }
  };

  const emptyOption = { key: '', text: strings.TextLanguage, itemType: DropdownMenuItemType.Header };
  const options: IDropdownOption[] = [{ ...emptyOption }];
  options.push(...LocalesPopular.map((l) => ({ key: l.code, text: l.label, title: l.title ?? l.label })));
  const languages = (
    <Dropdown
      className={styles.languages}
      componentRef={refLanguages}
      selectedKey={''}
      options={options}
      //responsiveMode={ResponsiveMode.unknown}
      onChange={(e, option: IDropdownOption) => {
        if (option.key) {
          handleSpeechRecognition(option.key.toString());
        }
      }}
      onDismiss={() => {
        setShowLocales(false);
      }}
      dropdownWidth={'auto'}
    />
  );

  return browserSupportsSpeechRecognition && isMicrophoneAvailable ? (
    <>
      {!started ? (
        <TooltipHost content={strings.TextVoiceInput}>
          <FontIcon iconName={'Microphone'} className={styles.microphone} onClick={() => setShowLocales(true)} />
        </TooltipHost>
      ) : (
        <TooltipHost content={strings.TextStop}>
          <FontIcon
            iconName={'CircleStopSolid'}
            className={[styles.microphone, styles.stop].join(' ')}
            onClick={() => {
              handleSpeechRecognition();
            }}
          />
        </TooltipHost>
      )}
      {showLocales ? languages : null}
    </>
  ) : null;
};

export default VoiceInput;
