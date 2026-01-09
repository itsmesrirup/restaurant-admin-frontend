import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    // Save the original title to restore it later (optional, but good practice)
    const prevTitle = document.title;
    
    // Set the new title
    document.title = `${title} | Tablo`;

    // Cleanup: Restore original title when component unmounts
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default usePageTitle;