# Endpoints de la API

URL base: `http://localhost:3001/api/v1`

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <token>
```

El token se obtiene en `POST /auth/login`.

---

## Auth — Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Iniciar sesión. Devuelve `accessToken` y `refreshToken` |
| `POST` | `/auth/refresh` | Público | Renovar el accessToken usando el refreshToken |
| `POST` | `/auth/logout` | Autenticado | Cerrar sesión (registra en auditoría) |
| `PUT` | `/auth/change-password` | Autenticado | Cambiar contraseña |
| `GET` | `/auth/me` | Autenticado | Ver datos del usuario autenticado |

**Ejemplo de login:**
```json
POST /auth/login
{
  "email": "admin@cinepolis.com.pe",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "ADMINISTRADOR" },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": "8h"
    }
  }
}
```

---

## Members — Miembros

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/members/register` | Público | Registrar nuevo miembro (CU-01) |
| `GET` | `/members/me` | CLIENTE | Ver mi perfil RC |
| `GET` | `/members` | ADMIN | Listar todos los miembros con filtros |
| `GET` | `/members/card/:cardNumber` | CAJERO | Buscar miembro por número de tarjeta |
| `GET` | `/members/:id` | Dueño/ADMIN | Ver miembro por ID |
| `PUT` | `/members/:id` | Dueño/ADMIN | Actualizar datos del perfil |
| `PATCH` | `/members/:id/status` | ADMIN | Activar, desactivar o suspender miembro |

**Filtros disponibles en `GET /members`:**
```
?search=Ana          → busca por nombre, DNI o tarjeta
?status=ACTIVE       → ACTIVE | INACTIVE | SUSPENDED
?levelName=PREMIUM   → ESTANDAR | PREMIUM | GOLDEN
?page=1&limit=20     → paginación
```

**Ejemplo registro:**
```json
POST /members/register
{
  "dni": "12345678",
  "firstName": "Ana",
  "lastName": "García",
  "email": "ana@gmail.com",
  "phone": "987654321",
  "birthDate": "1995-03-15",
  "password": "MiPass123"
}
```

---

## Membership — Niveles y Membresía

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/membership/levels` | Público | Ver los 3 niveles y sus beneficios |
| `GET` | `/membership/my` | CLIENTE | Ver mi nivel actual y progreso |
| `GET` | `/membership/:memberId` | CAJERO | Ver membresía de un miembro |

**Respuesta de `/membership/my`:**
```json
{
  "points": 1250,
  "totalVisits": 8,
  "level": { "name": "PREMIUM", "displayName": "Premium" },
  "progress": {
    "currentVisits": 8,
    "visitsToNextLevel": 17,
    "nextLevel": "GOLDEN"
  }
}
```

---

## Points — Puntos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/points/earn` | CAJERO | Acreditar puntos por compra (CU-03) |
| `GET` | `/points/my-balance` | CLIENTE | Ver mi saldo actual |
| `GET` | `/points/my-history` | CLIENTE | Ver mi historial de transacciones |
| `GET` | `/points/:memberId/balance` | CAJERO | Ver saldo de un miembro |
| `GET` | `/points/:memberId/history` | CAJERO | Ver historial de un miembro |
| `POST` | `/points/:memberId/adjust` | ADMIN | Ajuste manual de puntos |

**Cálculo de puntos:** `puntos = monto × 5% × multiplicador_nivel`
- Estándar: ×1.0
- Premium: ×1.5
- Golden: ×2.0

**Ejemplo acreditar puntos:**
```json
POST /points/earn
{
  "memberId": "uuid-del-miembro",
  "amount": 45.50,
  "transactionType": "PURCHASE_TICKET",
  "posId": "POS-LIMA-01"
}
```

**Respuesta:**
```json
{
  "pointsEarned": 2,
  "newBalance": 1252,
  "levelUpgraded": false
}
```

---

## Benefits — Beneficios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/benefits` | Público | Listar beneficios activos |
| `GET` | `/benefits/:id` | Público | Ver detalle de un beneficio |
| `POST` | `/benefits` | ADMIN | Crear nuevo beneficio |
| `PUT` | `/benefits/:id` | ADMIN | Actualizar beneficio |
| `DELETE` | `/benefits/:id` | ADMIN | Desactivar beneficio |

**Filtro por nivel:** `GET /benefits?levelName=GOLDEN`

**Tipos de beneficio (`type`):**
- `DISCOUNT_TICKET` — descuento en entradas
- `DISCOUNT_CANDY` — descuento en dulcería
- `AVANT_PREMIERE` — acceso a avant-premières
- `PREMIUM_ROOM` — acceso a salas premium
- `MERCHANDISE` — kit de bienvenida Golden
- `POINTS_REDEMPTION` — canje de puntos por entrada

---

## Redemptions — Canjes

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/redemptions` | CAJERO | Canjear un beneficio (CU-06) |
| `GET` | `/redemptions/my-history` | CLIENTE | Ver mi historial de canjes |
| `GET` | `/redemptions/:memberId/history` | CAJERO | Ver canjes de un miembro |

**Ejemplo canje:**
```json
POST /redemptions
{
  "memberId": "uuid-del-miembro",
  "benefitId": "uuid-del-beneficio",
  "posId": "POS-LIMA-01"
}
```

El sistema verifica automáticamente:
- Que el miembro tenga puntos suficientes
- Que el beneficio esté vigente
- Que el beneficio corresponda al nivel del miembro

---

## Merchandise — Kit Golden

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/merchandise` | Autenticado | Ver inventario de kits Golden |
| `POST` | `/merchandise/deliver` | CAJERO | Registrar entrega de kit a miembro Golden |
| `GET` | `/merchandise/:memberId/history` | CAJERO | Ver entregas de un miembro |
| `PATCH` | `/merchandise/:id/stock` | ADMIN | Ajustar stock (ingresar nuevo lote) |

