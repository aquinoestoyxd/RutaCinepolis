# Integración con el Frontend

Guía para conectar cualquier aplicación frontend (React, Vue, HTML+JS) con el backend de Ruta Cinépolis.

---

## URL base

```
Desarrollo local:   http://localhost:3001/api/v1
Producción AWS:     https://api.rutacinepolis.com.pe/api/v1  (pendiente configurar)
```

---

## Autenticación

El backend usa **JWT (JSON Web Tokens)**. El flujo es:

```
1. Frontend hace POST /auth/login con email y password
2. Backend devuelve accessToken (dura 8h) y refreshToken (dura 7d)
3. Frontend guarda los tokens (localStorage o memoria)
4. Frontend envía el accessToken en cada petición protegida
5. Cuando el accessToken expira, usa refreshToken para obtener uno nuevo
```

### Guardar el token (ejemplo en JavaScript)

```javascript
// Después del login
const { data } = await login(email, password)
localStorage.setItem('accessToken', data.tokens.accessToken)
localStorage.setItem('refreshToken', data.tokens.refreshToken)
```

### Enviar el token en cada petición

```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json'
}
```

---

## Configuración base recomendada

### Con fetch nativo

```javascript
const API_URL = 'http://localhost:3001/api/v1'

function getHeaders() {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, { headers: getHeaders() })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}
```

### Con Axios (recomendado para proyectos grandes)

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: agrega el token automáticamente a cada petición
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: si el token expiró (401), intenta renovarlo
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post('/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', data.data.accessToken)
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(error.config)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## Pantallas y qué endpoints usan

### Portal del Miembro (CLIENTE)

#### Pantalla: Login
```javascript
const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('accessToken', data.tokens.accessToken)
  localStorage.setItem('refreshToken', data.tokens.refreshToken)
  return data.user
}
```

#### Pantalla: Mi Perfil RC
```javascript
// Datos del perfil
const perfil = await api.get('/members/me')

// Nivel y progreso hacia el siguiente nivel
const membresia = await api.get('/membership/my')
// membresia.progress.visitsToNextLevel → cuántas visitas faltan
// membresia.progress.nextLevel → "GOLDEN"

// Saldo de puntos
const balance = await api.get('/points/my-balance')
// balance.current → puntos disponibles
```

#### Pantalla: Mis Beneficios
```javascript
// Beneficios disponibles para el nivel del miembro
const benefits = await api.get('/benefits?levelName=PREMIUM')
```

#### Pantalla: Historial
```javascript
// Historial de compras y puntos
const historial = await api.get('/points/my-history?page=1&limit=10')

// Historial de canjes
const canjes = await api.get('/redemptions/my-history')
```

#### Acción: Canjear beneficio
```javascript
const canjear = async (memberId, benefitId) => {
  const { data } = await api.post('/redemptions', { memberId, benefitId })
  return data // { transaction, redemption }
}
```

#### Pantalla: Notificaciones
```javascript
// Ver notificaciones no leídas
const notifs = await api.get('/notifications?unread=true')

// Marcar como leída
await api.patch(`/notifications/${id}/read`)

// Cantidad de no leídas (para el badge)
const { count } = await api.get('/notifications/unread-count')
```

---

### Interfaz del Cajero (POS)

#### Identificar miembro por tarjeta
```javascript
const buscarMiembro = async (cardNumber) => {
  const { data } = await api.post('/pos/lookup', { cardNumber })
  // data.firstName, data.lastName, data.membership.level.displayName
  // data.membership.points
  return data
}
```

#### Registrar compra
```javascript
const registrarCompra = async (cardNumber, amount, tipo) => {
  const { data } = await api.post('/pos/transaction', {
    cardNumber,
    posId: 'POS-LIMA-01',         // identificador del terminal
    amount,                        // monto en soles
    transactionType: tipo          // 'PURCHASE_TICKET' o 'PURCHASE_CANDY'
  })
  // data.pointsEarned → puntos acreditados
  // data.newBalance   → saldo nuevo del miembro
  // data.levelUpgraded → true si subió de nivel
  return data
}
```

