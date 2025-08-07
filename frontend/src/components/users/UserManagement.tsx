import React, { useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import UserList from './UserList';
import UserForm from './UserForm';

// Types
interface User {
  id: number;
  documentNumber: string;
  documentType: 'CEDULA' | 'TARJETA_IDENTIDAD' | 'CEDULA_EXTRANJERIA';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  company?: {
    id: number;
    name: string;
    nit: string;
  };
  headquarters?: {
    id: number;
    name: string;
    code: string;
  };
  jobTitle?: {
    id: number;
    name: string;
    code: string;
    process: {
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface UserFormData {
  documentNumber: string;
  documentType: 'CEDULA' | 'TARJETA_IDENTIDAD' | 'CEDULA_EXTRANJERIA';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'USER';
  companyId: number;
  headquartersId: number;
  jobTitleId: number;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const UserManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
    setSelectedUser(null);
    setViewMode('create');
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewMode('view');
  };

  const handleDelete = async (user: User) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showNotification(`Usuario "${user.firstName} ${user.lastName}" eliminado exitosamente`);
      setViewMode('list');
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('Error al eliminar el usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      setLoading(true);
      
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const statusText = newStatus === 'ACTIVE' ? 'activado' : 'desactivado';
      showNotification(`Usuario "${user.firstName} ${user.lastName}" ${statusText} exitosamente`);
      
      // Optionally reload the list or update the user status locally
    } catch (error) {
      console.error('Error toggling user status:', error);
      showNotification('Error al cambiar el estado del usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      
      if (viewMode === 'edit' && selectedUser) {
        // Update existing user
        console.log('Updating user:', { documentNumber: selectedUser.documentNumber, ...data });
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Usuario "${data.firstName} ${data.lastName}" actualizado exitosamente`);
      } else {
        // Create new user
        console.log('Creating new user:', data);
        
        // Validation: Check for duplicate document numbers
        // TODO: Add actual validation logic here
        console.log('Validating unique document number...');
        
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        showNotification(`Usuario "${data.firstName} ${data.lastName}" creado exitosamente`);
      }
      
      setViewMode('list');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification(
        viewMode === 'edit' ? 'Error al actualizar el usuario' : 'Error al crear el usuario',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  const prepareFormData = (user: User): Partial<UserFormData> => {
    return {
      documentNumber: user.documentNumber,
      documentType: user.documentType,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      username: user.username,
      role: user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role, // Map SUPER_ADMIN to ADMIN for form
      companyId: user.company?.id || 0,
      headquartersId: user.headquarters?.id || 0,
      jobTitleId: user.jobTitle?.id || 0
    };
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <UserForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
            isEditMode={false}
          />
        );
      
      case 'edit':
        return selectedUser ? (
          <UserForm
            initialData={prepareFormData(selectedUser)}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={loading}
            isEditMode={true}
          />
        ) : null;
      
      case 'view':
        // TODO: Implement user detail view
        return (
          <Box>
            <Alert severity="info">
              Vista de detalles de usuario en desarrollo. 
              Aquí se mostrará información completa del usuario, 
              incluyendo historial de acceso, permisos específicos,
              información organizacional y opciones de gestión avanzada.
            </Alert>
          </Box>
        );
      
      default:
        return (
          <UserList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
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

export default UserManagement;