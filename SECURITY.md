# 🛡️ GUÍA DE SEGURIDAD - ITDimenzion

## 📋 Resumen de Seguridad

ITDimenzion ha sido diseñado desde cero con un enfoque de **seguridad primero**, implementando las mejores prácticas para resistir ataques comunes y preparado para auditorías de ethical hacking.

## 🔒 Características de Seguridad Implementadas

### 1. **Autenticación Robusta**
- **JWT con Refresh Tokens**: Tokens de acceso de corta duración (24h) con refresh automático
- **Hashing bcrypt**: Contraseñas hasheadas con 12 rounds de salt
- **Validación de Contraseñas**: Requisitos estrictos de complejidad
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Account Locking**: Bloqueo temporal después de 5 intentos fallidos

### 2. **Autorización Granular (RBAC)**
- **Roles Jerárquicos**: SUPER_ADMIN > ADMIN > SUPERVISOR > USER
- **Permisos por Endpoint**: Cada ruta protegida según rol necesario
- **Aislamiento por Sede**: Los usuarios solo acceden a datos de su sede
- **Ownership Validation**: Verificación de propiedad de recursos

### 3. **Validación y Sanitización**
```typescript
// Todas las entradas son validadas y sanitizadas
- Input Validation con express-validator
- Sanitización con DOMPurify (frontend)
- Detección de patrones sospechosos (SQL injection, XSS, Path traversal)
- Escapado automático de caracteres especiales
```

### 4. **Headers de Seguridad**
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
```

### 5. **Protección CORS**
- **Origin Allowlist**: Solo dominios específicos permitidos
- **Credentials**: Manejo seguro de cookies
- **Preflight**: Validación de requests complejos

### 6. **Logging y Auditoría**
- **Security Events**: Registro de eventos de seguridad
- **Login Tracking**: Historial de inicios de sesión
- **Failed Attempts**: Monitoreo de intentos fallidos
- **IP Tracking**: Seguimiento de direcciones IP sospechosas

## 🎯 Vectores de Ataque Mitigados

### ✅ **SQL Injection**
- **Prisma ORM**: Queries parametrizadas automáticamente
- **Input Validation**: Validación estricta de tipos
- **Pattern Detection**: Detección de patrones SQL maliciosos

### ✅ **Cross-Site Scripting (XSS)**
- **Content Security Policy**: Headers CSP restrictivos
- **Input Sanitization**: Limpieza de todos los inputs
- **Output Encoding**: Escapado automático en templates
- **DOMPurify**: Sanitización en el cliente

### ✅ **Cross-Site Request Forgery (CSRF)**
- **SameSite Cookies**: Cookies con SameSite=strict
- **Origin Validation**: Verificación de origen de requests
- **Double Submit Cookies**: Implementación de tokens CSRF

### ✅ **Session Hijacking**
- **HttpOnly Cookies**: Cookies no accesibles desde JavaScript
- **Secure Cookies**: Transmisión solo por HTTPS
- **Token Rotation**: Rotación automática de refresh tokens
- **Session Invalidation**: Invalidación al logout

### ✅ **Brute Force Attacks**
- **Rate Limiting**: 100 requests/15min general, 10/15min auth
- **Account Locking**: Bloqueo progresivo
- **IP Blocking**: Bloqueo de IPs sospechosas
- **CAPTCHA Ready**: Preparado para implementar CAPTCHA

### ✅ **Information Disclosure**
- **Error Handling**: Mensajes de error genéricos en producción
- **Stack Trace Hiding**: No exposición de stack traces
- **Sensitive Data Masking**: Ocultación de datos sensibles en logs
- **Version Hiding**: Ocultación de versiones de software

## 🧪 Testing de Seguridad

### Herramientas Recomendadas para Ethical Hacking

#### **1. OWASP ZAP**
```bash
# Escaneo automático de vulnerabilidades web
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

#### **2. SQLMap**
```bash
# Testing de SQL Injection
sqlmap -u "http://localhost:4000/api/auth/login" --data="email=test&password=test" --level=5
```

