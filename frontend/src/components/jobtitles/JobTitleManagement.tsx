import React, { useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import JobTitleList from './JobTitleList';
import JobTitleForm from './JobTitleForm';

// Types
interface JobTitle {
  id: number;
  name: string;
  description?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  processManager: boolean;
  process: {
    id: number;
    name: string;
    code: string;
  };
  companies: Array<{
    id: number;
    name: string;
    nit: string;
  }>;
  _count: {
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface JobTitleFormData {
  name: string;
  processId: number;
  description?: string;
  code?: string;
  autoGenerateCode: boolean;
  processManager: boolean;
  companyIds: number[];
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const JobTitleManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
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
    setSelectedJobTitle(null);
    setViewMode('create');
  };

  const handleEdit = (jobTitle: JobTitle) => {
    setSelectedJobTitle(jobTitle);
    setViewMode('edit');
  };

  const handleView = (jobTitle: JobTitle) => {
    setSelectedJobTitle(jobTitle);
    setViewMode('view');
  };

  const handleDelete = async (jobTitle: JobTitle) => {
    try {
      setLoading(true);
      
      // Check if job title has users assigned
      if (jobTitle._count.users > 0) {
        showNotification(
          `No se puede eliminar el cargo "${jobTitle.name}" porque tiene ${jobTitle._count.users} usuario${jobTitle._count.users !== 1 ? 's' : ''} asignado${jobTitle._count.users !== 1 ? 's' : ''}`,
          'warning'
        );
        return;
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showNotification(`Cargo "${jobTitle.name}" eliminado exitosamente`);
      setViewMode('list');
    } catch (error) {
      console.error('Error deleting job title:', error);
      showNotification('Error al eliminar el cargo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: JobTitleFormData) => {
    try {
      setLoading(true);
      
      if (viewMode === 'edit' && selectedJobTitle) {
        // Update existing job title
        console.log('Updating job title:', { id: selectedJobTitle.id, ...data });
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Cargo "${data.name}" actualizado exitosamente`);
      } else {
        // Create new job title
        console.log('Creating new job title:', data);
        
        // Validation: Check for duplicate job title names in same companies
        if (data.companyIds.length > 0) {
          // TODO: Add actual validation logic here
          console.log('Validating job title uniqueness across companies...');
        }
        
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        const managerText = data.processManager ? ' (Manager)' : '';
        showNotification(
          `Cargo "${data.name}"${managerText} creado exitosamente para ${data.companyIds.length} empresa${data.companyIds.length !== 1 ? 's' : ''}`
        );
      }
      
      setViewMode('list');
      setSelectedJobTitle(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification(
        viewMode === 'edit' ? 'Error al actualizar el cargo' : 'Error al crear el cargo',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedJobTitle(null);
  };

  const prepareFormData = (jobTitle: JobTitle): Partial<JobTitleFormData> => {
    return {
      name: jobTitle.name,
      processId: jobTitle.process.id,
      description: jobTitle.description || '',
      code: jobTitle.code,
      autoGenerateCode: false, // Since we have existing code
      processManager: jobTitle.processManager,
      companyIds: jobTitle.companies.map(company => company.id)
    };
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <JobTitleForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        );
      
      case 'edit':
        return selectedJobTitle ? (
          <JobTitleForm
            initialData={prepareFormData(selectedJobTitle)}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        ) : null;
      
      case 'view':
        // TODO: Implement job title detail view
        return (
          <Box>
            <Alert severity="info">
              Vista de detalles de cargo en desarrollo. 
              Aquí se mostrará información detallada del cargo, 
              el proceso al que pertenece, las empresas donde está disponible,
              los usuarios asignados y las responsabilidades específicas.
            </Alert>
          </Box>
        );
      
      default:
        return (
          <JobTitleList
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

export default JobTitleManagement;