#### Sincronización offline
```javascript
// Cuando vuelve la conexión, enviar las transacciones guardadas localmente
const sincronizar = async (transaccionesLocales) => {
  const { data } = await api.post('/pos/sync', {
    posId: 'POS-LIMA-01',
    transactions: transaccionesLocales
  })
  // data.succeeded → cuántas se procesaron bien
  // data.failed    → cuántas fallaron
  return data
}
```

---

### Panel de Administración (ADMIN)

#### Dashboard principal
```javascript
// Todos los KPIs (responde en < 5 segundos)
const kpis = await api.get('/reports/kpi?from=2025-01-01&to=2025-06-30')
// kpis.summary.totalMembers
// kpis.levelDistribution
// kpis.topSpenders

// Gráfica de crecimiento mensual
const crecimiento = await api.get('/reports/member-growth?year=2025')
```

#### Configurar reglas de negocio
```javascript
// Ver configuración actual
const config = await api.get('/admin/config')

// Cambiar tasa de puntos
await api.put('/admin/config/POINTS_RATE', {
  value: '0.08',
  description: 'Campaña de julio: 8%'
})
```

#### Gestionar staff
```javascript
// Crear cajero nuevo
await api.post('/admin/staff', {
  email: 'cajero2@cinepolis.com.pe',
  password: 'Cajero123!',
  role: 'CAJERO'
})
```

---

## Manejo de errores en el frontend

El backend siempre devuelve el mismo formato de error:

```json
{
  "success": false,
  "error": "El DNI ya está registrado",
  "errors": {
    "email": ["El correo ya está en uso"]
  }
}
```

Ejemplo de manejo en React:

```jsx
const [error, setError] = useState(null)

const handleRegister = async (formData) => {
  try {
    await api.post('/members/register', formData)
    navigate('/login')
  } catch (err) {
    const mensaje = err.response?.data?.error || 'Error inesperado'
    setError(mensaje)

    // Si hay errores de validación por campo:
    const erroresCampos = err.response?.data?.errors
    if (erroresCampos) {
      // { "dni": ["El DNI debe tener 8 dígitos"] }
      setFieldErrors(erroresCampos)
    }
  }
}
```

---

## CORS — Orígenes permitidos

El backend ya está configurado para aceptar peticiones desde:
- `http://localhost:3001`
- `http://localhost:4200`
- `http://localhost:5173`

Si el frontend corre en otro puerto, agrégalo en el archivo `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4200
```

---

## Paginación

Los endpoints que devuelven listas usan paginación. Parámetros:
- `?page=1` — número de página (empieza en 1)
- `?limit=20` — registros por página (máximo 100)

La respuesta incluye el objeto `meta`:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3420,
    "totalPages": 171
  }
}
```

---

## Variables de entorno en el frontend

Crea un archivo `.env` en el proyecto frontend:

```env
# React (Create React App / Vite)
VITE_API_URL=http://localhost:3001/api/v1

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Uso en el código:
```javascript
const API_URL = import.meta.env.VITE_API_URL  // Vite
const API_URL = process.env.NEXT_PUBLIC_API_URL  // Next.js
```

---

## Checklist de integración

Antes de conectar el frontend, verifica:

- [ ] El backend está corriendo (`http://localhost:3001/health` responde `"status": "ok"`)
- [ ] La migración se ejecutó (`npm run prisma:migrate`)
- [ ] El seed se ejecutó (`npm run prisma:seed`)
- [ ] Puedes hacer login desde Swagger (`http://localhost:3001/api/docs`)
- [ ] El origen del frontend está en `CORS_ORIGINS` del `.env`
- [ ] El frontend usa el prefijo `/api/v1` en todas las peticiones
