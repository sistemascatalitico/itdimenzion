import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, Tooltip, Chip,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, Checkbox, FormControlLabel, TextField, InputAdornment, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, Divider, Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon, ChevronRight as CollapseIcon,
  Add as AddIcon, Edit as EditIcon, Search as SearchIcon,
  Category as CategoryIcon, Folder as GroupIcon, DevicesOther as TypeIcon,
  UnfoldMore as ExpandAllIcon, UnfoldLess as CollapseAllIcon,
  Refresh as RefreshIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import customFieldService from '../../services/customFieldService';
import api from '../../config/api';
import PageHeader from '../common/PageHeader';

interface FieldDef {
  id: number; key: string; label: string; type: string; description?: string;
  status: string; config?: any; CustomFieldOption?: any[];
}

interface Binding {
  id: number; scope: string; scopeId: number; fieldId: number;
  isEnabled: boolean; isVisible: boolean; isRequired: boolean;
  displayOrder: number; section?: string; status: string;
  CustomFieldDef?: FieldDef;
}

interface AssetType { id: number; name: string; label?: string; groupId: number; }
interface AssetGroup { id: number; name: string; label?: string; categoryId: number; }
interface AssetCategory { id: number; name: string; label?: string; status: string; }

interface HierarchyNode {
  category: AssetCategory;
  groups: {
    group: AssetGroup;
    fields: Binding[];
    types: { type: AssetType; fields: Binding[] }[];
  }[];
  fields: Binding[];
}

const SCOPE_COLORS: Record<string, string> = {
  CATEGORY: '#1565C0',
  GROUP: '#2E7D32',
  TYPE: '#E65100',
};

const CATEGORY_COLORS = [
  '#1565C0', '#C62828', '#2E7D32', '#AD1457', '#EF6C00',
  '#6A1B9A', '#00838F', '#4E342E',
];

const SECTIONS = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'connectivity', label: 'Conectividad' },
  { value: 'display', label: 'Display' },
  { value: 'technical', label: 'Técnico' },
  { value: 'identification', label: 'Identificación' },
  { value: 'dimensions', label: 'Dimensiones' },
  { value: 'mechanical', label: 'Mecánico' },
  { value: 'electrical', label: 'Eléctrico' },
  { value: 'other', label: 'Otro' },
];

const TYPE_ICONS: Record<string, string> = {
  TEXT: 'Aa', TEXTAREA: 'Tx', NUMBER: '#', DECIMAL: '.0',
  CAPACITY: 'GB', SELECT: '▼', MULTISELECT: '☰', CHECKBOX: '☑',
  DATE: '📅', DATETIME: '🕐', URL: '🔗', EMAIL: '@', PHONE: '☎', COLOR: '🎨',
};

