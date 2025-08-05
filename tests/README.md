# 🧪 TESTING FRAMEWORK - ITDimenzion

## 📋 Estrategia de Testing

Este directorio contiene las pruebas de seguridad y funcionalidad para el sistema ITDimenzion.

## 🏗️ Estructura de Tests

```
tests/
├── backend/
│   ├── unit/           # Tests unitarios
│   ├── integration/    # Tests de integración
│   └── security/       # Tests de seguridad
├── frontend/
│   ├── components/     # Tests de componentes
│   └── integration/    # Tests de integración
├── e2e/               # Tests end-to-end
└── security/          # Herramientas de ethical hacking
```

## 🛡️ Tests de Seguridad Prioritarios

### 1. **Authentication Security Tests**
```bash
# Tests que deben implementarse:
- Brute force protection
- SQL injection resistance  
- XSS prevention
- CSRF protection
- Session security
- Password strength validation
```

### 2. **Authorization Tests**
```bash
# Verificaciones de permisos:
- Role-based access control
- Headquarters isolation
- Resource ownership
- Privilege escalation prevention
```

### 3. **Input Validation Tests**
```bash
# Validación de entradas:
- Malicious payload rejection
- Data type validation
- Length limitations
- Special character handling
```

## 🚀 Configuración Rápida

### Backend Testing (Jest + Supertest)
```bash
cd backend
npm install --save-dev jest supertest @types/jest @types/supertest
```

### Frontend Testing (React Testing Library)
```bash
cd frontend  
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### E2E Testing (Playwright)
```bash
npm install --save-dev @playwright/test
```

## 📝 Ejemplo de Test de Seguridad

### Authentication Security Test
```typescript
// tests/backend/security/auth.security.test.ts
describe('Authentication Security', () => {
  it('should block after 5 failed login attempts', async () => {
    const credentials = { email: 'test@test.com', password: 'wrong' };
    
    // 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);
    }
    
    // El 6to intento debe ser bloqueado
    await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect(423); // Account locked
  });
  
  it('should prevent SQL injection in login', async () => {
    const maliciousPayload = {
      email: "admin' OR '1'='1' --",
      password: "anything"
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(maliciousPayload)
      .expect(401);
      
    expect(response.body.error).not.toContain('database');
  });
});
```

## 🔒 Security Testing Checklist

### **Automated Tests (Implementar)**
- [ ] **Input Validation**: Rechaza caracteres maliciosos
- [ ] **SQL Injection**: Previene inyecciones SQL
- [ ] **XSS Prevention**: Bloquea scripts maliciosos  
- [ ] **CSRF Protection**: Valida tokens CSRF
- [ ] **Rate Limiting**: Aplica límites de velocidad
- [ ] **Authentication**: Valida tokens correctamente
- [ ] **Authorization**: Respeta permisos de rol
- [ ] **Session Security**: Maneja sesiones seguramente
- [ ] **Password Policy**: Aplica política de contraseñas
- [ ] **Error Handling**: No expone información sensible

### **Manual Security Tests**
- [ ] **Brute Force**: Probar herramientas como Hydra
- [ ] **Vulnerability Scan**: OWASP ZAP scan completo
- [ ] **Network Analysis**: Nmap port scanning
- [ ] **SSL/TLS Test**: SSL Labs testing
- [ ] **Header Analysis**: Security headers verification

## 🎯 Comandos de Testing

### Ejecutar Tests de Seguridad
```bash
# Backend security tests
cd backend && npm run test:security

# Frontend security tests  
cd frontend && npm run test:security

# E2E security tests
npm run test:e2e:security

# Full security suite
npm run test:security:all
```

### Herramientas Externas
```bash
# OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# SQLMap injection testing
sqlmap -u "http://localhost:4000/api/auth/login" --data="email=test&password=test"

# Nikto web vulnerability scanner
nikto -h localhost:4000
```

## 📊 Coverage y Reportes

### Security Coverage Target
- **Authentication**: 100% coverage
- **Authorization**: 100% coverage  
- **Input Validation**: 95% coverage
- **Error Handling**: 90% coverage
- **Overall Security**: 95% coverage

### Reporting
```bash
# Generate security test report
npm run test:security:report

# Coverage report
npm run test:coverage

# Security audit report
npm audit --json > security-audit.json
```

## 🚨 CI/CD Integration

### GitHub Actions Security Pipeline
```yaml
# .github/workflows/security.yml
name: Security Tests
on: [push, pull_request]
jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Tests
        run: |
          npm install
          npm run test:security
          npm audit
```

## 📚 Recursos para Testing

### **Security Testing Tools**
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Burp Suite Community](https://portswigger.net/burp/communitydownload)
- [SQLMap](http://sqlmap.org/)
- [Nikto](https://cirt.net/Nikto2)

### **JavaScript Testing**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest API Testing](https://github.com/visionmedia/supertest)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**⚠️ IMPORTANTE**: Los tests de seguridad deben ejecutarse antes de cada despliegue a producción.