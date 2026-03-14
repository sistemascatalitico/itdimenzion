import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
    Tabs,
    Tab,
    Box,
    Typography,
    IconButton,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Paper,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    ViewColumn as ViewColumnIcon,
    ViewWeek as ViewWeekIcon,
} from '@mui/icons-material';
import { FormField } from '../../stores/formBuilderStore';
import ConditionalLogicBuilder, { ConditionalLogic } from './ConditionalLogicBuilder';

interface QuickEditModalProps {
    open: boolean;
    field: FormField | null;
    allFields?: FormField[];
    onClose: () => void;
    onSave: (updatedField: FormField) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`quick-edit-tabpanel-${index}`}
            aria-labelledby={`quick-edit-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    );
};

const QuickEditModal: React.FC<QuickEditModalProps> = ({
    open,
    field,
    allFields = [],
    onClose,
    onSave,
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [editedField, setEditedField] = useState<FormField | null>(null);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const [conditionalLogic, setConditionalLogic] = useState<ConditionalLogic | null>(null);

    useEffect(() => {
        if (field) {
            setEditedField({ ...field });
            // Parse options if they exist and are appropriate for the field type
            if (['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(field.fieldType)) {
                try {
                    const parsedOptions = typeof field.options === 'string'
                        ? JSON.parse(field.options)
                        : field.options || [];
                    setOptions(Array.isArray(parsedOptions) ? parsedOptions : []);
                } catch (e) {
                    setOptions([]);
                }
            } else {
                setOptions([]);
            }
            // Parse conditional logic if it exists
            try {
                const parsedLogic = typeof field.conditionalLogic === 'string'
                    ? JSON.parse(field.conditionalLogic)
                    : field.conditionalLogic || null;
                setConditionalLogic(parsedLogic);
            } catch (e) {
                setConditionalLogic(null);
            }
        }
    }, [field]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleChange = (key: keyof FormField, value: any) => {
        if (editedField) {
            setEditedField({ ...editedField, [key]: value });
        }
    };

    const handleOptionChange = (index: number, key: 'label' | 'value', value: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [key]: value };
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        setOptions([...options, { label: `Opción ${options.length + 1}`, value: `opcion_${options.length + 1}` }]);
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSave = () => {
        if (editedField) {
            const finalField = { ...editedField };
            if (['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(finalField.fieldType)) {
                finalField.options = options; // Store as object, backend/store handles serialization if needed
            }
            // Save conditional logic
            finalField.conditionalLogic = conditionalLogic;
            onSave(finalField);
        }
    };

    if (!editedField) return null;

    const showOptionsTab = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(editedField.fieldType);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Editar Campo: {editedField.fieldType}
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="field edit tabs" variant="scrollable" scrollButtons="auto">
                        <Tab label="General" />
                        <Tab label="Validación" />
                        <Tab label="Layout" />
                        {showOptionsTab && <Tab label="Opciones" />}
                        <Tab label="Lógica" />
                        <Tab label="Avanzado" />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Etiqueta del Campo"
                                value={editedField.fieldLabel}
                                onChange={(e) => handleChange('fieldLabel', e.target.value)}
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Placeholder"
                                value={editedField.placeholder || ''}
                                onChange={(e) => handleChange('placeholder', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Texto de Ayuda"
                                value={editedField.helpText || ''}
                                onChange={(e) => handleChange('helpText', e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editedField.isRequired}
                                        onChange={(e) => handleChange('isRequired', e.target.checked)}
                                    />
                                }
                                label="Obligatorio"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editedField.isReadonly}
                                        onChange={(e) => handleChange('isReadonly', e.target.checked)}
                                    />
                                }
                                label="Solo Lectura"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editedField.isHidden}
                                        onChange={(e) => handleChange('isHidden', e.target.checked)}
                                    />
                                }
                                label="Oculto"
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Posición en el Formulario
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Selecciona cómo se mostrará este campo en el formulario
                        </Typography>

                        <ToggleButtonGroup
                            value={editedField.columnPosition}
                            exclusive
                            onChange={(e, newValue) => {
                                if (newValue !== null) {
                                    handleChange('columnPosition', newValue);
                                }
                            }}
                            aria-label="column position"
                            fullWidth
                            sx={{ mb: 3 }}
                        >
                            <ToggleButton value="FULL" aria-label="full width">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                                    <ViewWeekIcon sx={{ mb: 0.5 }} />
                                    <Typography variant="caption">Columna Completa</Typography>
                                </Box>
                            </ToggleButton>
                            <ToggleButton value="LEFT" aria-label="left column">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                                    <ViewColumnIcon sx={{ mb: 0.5 }} />
                                    <Typography variant="caption">Columna Izquierda</Typography>
                                </Box>
                            </ToggleButton>
                            <ToggleButton value="RIGHT" aria-label="right column">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                                    <ViewColumnIcon sx={{ mb: 0.5, transform: 'scaleX(-1)' }} />
                                    <Typography variant="caption">Columna Derecha</Typography>
                                </Box>
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                            Vista Previa
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                bgcolor: 'grey.50',
                                minHeight: 100,
                                display: 'flex',
                                gap: 1
                            }}
                        >
                            {editedField.columnPosition === 'FULL' && (
                                <Box sx={{
                                    width: '100%',
                                    bgcolor: 'primary.main',
                                    borderRadius: 1,
                                    p: 2,
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    {editedField.fieldLabel || 'Campo'}
                                </Box>
                            )}
                            {editedField.columnPosition === 'LEFT' && (
                                <>
                                    <Box sx={{
                                        width: '50%',
                                        bgcolor: 'primary.main',
                                        borderRadius: 1,
                                        p: 2,
                                        color: 'white',
                                        textAlign: 'center'
                                    }}>
                                        {editedField.fieldLabel || 'Campo'}
                                    </Box>
                                    <Box sx={{
                                        width: '50%',
                                        bgcolor: 'grey.300',
                                        borderRadius: 1,
                                        p: 2,
                                        color: 'grey.600',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        Otro campo
                                    </Box>
                                </>
                            )}
                            {editedField.columnPosition === 'RIGHT' && (
                                <>
                                    <Box sx={{
                                        width: '50%',
                                        bgcolor: 'grey.300',
                                        borderRadius: 1,
                                        p: 2,
                                        color: 'grey.600',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        Otro campo
                                    </Box>
                                    <Box sx={{
                                        width: '50%',
                                        bgcolor: 'primary.main',
                                        borderRadius: 1,
                                        p: 2,
                                        color: 'white',
                                        textAlign: 'center'
                                    }}>
                                        {editedField.fieldLabel || 'Campo'}
                                    </Box>
                                </>
                            )}
                        </Paper>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                            💡 Tip: Usa columnas izquierda/derecha para aprovechar mejor el espacio horizontal del formulario
                        </Typography>
                    </Box>
                </TabPanel>

                {showOptionsTab && (
                    <TabPanel value={activeTab} index={3}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">Opciones de Selección</Typography>
                            <Button startIcon={<AddIcon />} size="small" onClick={handleAddOption}>
                                Agregar
                            </Button>
                        </Box>
                        {options.map((option, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    label="Etiqueta"
                                    value={option.label}
                                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    size="small"
                                    label="Valor"
                                    value={option.value}
                                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <IconButton size="small" color="error" onClick={() => handleRemoveOption(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        {options.length === 0 && (
                            <Typography variant="body2" color="text.secondary" align="center">
                                No hay opciones definidas.
                            </Typography>
                        )}
                    </TabPanel>
                )}

                <TabPanel value={activeTab} index={showOptionsTab ? 4 : 3}>
                    <ConditionalLogicBuilder
                        field={editedField}
                        allFields={allFields}
                        initialLogic={conditionalLogic}
                        onChange={setConditionalLogic}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={showOptionsTab ? 5 : 4}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Clave del Campo (ID interno)"
                                value={editedField.fieldKey}
                                disabled
                                helperText="Generado automáticamente"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                                Configuración avanzada de auto-llenado estará disponible próximamente.
                            </Typography>
                        </Grid>
                    </Grid>
                </TabPanel>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained">
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickEditModal;
