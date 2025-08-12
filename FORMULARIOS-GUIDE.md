# Guía Completa: Formularios en ITDimenzion

## Índice
1. [Convertir Formulario a Modal](#convertir-formulario-a-modal)
2. [Ordenar Campos en Formularios](#ordenar-campos-en-formularios)
3. [Modificar Tamaños de Campos](#modificar-tamaños-de-campos)
4. [Solucionar Validación del Campo NIT](#solucionar-validación-del-campo-nit)
5. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 1. Convertir Formulario a Modal

### ¿Qué es un Modal?
Un modal es una ventana emergente que aparece sobre el contenido actual, con un fondo oscuro (backdrop) y botones para cerrar. El usuario puede interactuar solo con el modal hasta que lo cierre.

### Paso 1: Identificar los Componentes Actuales

**Archivo actual:** `frontend/src/components/users/UserManagement.tsx`

Actualmente el flujo es:
```
UserManagement -> UserList -> onClick "Nuevo Usuario" -> cambia state -> muestra UserForm
```

### Paso 2: Crear el Modal

#### 2.1 Importaciones necesarias en UserList.tsx:
```tsx
import {
  Dialog,           // Componente modal principal
  DialogTitle,      // Título del modal
  DialogContent,    // Contenido del modal
  DialogActions,    // Botones del modal
  IconButton,       // Para botón de cerrar
  Slide,           // Para animación de entrada
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
```

#### 2.2 Estado para controlar el modal:
```tsx
// Agregar en UserList.tsx
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
const [selectedUser, setSelectedUser] = useState<User | null>(null);

// Funciones para manejar el modal
const handleOpenModal = (mode: 'create' | 'edit' | 'view', user?: User) => {
  setModalMode(mode);
  setSelectedUser(user || null);
  setModalOpen(true);
};

const handleCloseModal = () => {
  setModalOpen(false);
  setSelectedUser(null);
  // Opcional: recargar la lista después de crear/editar
  loadUsers();
};
```

#### 2.3 Componente Modal completo:
```tsx
// Agregar al final de UserList.tsx, antes del return principal
const UserModal = () => (
  <Dialog
    open={modalOpen}
    onClose={handleCloseModal}
    maxWidth="md"          // Tamaño del modal: xs, sm, md, lg, xl
    fullWidth              // Usa todo el ancho del maxWidth
    PaperProps={{
      sx: {
        borderRadius: 2,   // Bordes redondeados
        minHeight: '60vh', // Altura mínima
      }
    }}
  >
    <DialogTitle sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      pb: 1 
    }}>
      <Typography variant="h6">
        {modalMode === 'create' && 'Nuevo Usuario'}
        {modalMode === 'edit' && 'Editar Usuario'}
        {modalMode === 'view' && 'Ver Usuario'}
      </Typography>
      <IconButton 
        onClick={handleCloseModal}
        size="small"
        sx={{ color: 'grey.500' }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    
    <DialogContent dividers>
      <UserForm
        user={selectedUser}
        mode={modalMode}
        onSave={handleCloseModal}  // Cerrar después de guardar
        onCancel={handleCloseModal}
      />
    </DialogContent>
  </Dialog>
);
```

#### 2.4 Modificar el botón "Nuevo Usuario":
```tsx
// En UserList.tsx, cambiar el botón existente:
<Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => handleOpenModal('create')}  // <- CAMBIO AQUÍ
  sx={{ borderRadius: 2 }}
>
  Nuevo Usuario
</Button>
```

#### 2.5 Agregar el modal al return:
```tsx
// Al final del return en UserList.tsx:
return (
  <Box>
    {/* Contenido existente de la lista */}
    {/* ... todo tu código actual ... */}
    
    {/* AGREGAR ESTE MODAL AL FINAL */}
    <UserModal />
  </Box>
);
```

---

## 2. Ordenar Campos en Formularios

### El Sistema de Grid de Material-UI

**Concepto clave:** Material-UI usa un sistema de 12 columnas

```
|  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  | 10  | 11  | 12  |
```

### Breakpoints (tamaños de pantalla):
- `xs`: 0px+ (móviles)
- `sm`: 600px+ (tablets pequeñas)
- `md`: 900px+ (tablets/laptops)
- `lg`: 1200px+ (desktops)
- `xl`: 1536px+ (pantallas grandes)

### Problema: "3 campos en una hilera horizontal"

**¿Por qué pasa esto?**
Cuando tienes este código:
```tsx
<Grid container spacing={3}>
  <Grid xs={12} md={4}>Campo 1</Grid>
  <Grid xs={12} md={4}>Campo 2</Grid>
  <Grid xs={12} md={4}>Campo 3</Grid>
  <Grid xs={12} md={4}>Campo 4</Grid>  // Este se va a nueva fila
</Grid>
```

En pantallas `md+`: 4+4+4=12 columnas → 3 campos por fila
En pantallas `xs`: 12 columnas → 1 campo por fila

### Solución 1: Un campo por fila (vertical completo)
```tsx
<Grid container spacing={3}>
  <Grid xs={12}>Campo 1</Grid>
  <Grid xs={12}>Campo 2</Grid>
  <Grid xs={12}>Campo 3</Grid>
  <Grid xs={12}>Campo 4</Grid>
</Grid>
```

### Solución 2: Dos campos por fila
```tsx
<Grid container spacing={3}>
  <Grid xs={12} md={6}>Campo 1</Grid>
  <Grid xs={12} md={6}>Campo 2</Grid>
  <Grid xs={12} md={6}>Campo 3</Grid>
  <Grid xs={12} md={6}>Campo 4</Grid>
</Grid>
```

### Solución 3: Layout personalizado
```tsx
<Grid container spacing={3}>
  {/* Primera fila: 2 campos */}
  <Grid xs={12} md={6}>Nombre</Grid>
  <Grid xs={12} md={6}>Apellido</Grid>
  
  {/* Segunda fila: 1 campo ancho */}
  <Grid xs={12}>Email</Grid>
  
  {/* Tercera fila: 3 campos */}
  <Grid xs={12} sm={4}>Documento</Grid>
  <Grid xs={12} sm={4}>Número</Grid>
  <Grid xs={12} sm={4}>Teléfono</Grid>
</Grid>
```

### Ejemplo Práctico - UserForm.tsx

**Ubicación del código:** `frontend/src/components/users/UserForm.tsx`

**Buscar esta sección (aprox. línea 200-300):**
```tsx
<Grid container spacing={3}>
  <Grid xs={12} md={6}>
    <TextField
      name="firstName"
      label="Nombre *"
      // ...
    />
  </Grid>
  {/* Más campos... */}
</Grid>
```

**Para cambiar a vertical completo:**
```tsx
<Grid container spacing={3}>
  <Grid xs={12}>  {/* Cambiar md={6} por xs={12} */}
    <TextField
      name="firstName"
      label="Nombre *"
      // ...
    />
  </Grid>
  {/* Repetir para todos los campos */}
</Grid>
```

---

## 3. Modificar Tamaños de Campos

### Método 1: Usando Grid diferentes
```tsx
{/* Campo pequeño */}
<Grid xs={12} sm={3}>
  <TextField label="Código" />
</Grid>

{/* Campo mediano */}
<Grid xs={12} sm={6}>
  <TextField label="Nombre" />
</Grid>

{/* Campo grande */}
<Grid xs={12}>
  <TextField label="Descripción" />
</Grid>
```

### Método 2: Usando sx props
```tsx
<TextField
  label="Campo personalizado"
  sx={{ 
    width: '300px',        // Ancho fijo
    maxWidth: '100%',      // Responsivo
  }}
/>
```

### Método 3: Combinando ambos
```tsx
<Grid xs={12} md={8}>  {/* Usa 8/12 columnas en desktop */}
  <TextField
    label="Campo ancho personalizado"
    sx={{ width: '100%' }}
  />
</Grid>
```

### Ejemplo Específico - Campo NIT
**Archivo:** `frontend/src/components/companies/CompanyForm.tsx`

**Buscar el campo NIT (aprox. línea 150-200):**
```tsx
<Grid xs={12} md={6}>  {/* Cambiar a xs={12} md={4} para hacerlo más pequeño */}
  <TextField
    name="nit"
    label="NIT *"
    sx={{ 
      width: '250px',      // Ancho específico para NIT
      maxWidth: '100%'     // Responsivo
    }}
  />
</Grid>
```

---

## 4. Solucionar Validación del Campo NIT

### Problema Identificado
El NIT no acepta valores de 9 dígitos aunque debería ser válido en Colombia.

### Ubicación del problema:
1. **Frontend:** `frontend/src/components/companies/CompanyForm.tsx`
2. **Backend:** `backend/src/middleware/validation.ts` o en el esquema de validación

### Paso 1: Revisar validación en Frontend

**Archivo:** `frontend/src/components/companies/CompanyForm.tsx`

**Buscar la configuración de Formik/Yup (aprox. línea 50-100):**
```tsx
const validationSchema = Yup.object({
  nit: Yup.string()
    .min(9, 'NIT debe tener mínimo 9 dígitos')     // CAMBIAR AQUÍ
    .max(11, 'NIT debe tener máximo 11 dígitos')   // VERIFICAR AQUÍ
    .matches(/^[0-9]+$/, 'NIT solo puede contener números')
    .required('NIT es requerido'),
});
```

**Cómo modificarlo:**
```tsx
const validationSchema = Yup.object({
  nit: Yup.string()
    .min(9, 'NIT debe tener mínimo 9 dígitos')    
    .max(11, 'NIT debe tener máximo 11 dígitos')   
    .matches(/^[0-9]{9,11}$/, 'NIT debe tener entre 9 y 11 dígitos')  // Mejor regex
    .required('NIT es requerido'),
});
```

### Paso 2: Revisar validación en Backend

**Archivo:** `backend/src/middleware/validation.ts`

**Buscar validación de compañía (aprox. línea 50-150):**
```typescript
export const companyValidation = [
  body('nit')
    .isLength({ min: 9, max: 11 })
    .withMessage('NIT debe tener entre 9 y 11 caracteres')
    .matches(/^[0-9]+$/)
    .withMessage('NIT solo puede contener números'),
];
```

**Si la validación está restrictiva, cambiarla a:**
```typescript
export const companyValidation = [
  body('nit')
    .isLength({ min: 9, max: 11 })              // Permitir 9-11 caracteres
    .withMessage('NIT debe tener entre 9 y 11 dígitos')
    .matches(/^[0-9]{9,11}$/)                   // Regex exacta para 9-11 dígitos
    .withMessage('NIT debe contener solo números y tener entre 9 y 11 dígitos'),
];
```

### Paso 3: Verificar en la Base de Datos

**Archivo:** `backend/prisma/schema.prisma`

**Buscar el modelo Company:**
```prisma
model Company {
  id    Int     @id @default(autoincrement())
  nit   String  @unique @db.VarChar(15)  // Asegurar que tenga espacio suficiente
  // ...
}
```

### Paso 4: Prueba Manual

**Para probar NIT de 9 dígitos:**
1. Usar: `123456789` (9 dígitos)
2. Usar: `12345678901` (11 dígitos)
3. Verificar que ambos sean aceptados

---

## 5. Ejemplos Prácticos

### Ejemplo 1: Modal para UserForm

**Archivo completo de modificación:** `frontend/src/components/users/UserList.tsx`

```tsx
// 1. Agregar importaciones al inicio
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// 2. Agregar estados (después de otros useState)
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

// 3. Agregar funciones (después de otras funciones)
const handleOpenCreateModal = () => {
  setModalMode('create');
  setModalOpen(true);
};

const handleCloseModal = () => {
  setModalOpen(false);
  loadUsers(); // Recargar lista después de cambios
};

// 4. Modificar botón existente (buscar el botón "Nuevo Usuario")
<Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={handleOpenCreateModal}  // CAMBIO AQUÍ
  sx={{ borderRadius: 2 }}
>
  Nuevo Usuario
</Button>

// 5. Agregar modal antes del cierre del return principal
return (
  <Box>
    {/* Todo el contenido existente... */}
    
    {/* AGREGAR ESTE MODAL */}
    <Dialog
      open={modalOpen}
      onClose={handleCloseModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography variant="h6">
          {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
        </Typography>
        <IconButton onClick={handleCloseModal}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <UserForm
          onSave={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </DialogContent>
    </Dialog>
  </Box>
);
```

### Ejemplo 2: Layout de campos personalizado

**Archivo:** `frontend/src/components/users/UserForm.tsx`

**Buscar la sección de campos y reemplazar:**
```tsx
{/* Layout personalizado para UserForm */}
<Grid container spacing={3}>
  {/* Fila 1: Datos personales */}
  <Grid xs={12}>
    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
      Datos Personales
    </Typography>
  </Grid>
  
  <Grid xs={12} md={6}>
    <TextField name="firstName" label="Nombre *" fullWidth />
  </Grid>
  <Grid xs={12} md={6}>
    <TextField name="lastName" label="Apellido *" fullWidth />
  </Grid>
  
  {/* Fila 2: Email ancho completo */}
  <Grid xs={12}>
    <TextField name="email" label="Email *" fullWidth />
  </Grid>
  
  {/* Fila 3: Documento en tres partes */}
  <Grid xs={12} sm={4}>
    <FormControl fullWidth>
      <InputLabel>Tipo de Documento *</InputLabel>
      <Select name="documentType">
        <MenuItem value="CEDULA">Cédula</MenuItem>
        <MenuItem value="TARJETA_IDENTIDAD">Tarjeta de Identidad</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  <Grid xs={12} sm={4}>
    <TextField 
      name="documentNumber" 
      label="Número *" 
      fullWidth 
      sx={{ maxWidth: '200px' }}  // Ancho específico
    />
  </Grid>
  <Grid xs={12} sm={4}>
    <TextField name="phone" label="Teléfono" fullWidth />
  </Grid>
</Grid>
```

### Ejemplo 3: Corregir NIT paso a paso

**Archivo 1:** `frontend/src/components/companies/CompanyForm.tsx`
```tsx
// Buscar línea ~80 donde está la validación
const validationSchema = Yup.object({
  nit: Yup.string()
    .min(9, 'NIT debe tener mínimo 9 dígitos')          // Verificar este número
    .max(11, 'NIT debe tener máximo 11 dígitos')        // Verificar este número  
    .matches(/^[0-9]{9,11}$/, 'NIT debe tener entre 9 y 11 dígitos numéricos')
    .required('NIT es requerido'),
});

// Buscar el campo NIT (~línea 200) y modificar:
<Grid xs={12} md={4}>  {/* Hacer campo más pequeño */}
  <TextField
    name="nit"
    label="NIT *"
    placeholder="Ej: 123456789"
    sx={{ 
      maxWidth: '250px'  // Ancho específico para NIT
    }}
  />
</Grid>
```

**Archivo 2:** `backend/src/middleware/validation.ts`
```typescript
// Buscar la validación de compañía y asegurar:
export const createCompanyValidation = [
  body('nit')
    .isLength({ min: 9, max: 11 })
    .withMessage('NIT debe tener entre 9 y 11 dígitos')
    .matches(/^[0-9]{9,11}$/)
    .withMessage('NIT debe contener solo números'),
];
```

---

## Archivos que Necesitas Modificar

### Para Modal de Usuario:
- `frontend/src/components/users/UserList.tsx`
- `frontend/src/components/users/UserForm.tsx` (ajustar props si es necesario)

### Para Layout de Campos:
- `frontend/src/components/users/UserForm.tsx`
- `frontend/src/components/companies/CompanyForm.tsx`
- Cualquier otro formulario que quieras modificar

### Para NIT:
- `frontend/src/components/companies/CompanyForm.tsx`
- `backend/src/middleware/validation.ts`

---

## Comandos Útiles para Depurar

```bash
# Ver errores de compilación
cd frontend && npm run dev

# Ver logs del backend
cd backend && npm run dev

# Buscar texto en archivos
grep -r "NIT" frontend/src/
grep -r "validation" backend/src/
```

---

**¡Importante!** Después de cualquier cambio:
1. Guarda los archivos
2. El servidor de desarrollo se recarga automáticamente
3. Refresca el navegador si es necesario
4. Revisa la consola para errores