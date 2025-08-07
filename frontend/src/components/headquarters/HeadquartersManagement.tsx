import React, { useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import HeadquartersList from './HeadquartersList';
import HeadquartersForm from './HeadquartersForm';

// Types
interface Headquarters {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  company: {
    id: number;
    name: string;
    nit: string;
  };
  city?: {
    id: number;
    name: string;
    state: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  _count: {
    users: number;
    assets: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface HeadquartersFormData {
  name: string;
  companyId: number;
  description?: string;
  address?: string;
  cityId?: number;
  stateId?: number;
  countryId?: number;
  phone?: string;
  email?: string;
  code?: string;
  autoGenerateCode: boolean;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const HeadquartersManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<Headquarters | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = (message: string, severity: NotificationState['severity'] = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleCreateNew = () => {
    setSelectedHeadquarters(null);
    setViewMode('create');
  };

  const handleEdit = (headquarters: Headquarters) => {
    setSelectedHeadquarters(headquarters);
    setViewMode('edit');
  };

  const handleView = (headquarters: Headquarters) => {
    setSelectedHeadquarters(headquarters);
    setViewMode('view');
  };

  const handleDelete = async (headquarters: Headquarters) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showNotification(`Sede "${headquarters.name}" eliminada exitosamente`);
      setViewMode('list');
    } catch (error) {
      console.error('Error deleting headquarters:', error);
      showNotification('Error al eliminar la sede', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: HeadquartersFormData) => {
    try {
      setLoading(true);
      
      if (viewMode === 'edit' && selectedHeadquarters) {
        // Update existing headquarters
        console.log('Updating headquarters:', { id: selectedHeadquarters.id, ...data });
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Sede "${data.name}" actualizada exitosamente`);
      } else {
        // Create new headquarters
        console.log('Creating new headquarters:', data);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Sede "${data.name}" creada exitosamente`);
      }
      
      setViewMode('list');
      setSelectedHeadquarters(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification(
        viewMode === 'edit' ? 'Error al actualizar la sede' : 'Error al crear la sede',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedHeadquarters(null);
  };

  const prepareFormData = (headquarters: Headquarters): Partial<HeadquartersFormData> => {
    return {
      name: headquarters.name,
      companyId: headquarters.company.id,
      description: headquarters.description || '',
      address: headquarters.address || '',
      phone: headquarters.phone || '',
      email: headquarters.email || '',
      code: headquarters.code,
      cityId: headquarters.city?.id,
      stateId: undefined, // TODO: Get from API
      countryId: undefined, // TODO: Get from API
      autoGenerateCode: false // Since we have existing code
    };
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <HeadquartersForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        );
      
      case 'edit':
        return selectedHeadquarters ? (
          <HeadquartersForm
            initialData={prepareFormData(selectedHeadquarters)}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        ) : null;
      
      case 'view':
        // TODO: Implement headquarters detail view
        return (
          <Box>
            <Alert severity="info">
              Vista de detalles de sede en desarrollo
            </Alert>
          </Box>
        );
      
      default:
        return (
          <HeadquartersList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
          />
        );
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HeadquartersManagement;