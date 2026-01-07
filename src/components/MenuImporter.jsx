import React, { useState, useEffect } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Paper, Typography, Box, Button, Grid, CircularProgress, 
    TextField, Accordion, AccordionSummary, AccordionDetails, IconButton,
    FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

// --- HELPER COMPONENT: Items List ---
// Reusable component to render a list of editable items.
// Used for both Main Categories and Subcategories.
const ItemsList = ({ items, onUpdate, onDelete }) => (
    <Box sx={{ pl: 2 }}>
        {items.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <TextField 
                    label="Item Name" 
                    value={item.name} 
                    onChange={(e) => onUpdate(idx, 'name', e.target.value)}
                    fullWidth 
                    size="small"
                />
                <TextField 
                    label="Price" 
                    type="number"
                    value={item.price} 
                    onChange={(e) => onUpdate(idx, 'price', parseFloat(e.target.value))}
                    sx={{ width: 120 }}
                    size="small"
                />
                <IconButton onClick={() => onDelete(idx)} color="error" size="small">
                    <DeleteIcon />
                </IconButton>
            </Box>
        ))}
    </Box>
);

function MenuImporter() {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null); // Holds the JSON from AI
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- SUPER ADMIN STATE ---
    const [targetRestaurantId, setTargetRestaurantId] = useState('');
    const [restaurantList, setRestaurantList] = useState([]);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // 1. Fetch Restaurants (Only for Super Admin)
    useEffect(() => {
        if (isSuperAdmin) {
            apiClient.get('/api/restaurants/all')
                .then(data => setRestaurantList(data))
                .catch(() => toast.error("Failed to load restaurant list."));
        }
    }, [isSuperAdmin]);

    // 1. Handle File Selection
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    // 2. Send Image to AI
    const handleParse = async () => {
        if (!file) return toast.error("Please select an image first.");
        setIsLoading(true);
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Using apiClient which now handles FormData correctly
            const response = await apiClient.post('/api/menu-import/parse', formData);
            setParsedData(response); // API returns { categories: [...] }
            toast.success("Menu parsed! Please review below.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze menu image.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- HANDLERS FOR UPDATING THE STATE ---

    // Update Main Category Name
    const handleCategoryNameChange = (catIndex, value) => {
        const newData = { ...parsedData };
        newData.categories[catIndex].categoryName = value;
        setParsedData(newData);
    };

    // Update Direct Items (under main category)
    const handleMainItemChange = (catIndex, itemIndex, field, value) => {
        const newData = { ...parsedData };
        newData.categories[catIndex].items[itemIndex][field] = value;
        setParsedData(newData);
    };

    const deleteMainItem = (catIndex, itemIndex) => {
        const newData = { ...parsedData };
        newData.categories[catIndex].items.splice(itemIndex, 1);
        setParsedData(newData);
    };

    // Update Subcategory Name
    const handleSubCategoryNameChange = (catIndex, subIndex, value) => {
        const newData = { ...parsedData };
        newData.categories[catIndex].subCategories[subIndex].name = value;
        setParsedData(newData);
    };

    // Update Subcategory Items
    const handleSubItemChange = (catIndex, subIndex, itemIndex, field, value) => {
        const newData = { ...parsedData };
        newData.categories[catIndex].subCategories[subIndex].items[itemIndex][field] = value;
        setParsedData(newData);
    };

    const deleteSubItem = (catIndex, subIndex, itemIndex) => {
        const newData = { ...parsedData };
        newData.categories[catIndex].subCategories[subIndex].items.splice(itemIndex, 1);
        setParsedData(newData);
    };

    // 4. Final Save to DB
    const handleSaveToDb = async () => {
        if (isSuperAdmin && !targetRestaurantId) {
            return toast.error("Please select a target restaurant.");
        }
        setIsSaving(true);

        // Construct payload with optional target ID
        const payload = {
            menuData: parsedData,
            targetRestaurantId: isSuperAdmin ? targetRestaurantId : null
        };

        try {
            await apiClient.post('/api/menu-import/save', payload);
            toast.success("Menu successfully imported to database!");
            setParsedData(null); // Reset
            setFile(null);
            if(isSuperAdmin) setTargetRestaurantId(''); // Reset selection
        } catch (error) {
            toast.error("Failed to save menu.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>AI Menu Auto-Import</Typography>
            
            <Paper sx={{ p: 4, mb: 4, textAlign: 'center', border: '2px dashed #ccc' }}>

                {/* --- SUPER ADMIN SELECTOR --- */}
                {isSuperAdmin && (
                    <Box sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                        <FormControl fullWidth>
                            <InputLabel>Select Target Restaurant</InputLabel>
                            <Select
                                value={targetRestaurantId}
                                label="Select Target Restaurant"
                                onChange={(e) => setTargetRestaurantId(e.target.value)}
                            >
                                {restaurantList.map((r) => (
                                    <MenuItem key={r.id} value={r.id}>
                                        {r.name} (ID: {r.id})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                <Box sx={{ textAlign: 'center' }}>
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="raised-button-file"
                        type="file"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="raised-button-file">
                        <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                            {file ? file.name : "Select Menu Image"}
                        </Button>
                    </label>
                    <Box sx={{ mt: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleParse} 
                            disabled={!file || isLoading}
                        >
                            {isLoading ? "Analyzing with AI..." : "Upload & Analyze"}
                        </Button>
                    </Box>
                    {isLoading && <CircularProgress sx={{ mt: 2 }} />}
                </Box>
            </Paper>

            {/* --- Review Section --- */}
            {parsedData && (
                <Box>
                    <Typography variant="h5" gutterBottom>Review Extracted Data</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please check prices and spelling before importing.
                    </Typography>

                    {parsedData.categories.map((category, catIndex) => (
                        <Accordion key={catIndex} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <TextField 
                                    label="Main Category Name"
                                    value={category.categoryName} 
                                    onChange={(e) => handleCategoryNameChange(catIndex, e.target.value)}
                                    onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when editing
                                    variant="standard"
                                    sx={{ width: '50%', fontWeight: 'bold' }}
                                />
                            </AccordionSummary>
                            <AccordionDetails>
                                
                                {/* 1. Direct Items Section */}
                                {category.items && category.items.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, pl: 2 }}>Direct Items:</Typography>
                                        <ItemsList 
                                            items={category.items} 
                                            onUpdate={(i, f, v) => handleMainItemChange(catIndex, i, f, v)}
                                            onDelete={(i) => deleteMainItem(catIndex, i)}
                                        />
                                    </Box>
                                )}

                                {/* 2. Subcategories Section */}
                                {category.subCategories && category.subCategories.map((subCat, subIndex) => (
                                    <Box key={subIndex} sx={{ ml: 2, mt: 2, mb: 2, borderLeft: '4px solid #eee', pl: 2, py: 1 }}>
                                        <TextField 
                                            label="Subcategory Name"
                                            value={subCat.name} 
                                            onChange={(e) => handleSubCategoryNameChange(catIndex, subIndex, e.target.value)}
                                            variant="standard"
                                            size="small"
                                            sx={{ mb: 2, width: '40%' }}
                                        />
                                        <ItemsList 
                                            items={subCat.items} 
                                            onUpdate={(i, f, v) => handleSubItemChange(catIndex, subIndex, i, f, v)}
                                            onDelete={(i) => deleteSubItem(catIndex, subIndex, i)}
                                        />
                                    </Box>
                                ))}

                                {(!category.items?.length && !category.subCategories?.length) && (
                                    <Typography color="text.secondary">No items detected in this category.</Typography>
                                )}

                            </AccordionDetails>
                        </Accordion>
                    ))}

                    <Box sx={{ mt: 4, textAlign: 'right' }}>
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large" 
                            startIcon={<SaveIcon />}
                            onClick={handleSaveToDb}
                            disabled={isSaving}
                        >
                            {isSaving ? "Importing..." : "Confirm & Import Menu"}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default MenuImporter;