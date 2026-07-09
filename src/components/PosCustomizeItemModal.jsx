import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Box, Typography, Button, Radio, RadioGroup, Checkbox, FormControlLabel, FormGroup, Divider } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: '90%', maxWidth: 500, bgcolor: 'background.paper', border: 'none',
  borderRadius: 3, boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

export default function PosCustomizeItemModal({ open, handleClose, menuItem, onSave }) {
    const { t } = useTranslation();
    const [selections, setSelections] = useState({});

    // Reset selections when the modal opens for a new item
    useEffect(() => {
        if (!menuItem || !menuItem.options) return;
        const defaultSelections = menuItem.options.reduce((acc, option) => ({ ...acc, [option.id]: [] }), {});
        setSelections(defaultSelections);
    }, [open, menuItem]);

    if (!menuItem) return null;

    const handleRadioChange = (optionId, choiceId) => {
        setSelections(prev => ({ ...prev, [optionId]: [choiceId] }));
    };

    const handleCheckboxChange = (optionId, choiceId) => {
        setSelections(prev => {
            const currentChoices = prev[optionId] || [];
            if (currentChoices.includes(choiceId)) {
                return { ...prev, [optionId]: currentChoices.filter(id => id !== choiceId) };
            } else {
                return { ...prev, [optionId]: [...currentChoices, choiceId] };
            }
        });
    };
    
    // Check if the current selections are valid according to the rules (min/max choices)
    const isSelectionValid = () => {
        return menuItem.options.every(option => {
            const selectedCount = selections[option.id]?.length || 0;
            return selectedCount >= option.minChoices && selectedCount <= option.maxChoices;
        });
    };

    // Calculate total price with modifiers for display
    const currentTotal = menuItem.price + menuItem.options.reduce((sum, option) => {
        const selectedChoiceIds = selections[option.id] || [];
        const choicesSum = option.choices
            .filter(c => selectedChoiceIds.includes(c.id))
            .reduce((cSum, c) => cSum + (c.priceAdjustment || 0), 0);
        return sum + choicesSum;
    }, 0);

    const handleSubmit = () => {
        // Format the options exactly how the backend expects them
        const selectedOptionsForCart = menuItem.options.map(option => {
            const selectedChoices = option.choices.filter(choice => selections[option.id]?.includes(choice.id));
            return {
                optionName: option.name,
                choices: selectedChoices.map(c => c.name),
                priceAdjustments: selectedChoices.reduce((sum, c) => sum + (c.priceAdjustment || 0), 0)
            };
        }).filter(opt => opt.choices.length > 0); // Only include options that actually have choices selected

        const itemForTicket = {
            ...menuItem,
            calculatedPrice: currentTotal, // Use the new total price
            selectedOptions: selectedOptionsForCart
        };
        
        onSave(itemForTicket);
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h5" component="h2" fontWeight="bold">{menuItem.name}</Typography>
                <Divider sx={{ my: 2 }} />

                {menuItem.options?.map(option => (
                    <Box key={option.id} sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="bold">{option.name}</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#e0e0e0', px: 1, py: 0.5, borderRadius: 1 }}>
                                {option.minChoices === 1 && option.maxChoices === 1 ? 'Select 1' : `Select ${option.minChoices} to ${option.maxChoices}`}
                            </Typography>
                        </Box>
                        
                        {option.maxChoices === 1 ? (
                            <RadioGroup value={selections[option.id]?.[0] || ''} onChange={(e) => handleRadioChange(option.id, parseInt(e.target.value))}>
                                {option.choices.map(choice => (
                                    <FormControlLabel 
                                        key={choice.id} value={choice.id} control={<Radio />} 
                                        label={<Typography>{choice.name} {choice.priceAdjustment > 0 && <span style={{color: 'green'}}> (+€{choice.priceAdjustment.toFixed(2)})</span>}</Typography>} 
                                    />
                                ))}
                            </RadioGroup>
                        ) : (
                            <FormGroup>
                                {option.choices.map(choice => (
                                    <FormControlLabel 
                                        key={choice.id} 
                                        control={
                                            <Checkbox
                                                checked={selections[option.id]?.includes(choice.id) || false}
                                                onChange={() => handleCheckboxChange(option.id, choice.id)}
                                                disabled={(selections[option.id]?.length >= option.maxChoices) && !selections[option.id]?.includes(choice.id)}
                                            />
                                        } 
                                        label={<Typography>{choice.name} {choice.priceAdjustment > 0 && <span style={{color: 'green'}}> (+€{choice.priceAdjustment.toFixed(2)})</span>}</Typography>} 
                                    />
                                ))}
                            </FormGroup>
                        )}
                    </Box>
                ))}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">€{currentTotal.toFixed(2)}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={handleClose} variant="outlined" color="inherit">Cancel</Button>
                        <Button 
                            variant="contained" 
                            color="success"
                            onClick={handleSubmit}
                            disabled={!isSelectionValid()}
                            startIcon={<AddCircleOutlineIcon />}
                        >
                            Add to Ticket
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}