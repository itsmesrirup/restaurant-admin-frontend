import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button } from '@mui/material';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
                variant={i18n.language === 'en' ? 'contained' : 'outlined'} 
                onClick={() => i18n.changeLanguage('en')}
                size="small"
                sx={{ 
                    minWidth: '40px', 
                    // If active (contained), bg is primary.
                    // If inactive (outlined), border is currentColor (inherits from parent text color).
                    // This ensures it works on both white and blue backgrounds if parent color is set correctly.
                    borderColor: 'currentColor', 
                    color: 'inherit'
                }}
            >
                EN
            </Button>
            <Button 
                variant={i18n.language === 'fr' ? 'contained' : 'outlined'} 
                onClick={() => i18n.changeLanguage('fr')}
                size="small"
                sx={{ 
                    minWidth: '40px', 
                    borderColor: 'currentColor', 
                    color: 'inherit'
                }}
            >
                FR
            </Button>
        </Box>
    );
};

export default LanguageSwitcher;