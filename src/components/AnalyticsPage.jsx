import React, { useState, useEffect } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Grid, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, prefix = '' }) => (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight="bold">{prefix}{value}</Typography>
    </Paper>
);

function AnalyticsPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [topItems, setTopItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [summaryData, topItemsData] = await Promise.all([
                    apiClient.get('/api/analytics/summary'),
                    apiClient.get('/api/analytics/top-selling-items')
                ]);
                setSummary(summaryData);
                // Get only the top 5 items for the chart
                setTopItems(topItemsData.slice(0, 5));
            } catch (error) {
                toast.error("Failed to load analytics data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [user]);

    if (isLoading) return <p>Loading analytics...</p>;
    if (!summary) return <p>No data available to generate analytics.</p>;

    return (
        <div>
            <Typography variant="h4" gutterBottom>Analytics for {user.restaurantName}</Typography>
            
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}> {/* ✅ Adjusted grid sizes for better fit */}
                    <StatCard title="Total Revenue" value={summary.totalRevenue.toFixed(2)} prefix="$" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Total Orders" value={summary.totalOrders} />
                </Grid>
                <Grid item xs={12} sm={12} md={4}> {/* Make avg value full width on small screens */}
                    <StatCard title="Average Order Value" value={summary.averageOrderValue.toFixed(2)} prefix="$" />
                </Grid>
            </Grid>

            {/* Top Selling Items Chart */}
            <Paper elevation={3} sx={{ p: 2, width: '100%', overflowX: 'auto' }}>
                <Typography variant="h6" gutterBottom>Top 5 Selling Items</Typography>
                <Box sx={{ height: 400, minWidth: '500px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={topItems}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="itemName" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalQuantitySold" fill="#8884d8" name="Quantity Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>
        </div>
    );
}

export default AnalyticsPage;