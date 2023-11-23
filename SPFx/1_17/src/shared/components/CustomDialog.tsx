import { PrimaryButton, Dialog, DialogFooter, DialogType, DefaultButton, ResponsiveMode } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import { FunctionComponent } from 'react';
import * as React from 'react';

interface ICustomDialog {
  title: string;
  subText: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  button1Text?: string;
  button2Text?: string;
  button1Action?: () => void;
  button2Action?: () => void;
  elements?: JSX.Element[];
  minWidth?: string | number;
  showCloseButton?: boolean;
}
const CustomDialog: FunctionComponent<ICustomDialog> = (props) => {
  // https://developer.microsoft.com/en-us/fluentui#/controls/web/dialog
  return props.isOpen ? (
    <Dialog
      hidden={!props.isOpen} // Using only this way causes blinking effect. Fixed by adding more explicit validation above (props.isOpen ? ...)
      onDismiss={() => props.setIsOpen(false)}
      dialogContentProps={{
        type: DialogType.normal,
        title: props.title,
        subText: props.subText,
        showCloseButton: props.showCloseButton,
      }}
      firstFocusableSelector={'OK'}
      responsiveMode={ResponsiveMode.unknown}
      minWidth={props.minWidth}
    >
      {props.elements}
      {(props.button1Text || props.button2Text) && (
        <DialogFooter>
          {props.button1Text && <PrimaryButton className={'OK'} onClick={props.button1Action} text={props.button1Text} />}
          {props.button2Text && <DefaultButton onClick={props.button2Action} text={props.button2Text} />}
        </DialogFooter>
      )}
    </Dialog>
  ) : null;
};
export default CustomDialog;

export function getConfirmationDialog(
  title: string,
  subText: string,
  isOpen: boolean,
  setIsOpen: (state: boolean) => void,
  confirmedAction: () => void,
  button1Text?: string,
  button2Text?: string,
  elements?: JSX.Element[],
  minWidth?: string | number
): JSX.Element {
  return (
    <CustomDialog
      title={title}
      subText={subText}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      button1Text={button1Text || 'OK'}
      button1Action={() => {
        setIsOpen(false);
        setTimeout(confirmedAction, 200);
      }}
      button2Text={button2Text || strings.TextCancel}
      button2Action={() => setIsOpen(false)}
      elements={elements}
      minWidth={minWidth}
    />
  );
}

export function getMessageDialog(
  title: string,
  subText: string,
  isOpen: boolean,
  setIsOpen: (state: boolean) => void,
  button1Text?: string
): JSX.Element {
  return (
    <CustomDialog
      title={title}
      subText={subText}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      button1Text={button1Text || 'OK'}
      button1Action={() => {
        setIsOpen(false);
      }}
    />
  );
}

export function getSimpleDialog(
  title: string,
  subText: string,
  isOpen: boolean,
  setIsOpen: (state: boolean) => void,
  elements: JSX.Element[]
): JSX.Element {
  return (
    <CustomDialog
      title={title}
      subText={subText}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      elements={elements}
      showCloseButton={true}
    />
  );
}
