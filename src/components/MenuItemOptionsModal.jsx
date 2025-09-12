import React from 'react';
import { Modal, Box, Typography, Button, TextField, List, ListItem, IconButton, Paper, CircularProgress } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: '90%', maxWidth: 800, bgcolor: 'background.paper', border: '1px solid #ddd',
  borderRadius: 2, boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

function MenuItemOptionsModal({
    open,
    handleClose,
    menuItem,
    isLoading,
    onAddOptionGroup,
    onUpdateOption,
    onSaveOption,
    onDeleteOption,
    onAddChoice,
    onUpdateChoice,
    onSaveChoice,
    onDeleteChoice
}) {
    if (!menuItem) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Manage Options for "{menuItem.name}"</Typography>
                <Button onClick={onAddOptionGroup} sx={{ my: 2 }} variant="contained">Add Choice Group (e.g., Entrées)</Button>
                
                {isLoading ? <CircularProgress /> : (
                    <List>
                        {menuItem.options?.map(option => (
                            <Paper key={option.id} sx={{ p: 2, my: 2, border: '1px solid #eee' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField fullWidth label="Choice Group Name" value={option.name || ''} onChange={(e) => onUpdateOption(option.id, 'name', e.target.value)} />
                                    <TextField sx={{ width: 100 }} label="Min" type="number" value={option.minChoices ?? 1} onChange={(e) => onUpdateOption(option.id, 'minChoices', parseInt(e.target.value))} />
                                    <TextField sx={{ width: 100 }} label="Max" type="number" value={option.maxChoices ?? 1} onChange={(e) => onUpdateOption(option.id, 'maxChoices', parseInt(e.target.value))} />
                                    <IconButton title="Save Group" onClick={() => onSaveOption(option)}><SaveIcon /></IconButton>
                                    <IconButton title="Delete Group" onClick={() => onDeleteOption(option.id)}><DeleteIcon /></IconButton>
                                </Box>
                                <List>
                                    {option.choices?.map(choice => (
                                        <ListItem key={choice.id} disablePadding sx={{ display: 'flex', gap: 1, my: 1 }}>
                                            <TextField sx={{ flexGrow: 1 }} size="small" label="Choice Name" value={choice.name || ''} onChange={(e) => onUpdateChoice(option.id, choice.id, 'name', e.target.value)} />
                                            <TextField sx={{ width: 120 }} size="small" label="Price Adj. (+/-)" type="number" value={choice.priceAdjustment ?? 0} onChange={(e) => onUpdateChoice(option.id, choice.id, 'priceAdjustment', parseFloat(e.target.value))} />
                                            <IconButton title="Save Choice" onClick={() => onSaveChoice(choice)}><SaveIcon fontSize="small"/></IconButton>
                                            <IconButton title="Delete Choice" onClick={() => onDeleteChoice(option.id, choice.id)}><DeleteIcon fontSize="small" /></IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                                <Button size="small" startIcon={<AddCircleIcon />} onClick={() => onAddChoice(option.id)}>Add Choice (e.g., Samosa)</Button>
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