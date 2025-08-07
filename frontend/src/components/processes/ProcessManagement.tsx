import React, { useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import ProcessList from './ProcessList';
import ProcessForm from './ProcessForm';

// Types
interface Process {
  id: number;
  name: string;
  description?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  companies: Array<{
    id: number;
    name: string;
    nit: string;
  }>;
  _count: {
    jobTitles: number;
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProcessFormData {
  name: string;
  description?: string;
  code?: string;
  autoGenerateCode: boolean;
  companyIds: number[];
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const ProcessManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
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
    setSelectedProcess(null);
    setViewMode('create');
  };

  const handleEdit = (process: Process) => {
    setSelectedProcess(process);
    setViewMode('edit');
  };

  const handleView = (process: Process) => {
    setSelectedProcess(process);
    setViewMode('view');
  };

  const handleDelete = async (process: Process) => {
    try {
      setLoading(true);
      
      // Check if process has users assigned
      if (process._count.users > 0) {
        showNotification(
          `No se puede eliminar el proceso "${process.name}" porque tiene ${process._count.users} usuario${process._count.users !== 1 ? 's' : ''} asignado${process._count.users !== 1 ? 's' : ''}`,
          'warning'
        );
        return;
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showNotification(`Proceso "${process.name}" eliminado exitosamente`);
      setViewMode('list');
    } catch (error) {
      console.error('Error deleting process:', error);
      showNotification('Error al eliminar el proceso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: ProcessFormData) => {
    try {
      setLoading(true);
      
      if (viewMode === 'edit' && selectedProcess) {
        // Update existing process
        console.log('Updating process:', { id: selectedProcess.id, ...data });
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Proceso "${data.name}" actualizado exitosamente`);
      } else {
        // Create new process
        console.log('Creating new process:', data);
        
        // Validation: Check for duplicate process names in same companies
        if (data.companyIds.length > 0) {
          // TODO: Add actual validation logic here
          console.log('Validating process uniqueness across companies...');
        }
        
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Proceso "${data.name}" creado exitosamente para ${data.companyIds.length} empresa${data.companyIds.length !== 1 ? 's' : ''}`);
      }
      
      setViewMode('list');
      setSelectedProcess(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification(
        viewMode === 'edit' ? 'Error al actualizar el proceso' : 'Error al crear el proceso',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedProcess(null);
  };

  const prepareFormData = (process: Process): Partial<ProcessFormData> => {
    return {
      name: process.name,
      description: process.description || '',
      code: process.code,
      autoGenerateCode: false, // Since we have existing code
      companyIds: process.companies.map(company => company.id)
    };
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <ProcessForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        );
      
      case 'edit':
        return selectedProcess ? (
          <ProcessForm
            initialData={prepareFormData(selectedProcess)}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
          />
        ) : null;
      
      case 'view':
        // TODO: Implement process detail view
        return (
          <Box>
            <Alert severity="info">
              Vista de detalles de proceso en desarrollo. 
              Aquí se mostrará información detallada del proceso, 
              las empresas asociadas, los cargos disponibles y los usuarios asignados.
            </Alert>
          </Box>
        );
      
      default:
        return (
          <ProcessList
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

export default ProcessManagement;