import { useEffect, useRef } from 'react';

const APP_NAME = 'PlansiteOS';

/**
 * Sets the document title for the current page.
 * Restores the previous title on unmount.
 *
 * @param title - Page-specific title (will be formatted as "Title | PlansiteOS")
 * @param restoreOnUnmount - Whether to restore previous title when component unmounts (default: true)
 */
export function useDocumentTitle(title: string, restoreOnUnmount = true) {
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const formattedTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    document.title = formattedTitle;
  }, [title]);

  useEffect(() => {
    const prevTitle = previousTitle.current;
    return () => {
      if (restoreOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [restoreOnUnmount]);
}
