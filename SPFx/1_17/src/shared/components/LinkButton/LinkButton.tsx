import * as React from 'react';
import styles from 'shared/components/LinkButton/LinkButton.module.scss';
import { AnchorTarget } from 'shared/model/enums/AnchorTarget';

export type Variant = 'text' | 'primary';

export interface ILinkButtonProps {
  text?: string;
  className?: string;
  disabled?: boolean;
  href?: string;
  target?: AnchorTarget;
  title?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement, MouseEvent>) => void;
  variant?: Variant;
}

const LinkButton: React.FunctionComponent<ILinkButtonProps> = ({
  text,
  className,
  onClick,
  href,
  target,
  title,
  disabled,
  variant,
  children,
}) => {
  const variantClass = variant === 'primary' ? styles.primary : styles.text;

  if (href) {
    return (
      <a
        href={href}
        className={[styles.linkbutton, className, variantClass].join(' ')}
        title={title}
        data-interception={target === AnchorTarget.newTab ? 'off' : undefined}
        target={target === AnchorTarget.newTab ? '_blank' : undefined}
      >
        {children || text}
      </a>
    );
  } else {
    return (
      <button
        type="button"
        className={[styles.linkbutton, className, variantClass].join(' ')}
        title={title}
        onClick={onClick}
        disabled={disabled}
      >
        {children || text}
      </button>
    );
  }
};

export default LinkButton;
