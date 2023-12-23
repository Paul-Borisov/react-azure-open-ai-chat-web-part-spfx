import * as React from 'react';

export interface ISpeech {
  showLocales: boolean;
  setShowLocales: (state: boolean) => void;
  started: boolean;
  setStarted: (state: boolean) => void;
}

export default function useSpeech(): ISpeech {
  const [showLocales, setShowLocales] = React.useState<boolean>(false);
  const [started, setStarted] = React.useState<boolean>(false);

  return { showLocales, setShowLocales, started, setStarted };
}
