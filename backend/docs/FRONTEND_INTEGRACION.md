# Integración Frontend ↔ Backend

Documentación de cómo el panel web (React + Vite) consume la API REST del backend.

---

## Arquitectura de comunicación

```
frontend/           (puerto 5173 en desarrollo)
  └── Vite proxy
        └── /api/* → http://localhost:3001/api/v1/*   (backend)
```

El proxy de Vite (`frontend/vite.config.js`) redirige todas las peticiones `/api` al backend, eliminando la necesidad de configurar CORS en desarrollo. En producción ambos servicios se sirven desde el mismo dominio o se configura el origen en `CORS_ORIGINS`.

---

## Cliente HTTP — `frontend/src/api/`

### `axios.js`

Instancia base de axios con:
- `baseURL: /api/v1` — todas las rutas son relativas a este prefijo
- Interceptor de request: adjunta `Authorization: Bearer <token>` en cada petición usando la clave `rc_token` de localStorage
- Interceptor de response: si recibe `401`, intenta renovar el token con `rc_refresh`. Si el refresh falla, limpia localStorage y redirige a `/login`

```javascript
// Claves usadas en localStorage
rc_token    // accessToken JWT (dura 8h)
rc_refresh  // refreshToken JWT (dura 7d)
rc_user     // objeto { id, email, role } del usuario autenticado
```

### `index.js`

Funciones exportadas agrupadas por dominio. Convención de respuesta:
- Endpoints que devuelven un item → `r.data.data` (extrae el objeto directo)
- Endpoints paginados → `r.data` (incluye `data[]` + `meta { page, limit, total, totalPages }`)

---

## Autenticación y sesión — `AuthContext.jsx`

```javascript
const { user, login, logout, loading } = useAuth()
```

| Campo | Tipo | Descripción |
|---|---|---|
| `user` | `{ id, email, role }` o `null` | Usuario autenticado. `null` si no hay sesión. |
| `login(email, password)` | `async → user` | Llama `POST /auth/login`, guarda tokens y devuelve el objeto usuario. |
| `logout()` | `async → void` | Llama `POST /auth/logout`, limpia localStorage y resetea estado. |
| `loading` | `boolean` | `true` mientras se lee la sesión guardada al cargar la app. |

**Flujo de login:**
```
Login.jsx → useAuth().login() → POST /auth/login
                              → guarda rc_token, rc_refresh, rc_user en localStorage
                              → redirige por rol:
                                  ADMINISTRADOR → /admin/dashboard
                                  CAJERO        → /cajero/buscar
```

---

## Rutas protegidas — `App.jsx`

```
/login                     → Login.jsx (público)
/                          → redirige según rol
/cajero/*                  → requiere rol CAJERO o ADMINISTRADOR
  buscar                   → BuscarMiembro.jsx
  registrar                → RegistrarMiembro.jsx
  compra                   → RegistrarCompra.jsx
  canje                    → AplicarCanje.jsx
/admin/*                   → requiere rol ADMINISTRADOR
  dashboard                → AdminDashboard.jsx
  miembros                 → Miembros.jsx
  beneficios               → Beneficios.jsx
  reportes                 → Reportes.jsx
  staff                    → Staff.jsx
  merchandising            → Merchandising.jsx
  configuracion            → Configuracion.jsx
  auditoria                → Auditoria.jsx
```

---

## Páginas del cajero y endpoints que usan

### BuscarMiembro — Identificar cliente por tarjeta

```javascript
// POST /pos/lookup — responde en < 2s
const data = await posLookup(cardNumber)
// data: { id, firstName, lastName, cardNumber, status, membership: { points, totalVisits, level } }
```

> `posLookup` devuelve el miembro aunque esté inactivo o suspendido. La página muestra un banner de aviso y deshabilita las acciones rápidas. La restricción de activo aplica solo al procesar una transacción.

### RegistrarMiembro — Dar de alta al cliente

```javascript
// GET /membership/levels (público) — carga los niveles para el selector
const levels = await getLevels()

// POST /members/register (requiere CAJERO)
const member = await registerMember({ dni, firstName, lastName, email?, phone?, birthDate?, levelId })
// Si levelId apunta al nivel Golden, el backend entrega automáticamente el kit de bienvenida
```

La respuesta incluye el `cardNumber` generado para entregarlo físicamente al cliente.

### RegistrarCompra — Procesar venta en taquilla

```javascript
// Paso 1: identificar
const member = await posLookup(cardNumber)

// Paso 2: registrar compra
const result = await posTransaction({ cardNumber, amount, transactionType, posId })
// result.pointsEarned  → puntos acreditados en esta compra
// result.newBalance    → saldo nuevo del miembro
// result.levelUpgraded → true si la compra lo subió de nivel
```

