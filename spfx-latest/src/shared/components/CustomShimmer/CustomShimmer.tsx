import { Shimmer } from '@fluentui/react';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import * as React from 'react';
import styles from './CustomShimmer.module.scss';

interface ICustomShimmerProps {
  isCompact?: boolean;
  themeVariant?: IReadonlyTheme;
  header?: React.ReactNode;
}

export const CustomShimmer: React.FunctionComponent<ICustomShimmerProps> = (props) => {
  return (
    <div className={[styles.shimmerContainer, props.isCompact ? styles.compact : undefined].join(' ').trim()}>
      {props.header}
      <Shimmer width="100%" className={styles.shimmer} />
      {!props.isCompact && <Shimmer width="100%" className={styles.shimmer} />}
      {!props.isCompact && <Shimmer width="50%" className={styles.shimmer} />}
      {props.themeVariant?.isInverted && <style>{'.ms-Shimmer-shimmerWrapper {background-color: transparent;}'}</style>}
    </div>
  );
};
