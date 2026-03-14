import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  History as HistoryIcon,
  Link as ConnectionsIcon,
  Description as DocumentsIcon,
  Support as TicketsIcon,
  MenuBook as KnowledgeBaseIcon,
} from '@mui/icons-material';
import AssetHistoryTab from './AssetHistoryTab';
import AssetConnectionsTab from './AssetConnectionsTab';
import AssetDocumentsTab from './AssetDocumentsTab';
import AssetTicketsTab from './AssetTicketsTab';
import AssetKnowledgeBaseTab from './AssetKnowledgeBaseTab';

interface AssetSideTabsProps {
  assetId: number;
  mode?: 'create' | 'edit';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`asset-tabpanel-${index}`}
      aria-labelledby={`asset-tab-${index}`}
      style={{ width: '100%', height: '100%' }}
    >
      {value === index && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
};

const AssetSideTabs: React.FC<AssetSideTabsProps> = ({ assetId, mode = 'edit' }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Solo mostrar en modo edición y si hay assetId
  if (mode !== 'edit' || !assetId) {
    return null;
  }

  const tabs = [
    { label: 'Historial', icon: <HistoryIcon />, id: 'history' },
    { label: 'Conexiones', icon: <ConnectionsIcon />, id: 'connections' },
    { label: 'Documentos', icon: <DocumentsIcon />, id: 'documents' },
    { label: 'Tickets', icon: <TicketsIcon />, id: 'tickets' },
    { label: 'Base de Conocimiento', icon: <KnowledgeBaseIcon />, id: 'knowledge-base' },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
      }}
    >
      {/* Pestañas laterales (verticales) */}
      <Paper
        elevation={0}
        sx={{
          width: 200,
          minWidth: 200,
          borderRight: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              left: 0,
              width: 3,
            },
            '& .MuiTab-root': {
              minHeight: 64,
              textAlign: 'left',
              alignItems: 'flex-start',
              paddingLeft: 3,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 107, 107, 0.08)',
                color: '#FF6B6B',
              },
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
              id={`asset-tab-${index}`}
              aria-controls={`asset-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Contenido de las pestañas */}
      <Box sx={{ flex: 1, overflow: 'auto', height: '100%' }}>
        <TabPanel value={activeTab} index={0}>
          <AssetHistoryTab assetId={assetId} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <AssetConnectionsTab assetId={assetId} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AssetDocumentsTab assetId={assetId} />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <AssetTicketsTab assetId={assetId} />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <AssetKnowledgeBaseTab assetId={assetId} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default AssetSideTabs;


