import { FontIcon, TooltipHost } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import useSpeech from 'shared/hooks/useSpeech';
import { IVoice } from 'shared/model/IVoice';
import Languages from './Languages';
import styles from './Speech.module.scss';

interface IVoiceInput extends IVoice {
  setText?: (text: string) => void;
}

const VoiceInput: React.FunctionComponent<IVoiceInput> = (props) => {
  const {
    transcript,
    resetTranscript,
    browserSupportsContinuousListening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();
  const { showLocales, setShowLocales, started, setStarted } = useSpeech();

  const handleSpeechRecognition = (locale: string = 'en-US') => {
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

  const isAvailable = !!browserSupportsSpeechRecognition && !!isMicrophoneAvailable;
  return isAvailable ? (
    <>
      {!started ? (
        <TooltipHost content={props.tooltip ?? strings.TextVoiceInput}>
          <FontIcon iconName={'Microphone'} className={styles.microphone} onClick={() => setShowLocales(true)} />
        </TooltipHost>
      ) : (
        <TooltipHost content={strings.TextStop}>
          <FontIcon
            iconName={'CircleStopSolid'}
            className={[styles.microphone, styles.stop].join(' ')}
            onClick={() => handleSpeechRecognition()}
          />
        </TooltipHost>
      )}
      {showLocales ? (
        <Languages handleSelection={handleSpeechRecognition} isOpen={showLocales} setIsOpen={setShowLocales} />
      ) : null}
    </>
  ) : (
    <TooltipHost content={strings.TextDeviceUnavailable}>
      <FontIcon iconName={'Microphone'} className={[styles.microphone, styles.unavailable].join(' ')} />
    </TooltipHost>
  );
};

export default VoiceInput;
