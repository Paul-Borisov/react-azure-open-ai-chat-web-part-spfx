import { FontIcon, TooltipHost } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import * as React from 'react';
import LogService from 'shared/services/LogService';
import { IVoice } from './IVoice';
import Languages from './Languages';
import styles from './Speech.module.scss';

interface IVoiceOutput extends IVoice {
  text?: string;
  getAudio?: (text: string) => Promise<ArrayBuffer>;
}

const VoiceOutput: React.FunctionComponent<IVoiceOutput> = (props) => {
  const [showLocales, setShowLocales] = React.useState<boolean>(false);
  const [started, setStarted] = React.useState<boolean>(false);
  const [player, setPlayer] = React.useState<AudioBufferSourceNode>();

  const handleSpeechOutput = (locale: string = 'en-US') => {
    if (!started) {
      setStarted(true);
      const utterance = new SpeechSynthesisUtterance(props.text);
      utterance.lang = locale;
      const availableVoices = speechSynthesis.getVoices();
      const voices = availableVoices?.filter((v) => v.lang === locale);
      if (voices.length) {
        const firstNatural = voices.find((v) => /natural/i.test(v.voiceURI) || /natural/i.test(v.name));
        utterance.voice = firstNatural ?? voices[0];
      }
      utterance.onend = () => setStarted(false);
      utterance.onerror = () => setStarted(false);
      const synth = speechSynthesis;
      synth.speak(utterance);
    } else {
      setStarted(false);
      const synth = speechSynthesis;
      synth.cancel();
    }
  };

  const isAvailable = (!!props.getAudio && !!window.AudioContext) || (!!props.text && !!window.speechSynthesis);

  return isAvailable ? (
    <>
      {!started ? (
        <TooltipHost content={props.tooltip ?? strings.TextVoiceInput}>
          <FontIcon
            iconName={'InternetSharing'}
            className={styles.microphone}
            onClick={() => {
              if (!props.getAudio) {
                if (speechSynthesis.speaking) return;
                setShowLocales(true);
              } else {
                setStarted(true);
                props
                  .getAudio(props.text)
                  .then((buffer) => {
                    const ctx = new AudioContext();
                    ctx.decodeAudioData(buffer).then((audio) => {
                      const audioPlayer = ctx.createBufferSource();
                      audioPlayer.buffer = audio;
                      audioPlayer.connect(ctx.destination);
                      audioPlayer.start(ctx.currentTime);
                      audioPlayer.onended = () => setStarted(false);
                      setPlayer(audioPlayer);
                    });
                  })
                  .catch((error) => {
                    LogService.error(error);
                    setStarted(false);
                  });
              }
            }}
          />
        </TooltipHost>
      ) : (
        <TooltipHost content={strings.TextStop}>
          <FontIcon
            iconName={!!props.getAudio && !player ? 'ProgressLoopInner' : 'CircleStopSolid'}
            className={[styles.microphone, styles.stop].join(' ')}
            onClick={() => {
              if (!props.getAudio) {
                handleSpeechOutput();
              } else {
                if (player) {
                  player.stop();
                  setPlayer(undefined);
                  setStarted(false);
                }
              }
            }}
          />
        </TooltipHost>
      )}
      {showLocales ? <Languages handleSelection={handleSpeechOutput} isOpen={showLocales} setIsOpen={setShowLocales} /> : null}
    </>
  ) : null;
};

export default VoiceOutput;
