import React, { useState, useEffect } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, prefix = '', t }) => (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
        <Typography color="text.secondary" noWrap>{t(title)}</Typography>
        <Typography variant="h4" fontWeight="bold">{prefix}{value}</Typography>
    </Paper>
);

function AnalyticsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [topItems, setTopItems] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const hasAnalyticsFeature = user.availableFeatures?.includes('ANALYTICS');

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // --- FIX: Correctly destructure all 4 promises ---
                const [summaryData, topItemsData, salesChartData, hourlyChartData] = await Promise.all([
                    apiClient.get('/api/analytics/summary'),
                    apiClient.get('/api/analytics/top-selling-items'),
                    apiClient.get('/api/analytics/sales-over-time'),
                    apiClient.get('/api/analytics/orders-by-hour')
                ]);
                setSummary(summaryData);
                setTopItems(topItemsData.slice(0, 5));
                setSalesData(salesChartData); // Use correct variable

                const fullHourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, orderCount: 0 }));
                hourlyChartData.forEach(data => { // Use correct variable
                    if(data.hour != null) fullHourlyData[data.hour].orderCount = data.orderCount;
                });
                setHourlyData(fullHourlyData);
            } catch (error) {
                toast.error(t('failedToLoadAnalytics', "Failed to load analytics data."));
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [user, t]);

    // If the user doesn't have the feature, render an "Upgrade" prompt instead of the page.
    if (!hasAnalyticsFeature) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Analytics</Typography>
                <Alert severity="info">
                    The Analytics dashboard is a PREMIUM feature. Upgrade your plan to unlock powerful insights into your sales, top-selling items, and peak hours.
                </Alert>
            </Paper>
        );
    }

    if (isLoading) return <p>{t('loadingAnalytics')}</p>;
    if (!summary) return <p>{t('noAnalyticsData')}</p>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* --- CHANGED: Use translation key for title --- */}
            <Typography variant="h4" gutterBottom>{t('analyticsTitle', { restaurantName: user.restaurantName })}</Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    {/* --- CHANGED: Use translation key and dynamic currency, pass t --- */}
                    <StatCard title="totalRevenue" value={summary.totalRevenue.toFixed(2)} prefix="€" t={t} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="totalOrders" value={summary.totalOrders} t={t} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="averageOrderValue" value={summary.averageOrderValue.toFixed(2)} prefix="€" t={t} />
                </Grid>
            </Grid>

            {/* --- FIX: Wrap all chart Grid items in a single Grid container --- */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <Paper elevation={3} sx={{ p: 2, width: '100%', overflowX: 'auto' }}>
                        <Typography variant="h6" gutterBottom>{t('top5Items')}</Typography>
                        <Box sx={{ height: 400, minWidth: '500px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topItems} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="itemName" interval={0} angle={-30} textAnchor="end" height={60} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="totalQuantitySold" fill="#8884d8" name={t('quantitySold')} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Paper elevation={3} sx={{ p: 2, width: '100%', overflowX: 'auto' }}>
                        <Typography variant="h6" gutterBottom>{t('busiestHours')}</Typography>
                        <Box sx={{ height: 400, minWidth: '500px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData}>
                                    <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="orderCount" fill="#82ca9d" name={t('orders')} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, width: '100%', overflowX: 'auto' }}>
                        <Typography variant="h6" gutterBottom>{t('salesLast30Days')}</Typography>
                        <Box sx={{ height: 400, minWidth: '500px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData}>
                                    <XAxis dataKey="period" />
                                    <YAxis tickFormatter={(value) => `€${value}`} />
                                    <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="totalSales" stroke="#8884d8" name={t('dailySales')} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default AnalyticsPage;