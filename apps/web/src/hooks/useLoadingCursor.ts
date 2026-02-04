'use client';

import { useEffect } from 'react';

export function useLoadingCursor(isLoading: boolean) {
  useEffect(() => {
    const body = document.body;
    if (isLoading) {
      body.classList.add('app-loading');
    } else {
      body.classList.remove('app-loading');
    }
    return () => {
      body.classList.remove('app-loading');
    };
  }, [isLoading]);
}
