import { IChatProps } from 'components/Chat';
import * as React from 'react';
import { StorageType } from 'shared/constants/Application';
import LocalStorageService from 'shared/services/LocalStorageService';

export default function useChatHistory(props: React.PropsWithChildren<IChatProps>): any {
  return React.useMemo(() => {
    switch (props.storageType) {
      case StorageType.Database: {
        return props.apiService;
      }
      case StorageType.Local: {
        return LocalStorageService;
      }
      case StorageType.SharePoint: {
        return props.spService;
      }
      default: {
        throw `Storage type is not supported: ${props.storageType}`;
      }
    }
  }, []);
}