const FieldMappingManager: React.FC = () => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    scope: string;
    scopeId: number;
    entityName: string;
    parentPath: string;
  } | null>(null);
  const [editFields, setEditFields] = useState<Map<number, { bound: boolean; isRequired: boolean; section: string; displayOrder: number }>>(new Map());
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, grpRes, typRes, bindRes, fieldRes] = await Promise.all([
        api.get('/asset-categories'),
        api.get('/asset-groups'),
        api.get('/asset-types'),
        customFieldService.getBindings(),
        customFieldService.getFields(),
      ]);
      setCategories((catRes.data?.data || catRes.data || []).filter((c: any) => c.status === 'ACTIVE'));
      setGroups(grpRes.data?.data || grpRes.data || []);
      setTypes(typRes.data?.data || typRes.data || []);
      const bindList = Array.isArray(bindRes?.data) ? bindRes.data : Array.isArray(bindRes) ? bindRes : [];
      setBindings(bindList.filter((b: any) => b.status === 'ACTIVE'));
      const fList = fieldRes?.data || fieldRes || [];
      setFieldDefs(Array.isArray(fList) ? fList.filter((f: any) => f.status === 'ACTIVE') : []);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error cargando datos: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const hierarchy: HierarchyNode[] = useMemo(() => {
    return categories.map(cat => {
      const catGroups = groups.filter(g => g.categoryId === cat.id);
      return {
        category: cat,
        fields: bindings.filter(b => b.scope === 'CATEGORY' && b.scopeId === cat.id),
        groups: catGroups.map(grp => {
          const grpTypes = types.filter(t => t.groupId === grp.id);
          return {
            group: grp,
            fields: bindings.filter(b => b.scope === 'GROUP' && b.scopeId === grp.id),
            types: grpTypes.map(typ => ({
              type: typ,
              fields: bindings.filter(b => b.scope === 'TYPE' && b.scopeId === typ.id),
            })),
          };
        }),
      };
    }).filter(node => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const catName = (node.category.label || node.category.name).toLowerCase();
      if (catName.includes(term)) return true;
      return node.groups.some(g => {
        const gName = (g.group.label || g.group.name).toLowerCase();
        if (gName.includes(term)) return true;
        return g.types.some(t => (t.type.label || t.type.name).toLowerCase().includes(term));
      });
    });
  }, [categories, groups, types, bindings, searchTerm]);

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    hierarchy.forEach(node => {
      all.add(`cat-${node.category.id}`);
      node.groups.forEach(g => all.add(`grp-${g.group.id}`));
    });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  const openFieldEditor = (scope: string, scopeId: number, entityName: string, parentPath: string) => {
    const entityBindings = bindings.filter(b => b.scope === scope && b.scopeId === scopeId && b.status === 'ACTIVE');
    const map = new Map<number, { bound: boolean; isRequired: boolean; section: string; displayOrder: number }>();
    fieldDefs.forEach(f => {
      const existing = entityBindings.find(b => b.fieldId === f.id);
      map.set(f.id, {
        bound: !!existing && existing.isEnabled,
        isRequired: existing?.isRequired ?? false,
        section: existing?.section || 'technical',
        displayOrder: existing?.displayOrder ?? 0,
      });
    });
    setEditFields(map);
    setEditDialog({ open: true, scope, scopeId, entityName, parentPath });
  };

  const handleSaveFields = async () => {
    if (!editDialog) return;
    try {
      setSaving(true);
      const { scope, scopeId } = editDialog;
      const currentBindings = bindings.filter(b => b.scope === scope && b.scopeId === scopeId);

      for (const [fieldId, config] of editFields.entries()) {
        const existing = currentBindings.find(b => b.fieldId === fieldId);

        if (config.bound && !existing) {
          await customFieldService.createBinding({
            scope, scopeId, fieldId,
            isRequired: config.isRequired,
            isVisible: true, isEnabled: true,
            section: config.section,
            displayOrder: config.displayOrder,
          });
        } else if (config.bound && existing) {
          if (existing.isRequired !== config.isRequired || existing.section !== config.section || existing.displayOrder !== config.displayOrder) {
            await customFieldService.updateBinding(existing.id, {
              isRequired: config.isRequired,
              section: config.section,
              displayOrder: config.displayOrder,
            });
          }
        } else if (!config.bound && existing && existing.isEnabled) {
          await customFieldService.deleteBinding(existing.id);
        }
      }

      setMessage({ type: 'success', text: `Campos actualizados para ${editDialog.entityName}` });
      setEditDialog(null);
      loadAll();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const FieldChips: React.FC<{ fields: Binding[]; scope: string }> = ({ fields, scope }) => {
    if (fields.length === 0) return (
      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', ml: 1 }}>
        Sin campos dinámicos
      </Typography>
    );
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
        {fields.map(b => {
          const def = b.CustomFieldDef;
          if (!def) return null;
          const icon = TYPE_ICONS[def.type] || '?';
          return (
            <Tooltip key={b.id} title={`${def.key} (${def.type}) | Sección: ${b.section || 'technical'} | ${b.isRequired ? 'Obligatorio' : 'Opcional'}`}>
              <Chip
                size="small"
                label={`${icon} ${def.label}`}
                sx={{
                  fontSize: '0.7rem', height: 24,
                  borderColor: b.isRequired ? '#E53935' : SCOPE_COLORS[scope] || '#666',
                  borderWidth: b.isRequired ? 2 : 1,
                  color: SCOPE_COLORS[scope] || '#666',
                }}
                variant="outlined"
              />
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  const EntityRow: React.FC<{
    icon: React.ReactNode; name: string; color: string;
    fieldCount: number; inheritedCount?: number;
    level: number; expandKey?: string; hasChildren?: boolean;
    onEdit: () => void;
  }> = ({ icon, name, color, fieldCount, inheritedCount, level, expandKey, hasChildren, onEdit }) => {
    const isExpanded = expandKey ? expanded.has(expandKey) : false;
    return (
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, py: 0.8, px: 2,
        pl: 2 + level * 3,
        '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        cursor: hasChildren ? 'pointer' : 'default',
      }}
        onClick={() => expandKey && hasChildren && toggleExpand(expandKey)}
      >
        {hasChildren ? (
          <IconButton size="small" sx={{ p: 0.3 }}>
            {isExpanded ? <ExpandIcon sx={{ color }} /> : <CollapseIcon sx={{ color }} />}
          </IconButton>
        ) : <Box sx={{ width: 28 }} />}

        <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography variant="body2" sx={{ fontWeight: level === 0 ? 700 : level === 1 ? 600 : 400, color, minWidth: 120 }}>
          {name}
        </Typography>

        <Badge badgeContent={fieldCount} color={fieldCount > 0 ? 'primary' : 'default'} sx={{ mx: 1 }}>
          <Box />
        </Badge>
        {inheritedCount !== undefined && inheritedCount > 0 && (
          <Chip label={`+${inheritedCount} heredados`} size="small" variant="outlined"
            sx={{ fontSize: '0.65rem', height: 20, color: 'text.secondary' }} />
        )}

        <Box sx={{ flex: 1 }} />
        <Tooltip title={`Editar campos de ${name}`}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}
            sx={{ color, '&:hover': { backgroundColor: `${color}15` } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="400px"><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Mapeo de Campos por Entidad"
        subtitle="Selecciona una categoría, grupo o tipo y configura qué campos dinámicos aparecerán en su formulario de creación"
      />

      {message && <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Buscar categoría, grupo o tipo..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} sx={{ minWidth: 280 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <Button size="small" startIcon={<ExpandAllIcon />} onClick={expandAll} variant="outlined"
          sx={{ borderColor: '#FF6B6B', color: '#FF6B6B' }}>Expandir</Button>
        <Button size="small" startIcon={<CollapseAllIcon />} onClick={collapseAll} variant="outlined"
          sx={{ borderColor: '#FF6B6B', color: '#FF6B6B' }}>Colapsar</Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<RefreshIcon />} onClick={loadAll} variant="outlined"
          sx={{ borderColor: '#FF6B6B', color: '#FF6B6B' }}>Actualizar</Button>
        <Chip label={`${bindings.length} mapeos`} size="small" color="primary" />
        <Chip label={`${fieldDefs.length} campos`} size="small" variant="outlined" />
      </Box>

      {/* Hierarchy Tree */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
        {hierarchy.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchTerm ? 'No se encontraron resultados' : 'No hay categorías registradas'}
            </Typography>
          </Box>
        ) : hierarchy.map((node, catIdx) => {
          const catKey = `cat-${node.category.id}`;
          const catColor = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];
          const catName = node.category.label || node.category.name;
          const totalGroupFields = node.groups.reduce((s, g) => s + g.fields.length, 0);
          const totalTypeFields = node.groups.reduce((s, g) => s + g.types.reduce((s2, t) => s2 + t.fields.length, 0), 0);

          return (
            <Box key={node.category.id}>
              {/* Category Header */}
              <Box sx={{ backgroundColor: `${catColor}08`, borderLeft: `4px solid ${catColor}` }}>
                <EntityRow
                  icon={<CategoryIcon />}
                  name={catName}
                  color={catColor}
                  fieldCount={node.fields.length}
                  level={0}
                  expandKey={catKey}
                  hasChildren={node.groups.length > 0}
                  onEdit={() => openFieldEditor('CATEGORY', node.category.id, catName, '')}
                />
                {/* Category fields chips */}
                {node.fields.length > 0 && (
                  <Box sx={{ pl: 9, pb: 1 }}>
                    <FieldChips fields={node.fields} scope="CATEGORY" />
                  </Box>
                )}
              </Box>

              {/* Groups */}
              <Collapse in={expanded.has(catKey)}>
                {node.groups.map(grpNode => {
                  const grpKey = `grp-${grpNode.group.id}`;
                  const grpName = grpNode.group.label || grpNode.group.name;
                  return (
                    <Box key={grpNode.group.id} sx={{ borderLeft: `4px solid ${catColor}20` }}>
                      <EntityRow
                        icon={<GroupIcon />}
                        name={grpName}
                        color="#2E7D32"
                        fieldCount={grpNode.fields.length}
                        inheritedCount={node.fields.length}
                        level={1}
                        expandKey={grpKey}
                        hasChildren={grpNode.types.length > 0}
                        onEdit={() => openFieldEditor('GROUP', grpNode.group.id, grpName, catName)}
                      />
                      {grpNode.fields.length > 0 && (
                        <Box sx={{ pl: 12, pb: 1 }}>
                          <FieldChips fields={grpNode.fields} scope="GROUP" />
                        </Box>
                      )}

                      {/* Types */}
                      <Collapse in={expanded.has(grpKey)}>
                        {grpNode.types.map(typNode => {
                          const typName = typNode.type.label || typNode.type.name;
                          return (
                            <Box key={typNode.type.id}>
                              <EntityRow
                                icon={<TypeIcon />}
                                name={typName}
                                color="#E65100"
                                fieldCount={typNode.fields.length}
                                inheritedCount={node.fields.length + grpNode.fields.length}
                                level={2}
                                onEdit={() => openFieldEditor('TYPE', typNode.type.id, typName, `${catName} > ${grpName}`)}
                              />
                              {typNode.fields.length > 0 && (
                                <Box sx={{ pl: 15, pb: 1 }}>
                                  <FieldChips fields={typNode.fields} scope="TYPE" />
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                        {grpNode.types.length === 0 && (
                          <Typography variant="caption" sx={{ pl: 12, py: 1, display: 'block', color: 'text.disabled' }}>
                            Sin tipos registrados
                          </Typography>
                        )}
                      </Collapse>
                    </Box>
                  );
                })}
                {node.groups.length === 0 && (
                  <Typography variant="caption" sx={{ pl: 9, py: 1, display: 'block', color: 'text.disabled' }}>
                    Sin grupos registrados
                  </Typography>
                )}
              </Collapse>
              <Divider />
            </Box>
          );
        })}
      </Card>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Leyenda:</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CategoryIcon sx={{ fontSize: 16, color: '#1565C0' }} />
          <Typography variant="caption">Categoría</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <GroupIcon sx={{ fontSize: 16, color: '#2E7D32' }} />
          <Typography variant="caption">Grupo</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TypeIcon sx={{ fontSize: 16, color: '#E65100' }} />
          <Typography variant="caption">Tipo</Typography>
        </Box>
        <Chip label="+N heredados" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
        <Typography variant="caption" color="text.secondary">= campos que vienen del nivel superior</Typography>
      </Box>

      {/* Edit Fields Dialog */}
      {editDialog && (
        <Dialog open={editDialog.open} onClose={() => setEditDialog(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, borderBottom: '3px solid #FF6B6B' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Campos de: {editDialog.entityName}
              </Typography>
              {editDialog.parentPath && (
                <Typography variant="caption" color="text.secondary">{editDialog.parentPath}</Typography>
              )}
              <Chip label={editDialog.scope === 'CATEGORY' ? 'Categoría' : editDialog.scope === 'GROUP' ? 'Grupo' : 'Tipo'}
                size="small" sx={{ ml: 1 }}
                color={editDialog.scope === 'CATEGORY' ? 'info' : editDialog.scope === 'GROUP' ? 'success' : 'warning'} />
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            {editDialog.scope !== 'CATEGORY' && (
              <Alert severity="info" sx={{ mb: 2 }} icon={false}>
                <Typography variant="caption">
                  Los campos heredados de niveles superiores no se muestran aquí. Solo configura los campos propios de este{' '}
                  {editDialog.scope === 'GROUP' ? 'grupo' : 'tipo'}.
                </Typography>
              </Alert>
            )}

            {fieldDefs.length === 0 ? (
              <Alert severity="warning">
                No hay campos personalizados creados. Ve a "Campos Personalizados" para crear campos primero.
              </Alert>
            ) : (
              <Box>
                {fieldDefs.map(field => {
                  const config = editFields.get(field.id);
                  if (!config) return null;
                  const icon = TYPE_ICONS[field.type] || '?';
                  return (
                    <Card key={field.id} sx={{
                      mb: 1.5, borderRadius: 1, border: config.bound ? '2px solid #FF6B6B' : '1px solid #e0e0e0',
                      backgroundColor: config.bound ? 'rgba(255, 107, 107, 0.03)' : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            checked={config.bound}
                            onChange={(e) => {
                              const next = new Map(editFields);
                              next.set(field.id, { ...config, bound: e.target.checked });
                              setEditFields(next);
                            }}
                            sx={{ color: '#FF6B6B', '&.Mui-checked': { color: '#FF6B6B' } }}
                          />
                          <Chip label={`${icon} ${field.type}`} size="small" variant="outlined" sx={{ minWidth: 70 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                              {field.key}
                              {field.description && ` — ${field.description}`}
                            </Typography>
                          </Box>
                        </Box>

                        {config.bound && (
                          <Box sx={{ display: 'flex', gap: 2, mt: 1, ml: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Switch size="small" checked={config.isRequired} color="error"
                                  onChange={(e) => {
                                    const next = new Map(editFields);
                                    next.set(field.id, { ...config, isRequired: e.target.checked });
                                    setEditFields(next);
                                  }} />
                              }
                              label={<Typography variant="caption">Obligatorio</Typography>}
                            />
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                              <InputLabel sx={{ fontSize: '0.75rem' }}>Sección</InputLabel>
                              <Select value={config.section} label="Sección"
                                sx={{ fontSize: '0.75rem', height: 32 }}
                                onChange={(e) => {
                                  const next = new Map(editFields);
                                  next.set(field.id, { ...config, section: e.target.value as string });
                                  setEditFields(next);
                                }}>
                                {SECTIONS.map(s => <MenuItem key={s.value} value={s.value}><Typography variant="caption">{s.label}</Typography></MenuItem>)}
                              </Select>
                            </FormControl>
                            <TextField size="small" type="number" label="Orden" value={config.displayOrder}
                              sx={{ width: 80, '& input': { fontSize: '0.75rem' } }}
                              onChange={(e) => {
                                const next = new Map(editFields);
                                next.set(field.id, { ...config, displayOrder: Number(e.target.value) });
                                setEditFields(next);
                              }} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {Array.from(editFields.values()).filter(v => v.bound).length} campos seleccionados
            </Typography>
            <Button onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveFields} disabled={saving}
              sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #FF5252 0%, #FF7043 100%)' } }}>
              {saving ? <CircularProgress size={20} /> : 'Guardar Campos'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default FieldMappingManager;