#### **3. Burp Suite**
- Proxy intercept para análisis manual
- Scanner automático de vulnerabilidades
- Intruder para ataques de fuerza bruta

#### **4. Nikto**
```bash
# Escaneo de vulnerabilidades del servidor web
nikto -h localhost:4000
```

#### **5. Nmap**
```bash
# Escaneo de puertos y servicios
nmap -sV -sC localhost
```

### Tests de Penetración Manuales

#### **Authentication Testing**
```bash
# Test de fuerza bruta
hydra -l admin@itdimenzion.com -P passwords.txt localhost http-post-form "/api/auth/login:email=^USER^&password=^PASS^:Invalid"

# Test de inyección SQL en login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com'\'' OR 1=1--","password":"test"}'
```

#### **XSS Testing**
```javascript
// Payload XSS en inputs
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

#### **CSRF Testing**
```html
<!-- HTML para probar CSRF -->
<form action="http://localhost:4000/api/auth/logout" method="POST">
  <input type="submit" value="Logout Usuario">
</form>
```

## 🔧 Configuración para Producción

### 1. **Variables de Entorno**
```bash
# Cambiar TODOS los secrets por valores únicos y seguros
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Base de datos con usuario dedicado
DATABASE_URL="mysql://itd_user:$(openssl rand -base64 16)@localhost:3306/itdimenzion_prod"

# Configuración de producción
NODE_ENV=production
RATE_LIMIT_MAX_REQUESTS=50
```

### 2. **HTTPS Obligatorio**
```nginx
# Configuración Nginx con SSL
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
}
```

### 3. **Firewall y Monitoring**
```bash
# UFW Firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 4000   # Backend directo bloqueado
ufw enable

# Monitoring con fail2ban
fail2ban-client start
```

## 📊 Checklist de Seguridad

### **Pre-Despliegue**
- [ ] Todos los secrets cambiados de valores por defecto
- [ ] Base de datos con usuario dedicado (no root)
- [ ] HTTPS configurado correctamente
- [ ] Rate limiting activado
- [ ] Logs de seguridad configurados
- [ ] Backup automático de base de datos
- [ ] Firewall configurado
- [ ] Monitoring activo

### **Post-Despliegue**
- [ ] Escaneo con OWASP ZAP completado
- [ ] Tests de penetración ejecutados
- [ ] Auditoría de logs revisada
- [ ] Performance bajo carga verificado
- [ ] Plan de respuesta a incidentes preparado
- [ ] Equipo capacitado en procedimientos de seguridad

### **Mantenimiento Continuo**
- [ ] Actualizaciones de seguridad mensuales
- [ ] Revisión de logs semanal
- [ ] Rotación de secrets trimestral
- [ ] Auditoría de accesos mensual
- [ ] Backup testing mensual
- [ ] Ethical hacking semestral

## 🚨 Respuesta a Incidentes

### **Detección de Ataques**
1. **Monitoreo Automático**: Alertas por múltiples intentos fallidos
2. **Log Analysis**: Revisión diaria de patrones sospechosos
3. **User Reports**: Canal para reportes de usuarios

### **Procedimiento de Respuesta**
1. **Contención**: Bloqueo inmediato de IP/usuario sospechoso
2. **Investigación**: Análisis de logs y vectores de ataque
3. **Mitigación**: Parches inmediatos si se encuentran vulnerabilidades
4. **Comunicación**: Notificación a usuarios afectados
5. **Documentación**: Registro completo del incidente

### **Contactos de Emergencia**
- **Admin Principal**: iltonysverbel@gmail.com
- **Admin Backup**: admin@itdimenzion.com
- **Soporte Técnico**: [Configurar]

## 📚 Recursos y Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Guide](https://react.dev/learn/keeping-components-pure)

---

**⚠️ IMPORTANTE**: Esta guía debe mantenerse actualizada con cada cambio en el sistema de seguridad.