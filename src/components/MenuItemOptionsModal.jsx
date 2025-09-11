import React, {useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';
import { Modal, Box, Typography, Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-hot-toast';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 700,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

function MenuItemOptionsModal({ open, handleClose, menuItem, onUpdate }) {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        if (menuItem) {
            setOptions(menuItem.options || []);
        }
    }, [menuItem]);

    const handleAddOptionGroup = () => {
        const newOption = { name: 'New Choice Group', minChoices: 1, maxChoices: 1, choices: [] };
        // We will save this to the backend
        apiClient.post(`/api/menu-items/${menuItem.id}/options`, newOption)
            .then(savedOption => {
                setOptions(prev => [...prev, savedOption]);
                onUpdate(); // Notify parent to refresh
            })
            .catch(() => toast.error("Failed to add option group."));
    };

    const handleAddChoice = (optionId) => {
        const newChoice = { name: 'New Choice', priceAdjustment: 0.0 };
        apiClient.post(`/api/menu-item-options/${optionId}/choices`, newChoice)
            .then(savedChoice => {
                 setOptions(prev => prev.map(opt => 
                    opt.id === optionId ? { ...opt, choices: [...opt.choices, savedChoice] } : opt
                ));
                onUpdate();
            })
            .catch(() => toast.error("Failed to add choice."));
    };
    
    // Add handlers for updating and deleting options and choices here

    if (!menuItem) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Manage Options for "{menuItem.name}"</Typography>
                
                {options.map(option => (
                    <Box key={option.id} sx={{ mt: 2, p: 2, border: '1px solid #ddd' }}>
                        <TextField fullWidth label="Choice Group Name" defaultValue={option.name} />
                        {/* Add fields for min/max choices */}
                        <List>
                            {option.choices.map(choice => (
                                <ListItem key={choice.id}>
                                    <TextField sx={{ mr: 1 }} size="small" label="Choice Name" defaultValue={choice.name} />
                                    <TextField sx={{ width: '100px' }} size="small" label="Price Adj." type="number" defaultValue={choice.priceAdjustment} />
                                    <IconButton><DeleteIcon /></IconButton>
                                </ListItem>
                            ))}
                        </List>
                        <Button startIcon={<AddCircleIcon />} onClick={() => handleAddChoice(option.id)}>Add Choice</Button>
                    </Box>
                ))}

                <Button onClick={handleAddOptionGroup} sx={{ mt: 2 }}>Add Choice Group</Button>
                <Button onClick={handleClose} sx={{ mt: 2, ml: 1 }}>Close</Button>
            </Box>
        </Modal>
    );
}

export default MenuItemOptionsModal;