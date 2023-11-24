import * as React from 'react';
import styles from './MessageBar.module.scss';
//import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';

export enum MessageType {
  info = 1,
  error = 2,
  warn = 3,
}

export interface IMessageProps {
  className?: string;
  type?: MessageType;
  message?: string;
}

const MessageBar: React.FunctionComponent<IMessageProps> = ({ type, message, children, className }) => {
  return <p className={[styles.messageBar, getStyle(type), className].join(' ')}>{message || children}</p>;
};

function getStyle(type: MessageType) {
  switch (type) {
    case MessageType.error:
      return styles.errorMessage;
    case MessageType.warn:
      return styles.warnMessage;
    default:
      return undefined;
  }
}

export default MessageBar;
