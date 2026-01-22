import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Grid } from '@mui/material';

export const SalesReport = React.forwardRef(({ restaurantName, summary, salesData, topItems, hourlyData, dateRange, t }, ref) => {
    if (!summary) return null;

    return (
        <div ref={ref} className="print-container" style={{ padding: '40px', width: '100%', color: 'black', backgroundColor: 'white' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>{restaurantName}</Typography>
                <Typography variant="h6" color="text.secondary">{t('salesReportTitle')}</Typography>
                <Typography variant="subtitle1">{dateRange}</Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={4}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>{t('totalRevenue')}</Typography>
                        <Typography variant="h5" fontWeight="bold">€{summary.totalRevenue.toFixed(2)}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>{t('totalOrders')}</Typography>
                        <Typography variant="h5" fontWeight="bold">{summary.totalOrders}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>{t('averageOrderValueReport')}</Typography>
                        <Typography variant="h5" fontWeight="bold">€{summary.averageOrderValue.toFixed(2)}</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Daily Breakdown Table */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                {t('dailyBreakdown')} ({dateRange}) {/* Uses the prop! */}
            </Typography>
            
            {/* --- FIX: Updated Table Layout --- */}
            <TableContainer sx={{ border: '1px solid #eee' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}> 
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ width: '60%' }}><strong>{t('date')}</strong></TableCell>
                            <TableCell align="right" sx={{ width: '40%' }}><strong>{t('sales')}</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {salesData.map((row) => (
                            <TableRow key={row.period}>
                                <TableCell>{new Date(row.period).toLocaleDateString()}</TableCell>
                                <TableCell align="right">€{Number(row.totalSales || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>{t('topSellingItems')}</Typography>
            
            <TableContainer sx={{ border: '1px solid #eee', mb: 4 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>{t('itemName')}</strong></TableCell>
                            <TableCell align="right"><strong>{t('quantitySold')}</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Pass topItems prop from parent */}
                        {topItems.map((item) => (
                            <TableRow key={item.itemName}>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell align="right">{item.totalQuantitySold}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>{t('hourlyBreakdownTitle')}</Typography>

            <TableContainer sx={{ border: '1px solid #eee' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ width: '60%' }}><strong>{t('timeOfDay')}</strong></TableCell>
                            <TableCell align="right" sx={{ width: '40%' }}><strong>{t('orders')}</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {hourlyData
                            .filter(row => row.orderCount > 0) // Hide empty hours
                            .map((row) => (
                                <TableRow key={row.hour}>
                                    <TableCell>
                                        {/* Format 13 -> "13:00 - 14:00" */}
                                        {`${row.hour}:00 - ${row.hour + 1}:00`}
                                    </TableCell>
                                    <TableCell align="right">{row.orderCount}</TableCell>
                                </TableRow>
                        ))}
                        {/* Fallback if no data */}
                        {hourlyData.every(row => row.orderCount === 0) && (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                                    {t('noDataAvailable')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">{t('generatedByTablo')} {new Date().toLocaleString()}</Typography>
            </Box>

            {/* --- OPTIONAL: Inline Style to ensure A4 sizing --- */}
            <style type="text/css" media="print">
                {`
                  @page { size: A4; margin: 20mm; }
                  .print-container { width: 100% !important; box-sizing: border-box; }
                `}
            </style>
        </div>
    );
});