import React, { useRef, useState, useEffect } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Grid, Box, Button, Alert } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../hooks/usePageTitle';
import DownloadIcon from '@mui/icons-material/Download';
import { useReactToPrint } from 'react-to-print';
import PrintIcon from '@mui/icons-material/Print';
import { SalesReport } from './SalesReport';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const StatCard = ({ title, value, prefix = '', t }) => (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
        <Typography color="text.secondary" noWrap>{t(title)}</Typography>
        <Typography variant="h4" fontWeight="bold">{prefix}{value}</Typography>
    </Paper>
);

// Helper to format hourly data for the chart (0-23 hours)
    const processHourlyData = (data) => {
        if (!Array.isArray(data)) return []; // Safety check
        
        const fullHourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, orderCount: 0 }));
        
        data.forEach(d => {
            if (d.hour !== null && d.hour !== undefined) {
                fullHourlyData[d.hour].orderCount = d.orderCount;
            }
        });
        
        return fullHourlyData;
    };

function AnalyticsPage() {
    const { t } = useTranslation();
    usePageTitle(t('analytics'));
    const { user } = useAuth();
    // --- STATE for Date Range ---
    // Default to last 30 days
    const [dateRange, setDateRange] = useState([
        new Date(new Date().setDate(new Date().getDate() - 30)), 
        new Date()
    ]);
    const [startDate, endDate] = dateRange;
    const [summary, setSummary] = useState(null);
    const [topItems, setTopItems] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const hasAnalyticsFeature = user.availableFeatures?.includes('ANALYTICS');
    const componentRef = useRef();

    // Use the hook instead of the <ReactToPrint> component
    const handlePrint = useReactToPrint({
        contentRef: componentRef, // <-- New Syntax: Pass the Ref object directly
        documentTitle: `Sales_Report_${user.restaurantName}`,
    });

    useEffect(() => {
        if (!user || !hasAnalyticsFeature || !startDate || !endDate) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const startStr = startDate.toISOString().split('T')[0];
                const endStr = endDate.toISOString().split('T')[0];
                
                // Append params to ALL calls
                const params = `?start=${startStr}&end=${endStr}`;

                const [summaryData, topItemsData, hourlyChartData, salesChartData] = await Promise.all([
                    apiClient.get(`/api/analytics/summary${params}`),
                    apiClient.get(`/api/analytics/top-selling-items${params}`),
                    apiClient.get(`/api/analytics/orders-by-hour${params}`), // Ensure backend supports this!
                    apiClient.get(`/api/analytics/sales-custom${params}`)
                ]);

                /*console.log("Summary:", summaryData);
                console.log("Top Items:", topItemsData);
                console.log("Hourly:", hourlyChartData);
                console.log("Sales:", salesChartData);*/

                setSummary(summaryData);
                setTopItems(topItemsData.slice(0, 5));
                setHourlyData(processHourlyData(hourlyChartData));
                setSalesData(salesChartData);
            } catch (err) {
                console.error("Processing Error:", err);
                toast.error(t('failedToLoadAnalytics'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, startDate, endDate, hasAnalyticsFeature]);

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

    // Helper to format today's date for the report
    const getReportDateRange = () => {
        if (!startDate || !endDate) return "Custom Range";
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header with Print Button */}
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" gutterBottom>{t('analyticsTitle', { restaurantName: user.restaurantName })}</Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* --- DATE PICKER UI --- */}
                    <Box sx={{ '& .react-datepicker-wrapper': { width: 'auto' } }}>
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable={false}
                            className="custom-datepicker" // You can style this in CSS
                            customInput={
                                <Button variant="outlined" sx={{ backgroundColor: 'white' }}>
                                    {startDate ? startDate.toLocaleDateString() : 'Start'} - {endDate ? endDate.toLocaleDateString() : 'End'}
                                </Button>
                            }
                        />
                    </Box>

                    <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                        {t('printReportPdf')}
                    </Button>
                </Box>
            </Box>

            {/* --- HIDDEN REPORT COMPONENT --- */}
            <div style={{ overflow: "hidden", height: "0px", width: "0px" }}>
                <SalesReport 
                    ref={componentRef} 
                    restaurantName={user.restaurantName}
                    summary={summary}
                    salesData={salesData}
                    topItems={topItems}
                    hourlyData={hourlyData}
                    dateRange={getReportDateRange()}
                    t={t}
                />
            </div>
            
            <Grid container spacing={3} sx={{ mb: 2 }}>
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
                    <Paper elevation={3} sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column' }}>
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
                    <Paper elevation={3} sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column' }}>
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
                    <Paper elevation={3} sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column' }}>
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