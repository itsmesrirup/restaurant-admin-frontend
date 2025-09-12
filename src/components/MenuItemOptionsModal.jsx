import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../context/AuthContext';
import { Modal, Box, Typography, Button, TextField, List, ListItem, IconButton, Paper, Divider, CircularProgress } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-hot-toast';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: '90%', maxWidth: 800, bgcolor: 'background.paper', border: '1px solid #ddd',
  borderRadius: 2, boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

function MenuItemOptionsModal({ open, handleClose, menuItem, onUpdate }) {
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchOptions = useCallback(async () => {
        if (!menuItem) return;
        setIsLoading(true);
        try {
            const data = await apiClient.get(`/api/menu-items/${menuItem.id}`);
            setOptions(data.options || []);
        } catch (error) {
            toast.error("Could not load options.");
        } finally {
            setIsLoading(false);
        }
    }, [menuItem]);

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open, fetchOptions]);

    const handleAddOptionGroup = () => {
        const newOption = { name: 'New Choice Group', minChoices: 1, maxChoices: 1 };
        toast.promise(apiClient.post(`/api/menu-items/${menuItem.id}/options`, newOption), {
            loading: 'Adding group...',
            success: () => { fetchOptions(); onUpdate(); return "Group added!"; },
            error: "Failed to add group."
        });
    };

    const handleUpdateOption = (optionId, field, value) => {
        setOptions(prev => prev.map(opt => 
            opt.id === optionId ? { ...opt, [field]: value } : opt
        ));
    };

    const handleSaveOption = (option) => {
        const payload = { name: option.name, minChoices: option.minChoices, maxChoices: option.maxChoices };
        toast.promise(apiClient.put(`/api/menu-item-options/${option.id}`, payload), {
            loading: 'Saving...', success: 'Saved!', error: 'Failed to save.'
        });
    };

    const handleDeleteOption = (optionId) => {
        if (!window.confirm("Delete this group? It only works if it's empty.")) return;
        toast.promise(apiClient.delete(`/api/menu-item-options/${optionId}`), {
            loading: 'Deleting...',
            success: () => { setOptions(prev => prev.filter(opt => opt.id !== optionId)); onUpdate(); return 'Group deleted!'; },
            error: (err) => err.message || 'Failed to delete.'
        });
    };

    const handleAddChoice = (optionId) => {
        const newChoice = { name: 'New Choice', priceAdjustment: 0.0 };
        toast.promise(apiClient.post(`/api/menu-item-options/${optionId}/choices`, newChoice), {
            loading: 'Adding choice...',
            success: () => { fetchOptions(); onUpdate(); return "Choice added!"; },
            error: "Failed to add choice."
        });
    };

    const handleUpdateChoice = (optionId, choiceId, field, value) => {
        setOptions(prev => prev.map(opt => {
            if (opt.id !== optionId) return opt;
            return { ...opt, choices: opt.choices.map(ch => ch.id === choiceId ? { ...ch, [field]: value } : ch) };
        }));
    };
    
    const handleSaveChoice = (option, choice) => {
        const payload = { name: choice.name, priceAdjustment: choice.priceAdjustment };
        toast.promise(apiClient.put(`/api/menu-item-option-choices/${choice.id}`, payload), {
            loading: 'Saving...', success: 'Saved!', error: 'Failed to save.'
        });
    };

    const handleDeleteChoice = (optionId, choiceId) => {
        if (!window.confirm("Delete this choice?")) return;
        toast.promise(apiClient.delete(`/api/menu-item-option-choices/${choiceId}`), {
            loading: 'Deleting...',
            success: () => { fetchOptions(); onUpdate(); return 'Choice deleted!'; },
            error: 'Failed to delete.'
        });
    };

    if (!menuItem) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Manage Options for "{menuItem.name}"</Typography>
                <Button onClick={handleAddOptionGroup} sx={{ my: 2 }} variant="contained">Add Choice Group (e.g., Entrées)</Button>
                
                {isLoading ? <CircularProgress /> : (
                    <List>
                        {options.map(option => (
                            <Paper key={option.id} sx={{ p: 2, my: 2, border: '1px solid #eee' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField fullWidth label="Choice Group Name" value={option.name || ''} onChange={(e) => handleUpdateOption(option.id, 'name', e.target.value)} />
                                    <TextField sx={{ width: 100 }} label="Min" type="number" value={option.minChoices ?? 1} onChange={(e) => handleUpdateOption(option.id, 'minChoices', e.target.value)} />
                                    <TextField sx={{ width: 100 }} label="Max" type="number" value={option.maxChoices ?? 1} onChange={(e) => handleUpdateOption(option.id, 'maxChoices', e.target.value)} />
                                    <IconButton title="Save Group" onClick={() => handleSaveOption(option)}><SaveIcon /></IconButton>
                                    <IconButton title="Delete Group" onClick={() => handleDeleteOption(option.id)}><DeleteIcon /></IconButton>
                                </Box>
                                <List>
                                    {option.choices?.map(choice => (
                                        <ListItem key={choice.id} disablePadding sx={{ display: 'flex', gap: 1, my: 1 }}>
                                            <TextField sx={{ flexGrow: 1 }} size="small" label="Choice Name" value={choice.name || ''} onChange={(e) => handleUpdateChoice(option.id, choice.id, 'name', e.target.value)} />
                                            <TextField sx={{ width: '120px' }} size="small" label="Price Adj. (+/-)" type="number" value={choice.priceAdjustment ?? 0} onChange={(e) => handleUpdateChoice(option.id, choice.id, 'priceAdjustment', e.target.value)} />
                                            <IconButton title="Save Choice" onClick={() => handleSaveChoice(option, choice)}><SaveIcon fontSize="small"/></IconButton>
                                            <IconButton title="Delete Choice" onClick={() => handleDeleteChoice(option.id, choice.id)}><DeleteIcon fontSize="small" /></IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                                <Button size="small" startIcon={<AddCircleIcon />} onClick={() => handleAddChoice(option.id)}>Add Choice (e.g., Samosa)</Button>
                            </Paper>
                        ))}
                    </List>
                )}
                <Button onClick={handleClose} sx={{ mt: 2 }}>Done</Button>
            </Box>
        </Modal>
    );
}

export default MenuItemOptionsModal;