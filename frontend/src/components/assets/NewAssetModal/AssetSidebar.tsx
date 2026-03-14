import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Circle,
  Info as InfoIcon,
  Place as PlaceIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  Memory as MemoryIcon,
  DeveloperBoard as DeveloperBoardIcon,
  Apps as AppsIcon,
  Wifi as WifiIcon,
  Folder as FolderIcon,
  Description as DocumentsIcon,
  Link as ConnectionsIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
  SupportAgent as SupportAgentIcon,
  ConfirmationNumber as TicketsIcon,
  BuildCircle as MaintenanceIcon,
  ReportProblem as ProblemIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as ImpactIcon,
  Assessment as MetricsIcon,
} from '@mui/icons-material';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  defaultExpanded?: boolean;
}

interface AssetSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  badges?: Record<string, number>;
  compact?: boolean;
  assetId?: number;
}

// Estructura de secciones agrupadas
const assetSections: SidebarGroup[] = [
  {
    id: 'general',
    label: 'General',
    icon: <InfoIcon />,
    defaultExpanded: true,
    items: [
      { id: 'info', label: 'Información', icon: <InfoIcon /> },
      { id: 'location', label: 'Ubicación', icon: <PlaceIcon /> },
      { id: 'assignment', label: 'Asignación', icon: <PersonIcon /> },
    ],
  },
  {
    id: 'technical',
    label: 'Técnico',
    icon: <BuildIcon />,
    defaultExpanded: false,
    items: [
      { id: 'specs', label: 'Especificaciones', icon: <MemoryIcon />, disabled: true },
      { id: 'components', label: 'Componentes', icon: <DeveloperBoardIcon />, disabled: true },
      { id: 'software', label: 'Software', icon: <AppsIcon />, disabled: true },
      { id: 'network', label: 'Red', icon: <WifiIcon />, disabled: true },
    ],
  },
  {
    id: 'management',
    label: 'Gestión',
    icon: <FolderIcon />,
    defaultExpanded: true,
    items: [
      { id: 'documents', label: 'Documentos', icon: <DocumentsIcon /> },
      { id: 'connections', label: 'Conexiones', icon: <ConnectionsIcon /> },
      { id: 'history', label: 'Historial', icon: <HistoryIcon /> },
      { id: 'contracts', label: 'Contratos', icon: <ReceiptIcon />, disabled: true },
    ],
  },
  {
    id: 'support',
    label: 'Soporte',
    icon: <SupportAgentIcon />,
    defaultExpanded: false,
    items: [
      { id: 'tickets', label: 'Tickets', icon: <TicketsIcon />, disabled: true },
      { id: 'maintenance', label: 'Mantenimiento', icon: <MaintenanceIcon />, disabled: true },
      { id: 'problems', label: 'Problemas', icon: <ProblemIcon />, disabled: true },
    ],
  },
  {
    id: 'analytics',
    label: 'Análisis',
    icon: <AnalyticsIcon />,
    defaultExpanded: false,
    items: [
      { id: 'impact', label: 'Análisis de Impacto', icon: <ImpactIcon />, disabled: true },
      { id: 'metrics', label: 'Métricas', icon: <MetricsIcon />, disabled: true },
    ],
  },
];

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  activeSection,
  onSectionChange,
  badges = {},
  compact = false,
}) => {
  // Cargar estado de grupos expandidos desde localStorage
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('assetSidebarExpandedGroups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      } catch {
        // Si hay error, usar defaults
      }
    }
    // Usar defaults si no hay guardado
    return new Set(
      assetSections.filter(s => s.defaultExpanded).map(s => s.id)
    );
  });

  // Guardar estado cuando cambie
  useEffect(() => {
    localStorage.setItem(
      'assetSidebarExpandedGroups',
      JSON.stringify(Array.from(expandedGroups))
    );
  }, [expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <Box
      sx={{
        width: compact ? 64 : 280,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflowY: 'auto',
        transition: 'width 0.3s ease',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
        },
      }}
    >
      <List disablePadding>
        {assetSections.map((group, groupIndex) => {
          const isGroupExpanded = expandedGroups.has(group.id) || compact;

          return (
            <React.Fragment key={group.id}>
              {/* Grupo Header */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => !compact && toggleGroup(group.id)}
                  sx={{
                    py: 1.5,
                    px: compact ? 1 : 2,
                    bgcolor: 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: compact ? 'auto' : 40,
                      color: 'text.secondary',
                    }}
                  >
                    {group.icon}
                  </ListItemIcon>
                  {!compact && (
                    <>
                      <ListItemText
                        primary={group.label}
                        primaryTypographyProps={{
                          variant: 'subtitle2',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      />
                      {isGroupExpanded ? <ExpandLess /> : <ExpandMore />}
                    </>
                  )}
                </ListItemButton>
              </ListItem>

              {/* Items del Grupo */}
              <Collapse
                in={isGroupExpanded}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    const badgeCount = badges[item.id];

                    return (
                      <Tooltip
                        key={item.id}
                        title={compact ? item.label : ''}
                        placement="right"
                        arrow
                      >
                        <ListItem disablePadding>
                          <ListItemButton
                            selected={isActive}
                            onClick={() => !item.disabled && onSectionChange(item.id)}
                            disabled={item.disabled}
                            sx={{
                              pl: compact ? 2 : 4,
                              py: 1,
                              minHeight: 48,
                              '&.Mui-selected': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderLeft: '3px solid',
                                borderColor: 'primary.main',
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: 'primary.contrastText',
                                },
                                '& .MuiListItemText-primary': {
                                  fontWeight: 600,
                                },
                              },
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                              '&.Mui-disabled': {
                                opacity: 0.5,
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: compact ? 'auto' : 40,
                                color: isActive ? 'inherit' : 'text.secondary',
                              }}
                            >
                              <Badge
                                badgeContent={badgeCount}
                                color="error"
                                invisible={!badgeCount}
                                max={99}
                              >
                                {isActive ? (
                                  <Circle sx={{ fontSize: 8 }} />
                                ) : (
                                  item.icon
                                )}
                              </Badge>
                            </ListItemIcon>
                            {!compact && (
                              <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  fontSize: '0.875rem',
                                }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      </Tooltip>
                    );
                  })}
                </List>
              </Collapse>

              {groupIndex < assetSections.length - 1 && (
                <Divider sx={{ my: 0.5 }} />
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default AssetSidebar;







