import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Box, Typography, TextField, Button, Grid } from '@mui/material';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: '90%', maxWidth: 500, bgcolor: 'background.paper',
  borderRadius: 2, boxShadow: 24, p: 4
};

function CloneMenuModal({ open, onClose, menuToClone, onConfirm }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '' });

    useEffect(() => {
        if (menuToClone) {
            setFormData({
                title: `${menuToClone.title} (Copy)`,
                startDate: '',
                endDate: ''
            });
        }
    }, [menuToClone]);

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    if (!menuToClone) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2" gutterBottom>
                    {t('cloneMenuTitle')}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={t('newMenuTitle')}
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label={t('startDate')}
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label={t('endDate')}
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" variant="contained">{t('confirmClone')}</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default CloneMenuModal;