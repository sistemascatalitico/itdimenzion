# Variables de entorno para Vercel (producción)

Configura estas variables en **Vercel → Project Settings → Environment Variables**:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_API_URL` | `https://itdimenzion.onrender.com/api` | URL del backend en Render (debe incluir `/api`) |

**Importante:** Las variables `VITE_*` se embeben en el build. Después de añadirlas, redeploya el proyecto.

## Backend (Render)

En el backend en Render, configura `ALLOWED_ORIGINS` para incluir tu dominio de Vercel:

```
ALLOWED_ORIGINS=https://itdimenzion.vercel.app,https://itdimenzion-*.vercel.app
```

O si usas un dominio personalizado, añádelo a la lista separada por comas.
