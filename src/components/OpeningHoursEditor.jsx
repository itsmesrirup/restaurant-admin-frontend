import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Grid, Switch, FormControlLabel, TextField, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// Initial empty structure
const INITIAL_SCHEDULE = DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});

function OpeningHoursEditor({ value, onChange }) {
    // Local state to manage the UI before pushing changes up
    const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);

    // Initialize state from props (parse JSON string from DB)
    useEffect(() => {
        if (value) {
            try {
                const parsed = typeof value === 'string' ? JSON.parse(value) : value;
                // Merge with initial to ensure all keys exist
                setSchedule({ ...INITIAL_SCHEDULE, ...parsed });
            } catch (e) {
                console.error("Invalid opening hours JSON", e);
            }
        }
    }, [value]);

    // Helper to propagate changes to parent
    const updateSchedule = (newSchedule) => {
        setSchedule(newSchedule);
        // Send back as JSON string
        onChange(JSON.stringify(newSchedule));
    };

    const handleToggleDay = (day, isOpen) => {
        const newSchedule = { ...schedule };
        if (isOpen) {
            // If turning on, add a default slot
            newSchedule[day] = [{ open: '09:00', close: '17:00' }];
        } else {
            // If turning off, clear slots
            newSchedule[day] = [];
        }
        updateSchedule(newSchedule);
    };

    const handleAddSlot = (day) => {
        const newSchedule = { ...schedule };
        newSchedule[day].push({ open: '18:00', close: '22:00' });
        updateSchedule(newSchedule);
    };

    const handleRemoveSlot = (day, index) => {
        const newSchedule = { ...schedule };
        newSchedule[day].splice(index, 1);
        updateSchedule(newSchedule);
    };

    const handleTimeChange = (day, index, field, newValue) => {
        const newSchedule = { ...schedule };
        newSchedule[day][index][field] = newValue;
        updateSchedule(newSchedule);
    };

    const copyToAll = (sourceDay) => {
        if(!window.confirm(`Copy ${sourceDay}'s hours to all other days?`)) return;
        const newSchedule = { ...schedule };
        const sourceSlots = newSchedule[sourceDay];
        DAYS.forEach(d => {
            if (d !== sourceDay) {
                // Deep copy the slots array
                newSchedule[d] = JSON.parse(JSON.stringify(sourceSlots));
            }
        });
        updateSchedule(newSchedule);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Operating Hours</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
                {DAYS.map(day => {
                    const isOpen = schedule[day] && schedule[day].length > 0;
                    
                    return (
                        <Box key={day} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={isOpen} 
                                            onChange={(e) => handleToggleDay(day, e.target.checked)} 
                                        />
                                    }
                                    label={<Typography fontWeight="bold">{day}</Typography>}
                                />
                                {isOpen && (
                                    <Button size="small" onClick={() => copyToAll(day)}>Copy to All</Button>
                                )}
                            </Box>

                            {isOpen && (
                                <Box sx={{ pl: 4 }}>
                                    {schedule[day].map((slot, index) => (
                                        <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                                            <Grid item>
                                                <TextField
                                                    type="time"
                                                    label="Open"
                                                    value={slot.open}
                                                    onChange={(e) => handleTimeChange(day, index, 'open', e.target.value)}
                                                    size="small"
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <Typography>-</Typography>
                                            </Grid>
                                            <Grid item>
                                                <TextField
                                                    type="time"
                                                    label="Close"
                                                    value={slot.close}
                                                    onChange={(e) => handleTimeChange(day, index, 'close', e.target.value)}
                                                    size="small"
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <IconButton color="error" onClick={() => handleRemoveSlot(day, index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    ))}
                                    <Button 
                                        startIcon={<AddCircleOutlineIcon />} 
                                        size="small" 
                                        onClick={() => handleAddSlot(day)}
                                    >
                                        Add Shift
                                    </Button>
                                </Box>
                            )}
                            {!isOpen && <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>Closed</Typography>}
                        </Box>
                    );
                })}
            </Paper>
        </Box>
    );
}

export default OpeningHoursEditor;