import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Function to update theme based on document class
    const updateTheme = () => {
      const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setTheme(newTheme);
    };

    // Set initial theme
    updateTheme();

    // Observe changes to the class attribute of the <html> element
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
} 