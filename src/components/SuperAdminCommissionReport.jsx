import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value }) => (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
    </Paper>
);

function SuperAdminCommissionReport() {
    const { t } = useTranslation();
    const [ledger, setLedger] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/commissions/all') // Calls the new global endpoint
            .then(data => setLedger(data))
            .catch(() => toast.error(t("failedToLoadGlobalCommissions")))
            .finally(() => setIsLoading(false));
    }, [t]);

    const summary = useMemo(() => {
        const totalCommission = ledger.reduce((sum, entry) => sum + entry.commissionAmount, 0);
        return { totalCommission, totalOrders: ledger.length };
    }, [ledger]);

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>{t('globalCommissionReportTitle')}</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                    <StatCard title={t('totalPlatformRevenue')} value={`€${summary.totalCommission.toFixed(2)}`} t={t} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <StatCard title={t('totalCommissionableOrders')} value={summary.totalOrders} t={t} />
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('restaurant')}</TableCell>
                            <TableCell>{t('orderId')}</TableCell>
                            <TableCell>{t('date')}</TableCell>
                            <TableCell align="right">{t('orderTotal')}</TableCell>
                            <TableCell align="right">{t('commissionOwed')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ledger.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.restaurantName}</TableCell>
                                <TableCell>#{row.orderId}</TableCell>
                                <TableCell>{new Date(row.transactionDate).toLocaleString()}</TableCell>
                                <TableCell align="right">€{row.orderTotal.toFixed(2)}</TableCell>
                                <TableCell align="right">€{row.commissionAmount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default SuperAdminCommissionReport;