import React from 'react';
import {
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ViewStream as ViewStreamIcon,
  Palette as PaletteIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Form, FormField } from '../../stores/formBuilderStore';
import ContentTab from './tabs/ContentTab';
import StylesTab from './tabs/StylesTab';
import RecommendationsTab from './tabs/RecommendationsTab';
import SettingsTab from './tabs/SettingsTab';

interface FormBuilderSidebarProps {
  activeTab: 'content' | 'styles' | 'recommendations' | 'settings';
  onTabChange: (tab: 'content' | 'styles' | 'recommendations' | 'settings') => void;
  form: Form | null;
  fields: FormField[];
  onUpdateForm: (updates: Partial<Form>) => void;
  onUpdateFields: (fields: FormField[]) => void;
}

const FormBuilderSidebar: React.FC<FormBuilderSidebarProps> = ({
  activeTab,
  onTabChange,
  form,
  fields,
  onUpdateForm,
  onUpdateFields,
}) => {
  const tabs = [
    { id: 'content', label: 'Contenido', icon: <ViewStreamIcon /> },
    { id: 'styles', label: 'Estilos', icon: <PaletteIcon /> },
    { id: 'recommendations', label: 'Recomendaciones', icon: <TipsAndUpdatesIcon /> },
    { id: 'settings', label: 'Configuración', icon: <SettingsIcon /> },
  ];

  return (
    <Box
      sx={{
        width: 360,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
      }}
    >
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        orientation="vertical"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            alignItems: 'flex-start',
            textAlign: 'left',
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              minHeight: 60,
              px: 2,
            }}
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 'content' && (
          <ContentTab
            form={form}
            fields={fields}
            onUpdateFields={onUpdateFields}
          />
        )}

        {activeTab === 'styles' && (
          <StylesTab form={form} onUpdate={onUpdateForm} />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsTab form={form} fields={fields} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab form={form} onUpdate={onUpdateForm} />
        )}
      </Box>
    </Box>
  );
};

export default FormBuilderSidebar;


