import { Dropdown, DropdownMenuItemType, FontIcon, IDropdown, IDropdownOption, TooltipHost } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { LocalesPopular } from 'shared/constants/Locales';
import styles from './VoiceInput.module.scss';

interface IVoiceInput {
  output?: boolean;
  text?: string;
  tooltip?: string;
  setText?: (text: string) => void;
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

  const availableVoices = React.useMemo(() => speechSynthesis.getVoices(), []);

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

  const handleSpeechOutput = (locale: string = defaultLocale) => {
    if (!started) {
      setStarted(true);
      const utterance = new SpeechSynthesisUtterance(props.text);
      utterance.lang = locale;
      const voices = availableVoices?.filter((v) => v.lang === locale);
      if (voices.length) {
        const firstNatural = voices.find((v) => /natural/i.test(v.voiceURI) || /natural/i.test(v.name));
        utterance.voice = firstNatural ?? voices[0];
      }
      utterance.onend = () => setStarted(false);
      utterance.onerror = () => setStarted(false);
      const synth = speechSynthesis;
      synth.speak(utterance);
      /*const checkState = () => {
        if (synth.speaking) {
          setTimeout(checkState, 1000);
        } else {
          setStarted(false);
        }
      };
      checkState();*/
    } else {
      setStarted(false);
      const synth = speechSynthesis;
      synth.cancel();
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
          if (props.output) {
            handleSpeechOutput(option.key.toString());
          } else {
            handleSpeechRecognition(option.key.toString());
          }
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
        <TooltipHost content={props.tooltip ?? strings.TextVoiceInput}>
          <FontIcon
            iconName={props.output ? 'InternetSharing' : 'Microphone'}
            className={styles.microphone}
            onClick={() => setShowLocales(true)}
          />
        </TooltipHost>
      ) : (
        <TooltipHost content={strings.TextStop}>
          <FontIcon
            iconName={'CircleStopSolid'}
            className={[styles.microphone, styles.stop].join(' ')}
            onClick={() => {
              if (props.output) {
                handleSpeechOutput();
              } else {
                handleSpeechRecognition();
              }
            }}
          />
        </TooltipHost>
      )}
      {showLocales ? languages : null}
    </>
  ) : null;
};

export default VoiceInput;
