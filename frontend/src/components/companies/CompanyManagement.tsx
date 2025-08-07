import React, { useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import CompanyList from './CompanyList';
import CompanyForm from './CompanyForm';

// Types
interface Company {
  id: number;
  name: string;
  nit: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status: 'ACTIVE' | 'INACTIVE';
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
  headquarters: Array<{
    id: number;
    name: string;
  }>;
  _count: {
    users: number;
    assets: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CompanyFormData {
  name: string;
  nit: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  cityId?: number;
  stateId?: number;
  countryId?: number;
  website?: string;
  headquarters: Array<{
    id?: number;
    name: string;
    description?: string;
    address?: string;
    cityId?: number;
    stateId?: number;
    countryId?: number;
    phone?: string;
    email?: string;
    code?: string;
  }>;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const CompanyManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
    setSelectedCompany(null);
    setViewMode('create');
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setViewMode('edit');
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setViewMode('view');
  };

  const handleDelete = async (company: Company) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showNotification(`Empresa "${company.name}" eliminada exitosamente`);
      setViewMode('list');
    } catch (error) {
      console.error('Error deleting company:', error);
      showNotification('Error al eliminar la empresa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: CompanyFormData) => {
    try {
      setLoading(true);
      
      if (viewMode === 'edit' && selectedCompany) {
        // Update existing company
        console.log('Updating company:', { id: selectedCompany.id, ...data });
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Empresa "${data.name}" actualizada exitosamente`);
      } else {
        // Create new company
        console.log('Creating new company:', data);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Empresa "${data.name}" creada exitosamente`);
      }
      
      setViewMode('list');
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification(
        viewMode === 'edit' ? 'Error al actualizar la empresa' : 'Error al crear la empresa',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedCompany(null);
  };

  const prepareFormData = (company: Company): Partial<CompanyFormData> => {
    return {
      name: company.name,
      nit: company.nit,
      description: company.description || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      website: company.website || '',
      cityId: company.city?.id,
      stateId: company.city?.state ? undefined : undefined, // TODO: Get from API
      countryId: company.city?.state.country ? undefined : undefined, // TODO: Get from API
      headquarters: company.headquarters.map(hq => ({
        id: hq.id,
        name: hq.name,
        description: '',
        address: '',
        phone: '',
        email: ''
      }))
    };
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <CompanyForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        );
      
      case 'edit':
        return selectedCompany ? (
          <CompanyForm
            initialData={prepareFormData(selectedCompany)}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        ) : null;
      
      case 'view':
        // TODO: Implement company detail view
        return (
          <Box>
            <Alert severity="info">
              Vista de detalles de empresa en desarrollo
            </Alert>
          </Box>
        );
      
      default:
        return (
          <CompanyList
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

export default CompanyManagement;