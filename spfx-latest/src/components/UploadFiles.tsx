import { PrimaryButton } from '@fluentui/react';
import * as strings from 'AzureOpenAiChatWebPartStrings';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { pdfjs } from 'react-pdf';
import MessageBar, { MessageType } from 'shared/components/MessageBar/MessageBar';
import styles from './UploadFiles.module.scss';

//pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

enum UploadFileType {
  image = 'image/png,image/jpeg,image/webp,image/gif',
  pdf = 'application/pdf',
}

interface IUploadFiles {
  setImageUrls?: (newImageUrls: string[]) => void;
  setPdfFileContent?: (newPdfFileContent: { [key: string]: string }) => void;
  setIsOpen: (state: boolean) => void;
}

const UploadFiles: FunctionComponent<IUploadFiles> = (props) => {
  const [errorDetails, setErrorDetails] = React.useState<string>();
  const refImage = React.useRef<HTMLInputElement>();
  const refPdf = React.useRef<HTMLInputElement>();

  const getFileUpload = (
    refObject: React.MutableRefObject<HTMLInputElement>,
    fileType: string,
    multiple: boolean
  ): JSX.Element => {
    const handleImage = async (e) => {
      let newFileUrls = [];
      const re = /data:image\/[^;]+;base64,/i;
      const re2 = /data:[^/]+\/[^;]+;base64,/i;
      for (let i = 0; i < e.target.files.length; i++) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const fileUrl = event.target.result?.toString();
            newFileUrls = [...newFileUrls, re.test(fileUrl) ? fileUrl : fileUrl.replace(re2, 'data:image/png;base64,')];
            props.setImageUrls(newFileUrls);
            props.setIsOpen(false);
          } catch (exc) {
            setErrorDetails(exc.message);
          }
        };
        reader.readAsDataURL(e.target.files[i]);
      }
    };

    const handlePdf = async (e) => {
      const fileContent: { [key: string]: string } = {};
      for (let i = 0; i < e.target.files.length; i++) {
        const reader = new FileReader();
        const file = e.target.files[i];
        const fileName = file.name;
        reader.onload = async (e) => {
          const extractedText = [];
          try {
            const contents = e.target.result;
            const pdf = await pdfjs.getDocument(contents).promise;

            for (let j = 1; j < pdf.numPages; j++) {
              const text = await pdf
                .getPage(j)
                .then((page) => page.getTextContent().then((text) => text.items.map((item) => (item as any).str).join(' ')));
              extractedText.push(text);
            }
            fileContent[fileName] = extractedText.join('\n');
            props.setPdfFileContent({ ...fileContent });
            props.setIsOpen(false);
          } catch (exc) {
            setErrorDetails(exc.message);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };

    return (
      <input
        ref={refObject}
        className={styles.fileUpload}
        type="file"
        accept={fileType}
        multiple={multiple}
        onChange={(e) => {
          if (!e.target.files.length) return;
          switch (fileType) {
            case UploadFileType.pdf: {
              handlePdf(e);
              break;
            }
            case UploadFileType.image: {
              handleImage(e);
              break;
            }
          }
        }}
      />
    );
  };

  const image = getFileUpload(refImage, UploadFileType.image, true);
  const pdf = getFileUpload(refPdf, UploadFileType.pdf, false);

  return (
    <>
      {errorDetails ? <MessageBar className={styles.errorMessage} type={MessageType.error} message={errorDetails} /> : null}
      <div className={styles.fileUploadDialogContainer}>
        {props.setImageUrls ? <PrimaryButton text={strings.TextUploadImage} onClick={() => refImage.current.click()} /> : null}
        {props.setPdfFileContent ? <PrimaryButton text={strings.TextUploadPdf} onClick={() => refPdf.current.click()} /> : null}
        {image}
        {pdf}
      </div>
    </>
  );
};
export default UploadFiles;