`transactionType` acepta: `PURCHASE_TICKET` (entrada) o `PURCHASE_CANDY` (dulcería).

Preview en UI: el frontend calcula localmente el descuento y los puntos estimados antes de confirmar, basándose en los valores fijos del nivel. El valor definitivo lo devuelve el backend.

### AplicarCanje — Canjear un beneficio

```javascript
// GET /benefits?levelName=GOLDEN — beneficios disponibles para el nivel del miembro
const benefits = await getBenefits({ levelName })

// POST /redemptions
const result = await redeemBenefit({ memberId, benefitId, posId })
```

La UI filtra los beneficios con `pointsCost > points` del miembro y los muestra deshabilitados.

---

## Páginas del admin y endpoints que usan

### AdminDashboard — KPIs y gráficas

```javascript
// GET /reports/kpi → summary, levelDistribution, topSpenders
const kpi = await getKpi({})

// GET /reports/member-growth?year=2026
const growth = await getMemberGrowth(year)
```

`topSpenders[].level` devuelve el enum (`ESTANDAR`, `PREMIUM`, `GOLDEN`) para el lookup de colores.

### Miembros — Gestión de la base de miembros

```javascript
// GET /members?search=&status=&levelName=&page=&limit=20
const res = await getMembers({ search, status, levelName, page })
// res.data    → array de miembros
// res.meta    → { page, limit, total, totalPages }

// PATCH /members/:id/status
await updateMemberStatus(id, status)  // status: ACTIVE | INACTIVE | SUSPENDED

// POST /points/:memberId/adjust
await adjustPoints(memberId, delta, reason)
```

### Reportes — Transacciones

```javascript
// GET /reports/transactions?from=&to=
const data = await getTransactionReport({ from, to })
// data.byType     → array { type, count, totalAmount }
// data.byOrigin   → array { origin, count, totalAmount }
// data.dailyVolume → array { date, count, total }
```

### Staff — Gestión de usuarios

```javascript
// GET /admin/staff
const staff = await getStaff()

// POST /admin/staff
await createStaff({ email, password, role })  // role: CAJERO | ADMINISTRADOR

// PATCH /admin/staff/:userId/toggle-status
await toggleStaffStatus(userId)
```

### Configuración — Reglas de negocio

```javascript
// GET /admin/config
const configs = await getConfig()

// PUT /admin/config/:key
await upsertConfig(key, value, description?)
```

Parámetros editables: `POINTS_RATE`, `PREMIUM_VISITS_THRESHOLD`, `GOLDEN_VISITS_THRESHOLD`, `DISCOUNT_TICKET_PREMIUM`, `DISCOUNT_CANDY_PREMIUM`, `DISCOUNT_TICKET_GOLDEN`, `DISCOUNT_CANDY_GOLDEN`.

### Auditoría — Actividad del sistema

```javascript
// GET /admin/audit-logs?action=&entity=&from=&to=&page=&limit=20
const result = await getAuditLogs(params)
// result.data  → array de logs con { action, entity, entityId, oldValue, newValue, user, createdAt }
// result.meta  → paginación
```

La página muestra un feed de actividad con descripciones legibles, filtros por tipo de acción (chips) y panel diff antes/después expandible.

### Merchandising — Stock de kits Golden

```javascript
// GET /merchandise
const items = await getMerchandise()

// PATCH /merchandise/:id/stock  → ingresar o retirar stock
await updateStock(id, delta)  // delta positivo: ingreso, negativo: retiro
```

> El stock se descuenta automáticamente al registrar o subir a nivel Golden. El endpoint `POST /merchandise/deliver` está disponible para entregas manuales de reemplazo.

---

## Manejo de errores

El backend siempre devuelve el mismo formato:

```json
{
  "success": false,
  "error": "El DNI ya está registrado",
  "errors": {
    "campo": ["descripción del error de validación"]
  }
}
```

Patrón usado en todas las páginas:

```javascript
try {
  const data = await apiCall(...)
} catch (err) {
  const mensaje = err.response?.data?.error || 'Error inesperado'
  const erroresCampos = err.response?.data?.errors  // errores por campo (validación)
  setError(mensaje)
}
```

---

## Rate limiting

Los limitadores están **deshabilitados en desarrollo** (`NODE_ENV=development`). En producción aplican:

| Limitador | Límite | Aplica a |
|---|---|---|
| General | 300 req / 15min por IP | Toda la API |
| Auth | 10 intentos fallidos / 15min | `POST /auth/login` (siempre activo) |
| POS | 1000 req / 15min | Endpoints `/pos/*` |
| Reportes | 60 req / hora | Endpoints `/reports/*` |

---

## Paginación

Los endpoints de lista usan paginación estándar:

```
GET /members?page=1&limit=20
```

Respuesta con objeto `meta`:
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
