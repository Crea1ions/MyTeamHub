import React, { useMemo } from 'react';
import { ExternalLink, AlertCircle, Link as LinkIcon } from 'lucide-react';
import styles from './MarkdownLinkRenderer.module.css';
import {
  splitIntoSegments,
  extractLinksFromText,
  vaultPathToUrl,
  type ParsedLink,
  type LinkRenderSegment,
} from '../lib/link-parser';

interface MarkdownLinkRendererProps {
  content: string;
  onLinkClick?: (link: ParsedLink) => void;
  showTooltips?: boolean;
  highlightDeadLinks?: boolean;
  existingFiles?: Set<string>;
}

/**
 * Renders markdown content with interactive vault links
 * Supports both [[obsidian]] and [markdown](path) formats
 */
export const MarkdownLinkRenderer: React.FC<MarkdownLinkRendererProps> = ({
  content,
  onLinkClick,
  showTooltips = true,
  highlightDeadLinks = true,
  existingFiles,
}) => {
  const segments = useMemo(() => splitIntoSegments(content), [content]);

  const handleLinkClick = (
    e: React.MouseEvent,
    link: ParsedLink
  ) => {
    e.preventDefault();

    if (onLinkClick) {
      onLinkClick(link);
    } else {
      // Default behavior: navigate using URL
      if (link.type === 'obsidian' || (link.type === 'markdown' && link.isValid)) {
        window.location.href = vaultPathToUrl(link.target);
      }
    }
  };

  const isLinkDead = (link: ParsedLink): boolean => {
    if (!highlightDeadLinks || !existingFiles) return false;
    return !link.isValid || !existingFiles.has(link.target);
  };

  const renderSegment = (segment: LinkRenderSegment, index: number) => {
    if (segment.type === 'text') {
      return <span key={index}>{segment.content}</span>;
    }

    if (segment.type === 'link' && segment.link) {
      const link = segment.link;
      const isDead = isLinkDead(link);

      return (
        <LinkElement
          key={index}
          link={link}
          isDead={isDead}
          showTooltip={showTooltips}
          onClick={(e) => handleLinkClick(e, link)}
        />
      );
    }

    return null;
  };

  return <div className={styles.container}>{segments.map(renderSegment)}</div>;
};

interface LinkElementProps {
  link: ParsedLink;
  isDead: boolean;
  showTooltip: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const LinkElement: React.FC<LinkElementProps> = ({
  link,
  isDead,
  showTooltip,
  onClick,
}) => {
  const [showHint, setShowHint] = React.useState(false);

  const title = showTooltip
    ? isDead
      ? `Dead link: ${link.target}`
      : `Jump to: ${link.target}`
    : undefined;

  const iconClass = isDead ? styles.deadIcon : styles.validIcon;
  const linkClass = isDead ? styles.deadLink : styles.validLink;

  return (
    <span
      className={styles.linkWrapper}
      onMouseEnter={() => setShowHint(showTooltip)}
      onMouseLeave={() => setShowHint(false)}
    >
      <a
        href={isDead ? '#' : vaultPathToUrl(link.target)}
        className={linkClass}
        title={title}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        {link.type === 'obsidian' && (
          <LinkIcon size={14} className={styles.icon} />
        )}
        <span className={styles.linkText}>{link.text}</span>
        {isDead && <AlertCircle size={12} className={iconClass} />}
      </a>

      {showHint && (
        <div className={isDead ? styles.tooltipDead : styles.tooltipValid}>
          <div className={styles.tooltipLabel}>
            {isDead ? 'File not found' : 'Jump to'}
          </div>
          <div className={styles.tooltipPath}>{link.target}</div>
        </div>
      )}
    </span>
  );
};

interface LinkListProps {
  content: string;
  existingFiles?: Set<string>;
  onLinkClick?: (link: ParsedLink) => void;
}

/**
 * Display all links found in content as a list
 */
export const LinkList: React.FC<LinkListProps> = ({
  content,
  existingFiles,
  onLinkClick,
}) => {
  const links = useMemo(() => extractLinksFromText(content), [content]);

  if (links.length === 0) {
    return (
      <div className={styles.emptyList}>
        <p>No links found in this file</p>
      </div>
    );
  }

  const isLinkDead = (link: ParsedLink): boolean => {
    if (!existingFiles) return false;
    return !link.isValid || !existingFiles.has(link.target);
  };

  return (
    <div className={styles.linkList}>
      <div className={styles.listHeader}>
        <h4>Links ({links.length})</h4>
      </div>

      <ul className={styles.listItems}>
        {links.map((link, index) => {
          const isDead = isLinkDead(link);

          return (
            <li key={index} className={isDead ? styles.deadItem : styles.validItem}>
              <button
                className={styles.listLink}
                onClick={() => onLinkClick?.(link)}
                title={`${link.type === 'obsidian' ? 'Obsidian' : 'Markdown'} link`}
              >
                {link.type === 'obsidian' && (
                  <span className={styles.badge}>Obsidian</span>
                )}
                <span className={styles.text}>{link.text}</span>
                <span className={styles.target}>{link.target}</span>
                {isDead && (
                  <span className={styles.deadBadge}>Dead Link</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Export for testing
 */
export { extractLinksFromText };