---

## Notifications — Notificaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/notifications` | CLIENTE | Ver mis notificaciones |
| `GET` | `/notifications/unread-count` | CLIENTE | Cantidad de notificaciones no leídas |
| `PATCH` | `/notifications/:id/read` | CLIENTE | Marcar una notificación como leída |
| `PATCH` | `/notifications/read-all` | CLIENTE | Marcar todas como leídas |

**Filtro:** `GET /notifications?unread=true` — solo las no leídas

---

## POS — Punto de Venta

Endpoints optimizados para responder en **menos de 2 segundos**.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/pos/lookup` | CAJERO | Consultar miembro por número de tarjeta |
| `POST` | `/pos/transaction` | CAJERO | Registrar compra y acreditar puntos |
| `POST` | `/pos/sync` | CAJERO | Sincronizar transacciones offline |
| `GET` | `/pos/queue` | ADMIN | Ver cola de transacciones offline pendientes |

**Flujo POS en taquilla:**
```
1. Cajero escanea tarjeta → POST /pos/lookup → ver nombre, nivel y puntos
2. Cajero registra venta → POST /pos/transaction → puntos acreditados automáticamente
3. Si no hay internet → POST /pos/sync al recuperar conexión
```

**Ejemplo lookup:**
```json
POST /pos/lookup
{
  "cardNumber": "5890123456789012"
}
```

**Ejemplo sync offline (lote de transacciones):**
```json
POST /pos/sync
{
  "posId": "POS-LIMA-01",
  "transactions": [
    {
      "cardNumber": "5890123456789012",
      "amount": 35.00,
      "transactionType": "PURCHASE_TICKET",
      "occurredAt": "2025-06-15T14:30:00Z"
    }
  ]
}
```

---

## Reports — Reportes

Todos requieren rol **ADMIN**.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/reports/kpi` | Dashboard KPI principal |
| `GET` | `/reports/member-growth` | Crecimiento de miembros por mes |
| `GET` | `/reports/transactions` | Resumen de transacciones por tipo y origen |
| `GET` | `/reports/merchandise-stock` | Estado del inventario Golden |

**Filtros de fecha:** `?from=2025-01-01&to=2025-06-30`

**Respuesta de `/reports/kpi`:**
```json
{
  "summary": {
    "totalMembers": 3420,
    "newMembersThisPeriod": 145,
    "totalRevenue": 89500.00,
    "totalTransactions": 2830,
    "totalPointsEarned": 44750
  },
  "levelDistribution": [
    { "level": "ESTANDAR", "count": 2052, "percentage": 60 },
    { "level": "PREMIUM",  "count": 1026, "percentage": 30 },
    { "level": "GOLDEN",   "count": 342,  "percentage": 10 }
  ]
}
```

---

## Admin — Administración

Todos requieren rol **ADMIN**.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/admin/config` | Ver toda la configuración del sistema |
| `PUT` | `/admin/config/:key` | Actualizar un parámetro |
| `DELETE` | `/admin/config/:key` | Eliminar un parámetro |
| `GET` | `/admin/audit-logs` | Ver log de auditoría completo |
| `GET` | `/admin/staff` | Listar cajeros y administradores |
| `POST` | `/admin/staff` | Crear usuario cajero o admin |
| `PATCH` | `/admin/staff/:userId/toggle-status` | Activar/desactivar usuario de staff |

**Parámetros configurables (`/admin/config`):**

| Clave | Valor por defecto | Descripción |
|---|---|---|
| `POINTS_RATE` | `0.05` | Tasa de acumulación (5% del monto) |
| `PREMIUM_VISITS_THRESHOLD` | `10` | Visitas para alcanzar Premium |
| `GOLDEN_VISITS_THRESHOLD` | `25` | Visitas para alcanzar Golden |
| `DISCOUNT_TICKET_PREMIUM` | `0.20` | Descuento entradas Premium (20%) |
| `DISCOUNT_CANDY_PREMIUM` | `0.10` | Descuento dulcería Premium (10%) |
| `DISCOUNT_TICKET_GOLDEN` | `0.30` | Descuento entradas Golden (30%) |
| `DISCOUNT_CANDY_GOLDEN` | `0.15` | Descuento dulcería Golden (15%) |

**Ejemplo cambiar tasa de puntos:**
```json
PUT /admin/config/POINTS_RATE
{
  "value": "0.08",
  "description": "Aumentado a 8% por campaña de julio"
}
```

---

## Códigos de respuesta

| Código | Significado |
|---|---|
| `200` | Éxito |
| `201` | Creado correctamente |
| `204` | Sin contenido (ej: DELETE exitoso) |
| `400` | Datos de entrada inválidos |
| `401` | No autenticado (token faltante o expirado) |
| `403` | Sin permiso (rol incorrecto) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: DNI ya registrado) |
| `422` | Regla de negocio violada (ej: puntos insuficientes) |
| `429` | Demasiadas peticiones (rate limit) |
| `500` | Error interno del servidor |

---

## Formato estándar de respuesta

Todos los endpoints devuelven el mismo formato JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "Descripción del resultado",
  "timestamp": "2025-06-15T14:30:00.000Z",
  "requestId": "uuid-de-la-peticion"
}
```

En caso de error:
```json
{
  "success": false,
  "error": "Mensaje de error",
  "errors": {
    "campo": ["descripción del error de validación"]
  },
  "timestamp": "2025-06-15T14:30:00.000Z"
}
```
