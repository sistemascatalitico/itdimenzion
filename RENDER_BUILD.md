# Configuración de build en Render

## CORS - Variables de entorno

En **Dashboard → itdimenzion → Environment**, añade:

| Variable | Valor |
|----------|-------|
| `ALLOWED_ORIGINS` | `https://itdimenzion-frontend-beta.vercel.app` (sin barra final) |

O para permitir cualquier preview de Vercel, el código ya permite `*.vercel.app` en producción. Asegúrate de desplegar el último commit.

## Error: lockfile desactualizado

Si ves `ERR_PNPM_OUTDATED_LOCKFILE`, actualiza el **Build Command** en Render:

**Dashboard → itdimenzion → Settings → Build & Deploy → Build Command**

Cambia `pnpm install` por `pnpm install --no-frozen-lockfile`:

**Si tu comando actual es:**
```
cd .. && pnpm install && cd backend && pnpm exec prisma generate && pnpm run build
```

**Cámbialo a:**
```
cd .. && pnpm install --no-frozen-lockfile && cd backend && pnpm exec prisma generate && pnpm run build
```

## Verificar que Render use el último commit

Render debe desplegar desde `main` con los commits más recientes (3451399 o posterior). Si sigue usando 36a0ab4:

1. En **Settings → Build & Deploy**, verifica que **Branch** sea `main`
2. Haz **Manual Deploy → Deploy latest commit**

## URL del backend

Tu backend está en: **https://itdimenzion.onrender.com**

Configura en Vercel: `VITE_API_URL=https://itdimenzion.onrender.com/api`
