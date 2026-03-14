import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import { ZustandProvider } from './providers/ZustandProvider';
import { ThemeContextProvider } from './context/ThemeContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/layout/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import TestConnection from './TestConnection';

// Lazy load components for better performance
const UserList = lazy(() => import('./components/users/UserList'));
const UserDashboard = lazy(() => import('./components/users/UserDashboard'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));
const CompanyList = lazy(() => import('./components/companies/CompanyList'));
const CompanyDashboard = lazy(() => import('./components/companies/CompanyDashboard'));
const HeadquartersList = lazy(() => import('./components/companies/HeadquartersList'));
const ProcessList = lazy(() => import('./components/companies/ProcessList'));
const JobTitleList = lazy(() => import('./components/companies/JobTitleList'));
// Assets
const AssetDashboard = lazy(() => import('./components/assets/AssetDashboard'));
const AssetList = lazy(() => import('./components/assets/AssetList'));
const AssetDetail = lazy(() => import('./components/assets/AssetDetail'));
const AssetCategories = lazy(() => import('./components/assets/AssetCategories'));
const AssetGroups = lazy(() => import('./components/assets/AssetGroups'));
// Administration
const CustomFieldsManager = lazy(() => import('./components/administration/CustomFieldsManager'));
const FieldMappingManager = lazy(() => import('./components/administration/FieldMappingManager'));
// Form Builder
const FormList = lazy(() => import('./components/formBuilder/FormList'));
const AssetManufacturers = lazy(() => import('./components/assets/AssetManufacturers'));
const AssetModels = lazy(() => import('./components/assets/AssetModels'));
const AssetModelsTest = lazy(() => import('./components/assets/AssetModelsTest'));
const AssetTypes = lazy(() => import('./components/assets/AssetTypes'));
const FilteredAssetList = lazy(() => import('./components/assets/FilteredAssetList'));
const CategoryGroupsView = lazy(() => import('./components/assets/CategoryGroupsView'));

/**
 * Loading component for Suspense fallback
 */
const LoadingFallback: React.FC = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={60} />
    <Typography sx={{ ml: 2 }}>Cargando...</Typography>
  </Box>
);

/**
 * Root redirect component - redirects to appropriate route based on auth status
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Typography>Verificando autenticación...</Typography>
    </Box>;
  }
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

/**
 * Main app content with routing configuration
 */
const AppContent: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/test" element={<TestConnection />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <UserDashboard />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users/list"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <UserList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProfilePage />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/assets/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetDashboard />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetDetail />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/categories"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetCategories />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/groups"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetGroups />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Navegación Jerárquica - Vista de Grupos por Categoría */}
        <Route
          path="/assets/category/:categoryId/groups"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <CategoryGroupsView />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Navegación Jerárquica - Activos Filtrados */}
        <Route
          path="/assets/by-category/:categoryId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FilteredAssetList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/by-group/:groupId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FilteredAssetList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/by-type/:typeId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FilteredAssetList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/by-manufacturer/:manufacturerId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FilteredAssetList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/by-model/:modelId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FilteredAssetList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Administration Routes */}
        <Route
          path="/administration/custom-fields"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <CustomFieldsManager />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/forms"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FormList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/administration/field-mapping"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FieldMappingManager />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/manufacturers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetManufacturers />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/models"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetModels />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/models-test"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetModelsTest />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/types"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AssetTypes />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <CompanyDashboard />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/companies/list"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <CompanyList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/companies/headquarters"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <HeadquartersList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/companies/processes"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProcessList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/companies/job-titles"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <JobTitleList />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

/**
 * Root application component with all providers
 */
const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <ZustandProvider>
        <AppContent />
      </ZustandProvider>
    </ThemeContextProvider>
  );
};

export default App;