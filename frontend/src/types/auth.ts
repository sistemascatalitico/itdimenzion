export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  headquarters: Headquarters;
  jobTitle?: JobTitle;
  process?: Process;
}

export interface Headquarters {
  id: string;
  name: string;
  company: Company;
}

export interface Company {
  id: string;
  name: string;
}

export interface JobTitle {
  id: string;
  name: string;
  description?: string;
}

export interface Process {
  id: string;
  name: string;
  description?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'USER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';

export type DocumentType = 
  | 'CEDULA' 
  | 'TARJETA_IDENTIDAD' 
  | 'CEDULA_EXTRANJERIA' 
  | 'NIT' 
  | 'RUT' 
  | 'PASSPORT';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  phone?: string;
  headquartersId: string;
  jobTitleId?: string;
  processId?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  message: string;
  statusCode: number;
}

export interface ProfileResponse {
  user: User;
  statusCode: number;
}