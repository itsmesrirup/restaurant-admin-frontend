import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../hooks/usePageTitle';

const StatCard = ({ title, value, prefix = '', t }) => (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
        <Typography color="text.secondary" noWrap>{t(title)}</Typography>
        <Typography variant="h4" fontWeight="bold">{prefix}{value}</Typography>
    </Paper>
);

function CommissionPage() {
    const { t } = useTranslation();
    usePageTitle(t('commissions'));
    const [ledger, setLedger] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/commissions/my-restaurant')
            .then(data => setLedger(data))
            .catch(() => toast.error("Failed to load commission data."))
            .finally(() => setIsLoading(false));
    }, []);

    const summary = useMemo(() => {
        const totalCommission = ledger.reduce((sum, entry) => sum + entry.commissionAmount, 0);
        return { totalCommission, totalOrders: ledger.length };
    }, [ledger]);

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Commission Report</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                    <StatCard title="Total Commission Owed (All Time)" value={`€${summary.totalCommission.toFixed(2)}`} t={t} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <StatCard title="Total Commissionable Orders" value={summary.totalOrders} t={t} />
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Order Total</TableCell>
                            <TableCell align="right">Commission Rate</TableCell>
                            <TableCell align="right">Commission Owed</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ledger.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>#{row.orderId}</TableCell>
                                <TableCell>{new Date(row.transactionDate).toLocaleString()}</TableCell>
                                <TableCell align="right">€{row.orderTotal.toFixed(2)}</TableCell>
                                <TableCell align="right">{(row.commissionRate * 100).toFixed(2)}%</TableCell>
                                <TableCell align="right">€{row.commissionAmount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default CommissionPage;