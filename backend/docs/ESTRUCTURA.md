# Estructura del proyecto

Explicación detallada de cada carpeta y archivo del monorepo Ruta Cinépolis.

---

## Vista general del monorepo

```
RutaCinepolis/                  ← raíz del repositorio
├── backend/                    ← API REST (Node.js + TypeScript + Express + Prisma)
│   ├── docs/                   ← Esta documentación
│   ├── prisma/                 ← Base de datos: schema, migraciones y seed
│   ├── src/                    ← Código fuente del servidor
│   │   ├── config/             ← Configuración global (env, DB)
│   │   ├── modules/            ← Lógica de negocio por dominio
│   │   └── shared/             ← Middlewares, utilidades y tipos compartidos
│   ├── .env.example            ← Plantilla de variables de entorno
│   ├── docker-compose.yml      ← Contenedores para desarrollo local
│   ├── Dockerfile              ← Imagen para producción
│   ├── jest.config.ts          ← Configuración de tests
│   ├── package.json            ← Dependencias y scripts npm
│   └── tsconfig.json           ← Configuración TypeScript
│
├── frontend/                   ← Panel web (React 18 + Vite + Recharts)
│   ├── src/
│   │   ├── api/                ← Cliente HTTP (axios + funciones por dominio)
│   │   ├── components/         ← Layouts reutilizables (Admin, Cajero)
│   │   ├── context/            ← AuthContext (sesión global)
│   │   └── pages/              ← Páginas por rol
│   │       ├── admin/          ← Dashboard, Miembros, Beneficios, Reportes…
│   │       └── cajero/         ← Buscar, Registrar, Compra, Canje
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          ← Proxy /api → backend:3001
│
└── tsconfig.json               ← Raíz del workspace (referencia a backend/)
```

---

## `backend/` — Archivos raíz

### `package.json`
Define las dependencias y los scripts `npm run ...`. Dos tipos de dependencias:
- **dependencies:** librerías en producción (Express, Prisma, JWT, bcrypt…)
- **devDependencies:** solo desarrollo (TypeScript, Jest, ESLint…)

### `tsconfig.json`
Configura el compilador TypeScript del backend:
- `composite: true` — habilita referencias de proyecto (necesario para el tsconfig raíz del monorepo)
- `strict: true` — verificaciones de tipos estrictas
- `outDir: ./dist` — código compilado para producción
- `paths` — alias de importación (`@config/`, `@modules/`, `@shared/`)
- `ignoreDeprecations: "5.0"` — silencia warnings de opciones heredadas compatibles con el runtime actual

### `docker-compose.yml`
Servicios Docker para desarrollo local:
- **postgres** — PostgreSQL en el puerto `5434`
- **pgadmin** — Interfaz visual de la BD en el puerto `5051`

### `Dockerfile` y `Dockerfile.dev`
- **`Dockerfile`** — Imagen de producción. Compila TypeScript, copia solo `dist/` y `node_modules` de producción.
- **`Dockerfile.dev`** — Imagen de desarrollo con hot reload vía `ts-node-dev`.

### `.env.example`
Plantilla con todas las variables de entorno. Cada desarrollador copia este archivo como `.env`. El `.env` nunca se sube a Git.

---

## `backend/prisma/`

```
prisma/
├── schema.prisma   ← Define los 14 modelos de la BD
├── seed.ts         ← Carga datos iniciales (niveles, beneficios, usuarios)
└── init.sql        ← Extensiones PostgreSQL necesarias al crear la BD
```

### `schema.prisma`
El corazón de la base de datos. Define 14 modelos:

| Modelo | Tabla | Qué almacena |
|---|---|---|
| `User` | `users` | Credenciales de cajeros y administradores |
| `Member` | `members` | Datos personales del miembro RC |
| `Level` | `levels` | Los 3 niveles: Estándar, Premium, Golden |
| `Membership` | `memberships` | Estado actual: nivel, puntos, visitas totales |
| `Benefit` | `benefits` | Catálogo de beneficios disponibles |
| `LevelBenefit` | `level_benefits` | Asignación beneficio ↔ nivel (N:M) |
| `Transaction` | `transactions` | Cada compra o canje registrado |
| `Redemption` | `redemptions` | Canjes de beneficios realizados |
| `Merchandise` | `merchandise` | Inventario del kit de bienvenida Golden |
| `MerchandiseDelivery` | `merchandise_deliveries` | Entregas de kits registradas con stock |
| `Notification` | `notifications` | Mensajes al miembro (puntos, nivel, bienvenida) |
| `AuditLog` | `audit_logs` | Registro completo de acciones del sistema |
| `SystemConfig` | `system_configs` | Reglas de negocio configurables en caliente |
| `PosOfflineQueue` | `pos_offline_queue` | Transacciones POS sin conexión pendientes |

### `seed.ts`
Carga los datos base necesarios para que el sistema funcione:
- Niveles Estándar, Premium y Golden con multiplicadores de puntos (×1, ×1.5, ×2)
- Beneficios de cada nivel: descuentos 20%/30%, avant-premières, sala premium, kit Golden
- IDs de beneficios en formato UUID válido para compatibilidad con la validación del API
- Configuración del sistema: tasa de puntos 5%, umbrales 10/25 visitas para Premium/Golden
- Usuarios de prueba: administrador y cajero

---

## `backend/src/`

### `src/server.ts`
Punto de entrada. Conecta la BD, crea la app Express, arranca el servidor y maneja el cierre limpio (`SIGTERM`/`SIGINT`).

### `src/app.ts`
Configura Express con middlewares en orden:
1. `helmet` — cabeceras de seguridad HTTP
2. `cors` — acepta peticiones del frontend (puertos 5173, 4200, 3001)
3. `compression` — comprime respuestas
4. `express.json` — parsea body JSON
5. `requestId` — UUID único por petición para trazabilidad
6. `morgan` — log HTTP
7. `generalLimiter` — rate limiting por IP (**solo activo en producción**: 300 req/15min)

---

## `backend/src/config/`

### `env.ts`
Lee y valida todas las variables de `.env` con Zod al arrancar. Si falta una variable crítica, el servidor falla inmediatamente con un mensaje claro.

### `database.ts`
Singleton de `PrismaClient`. Evita agotar el pool de conexiones PostgreSQL compartiendo una única instancia en toda la aplicación.

---

## `backend/src/shared/`

### `shared/middleware/`

| Archivo | Qué hace |
|---|---|
| `authenticate.middleware.ts` | Verifica el JWT en `Authorization: Bearer`. Rechaza con 401 si falta, expiró o es inválido. Expone `req.user` con `id`, `email`, `role` y `memberId?`. |
| `rbac.middleware.ts` | Control de acceso por roles (`requireAdmin`, `requireCajero`). Devuelve 403 si el rol no tiene permiso. |
| `validate.middleware.ts` | Valida body/params/query con schema Zod antes de llegar al controller. Devuelve 400 con errores por campo. |
| `rateLimiter.middleware.ts` | 4 limitadores: general (300/15min), auth (10 intentos fallidos/15min, siempre activo), POS (1000/15min), reportes (60/hora). Los 3 primeros se deshabilitan en `NODE_ENV=development`. |
| `errorHandler.middleware.ts` | Punto central de errores. Convierte `AppError`, `ZodError` y errores Prisma (P2002, P2025) en respuestas JSON consistentes. |
| `requestId.middleware.ts` | UUID por petición incluido en logs y en el header `X-Request-ID`. |

### `shared/utils/`

| Archivo | Qué hace |
|---|---|
| `apiResponse.ts` | `ResponseHelper` con métodos estáticos: `success`, `created`, `paginated`, `error`. Formato uniforme `{ success, data, message, meta, timestamp, requestId }`. |
| `pagination.ts` | Extrae `?page` y `?limit` de la URL, calcula `skip` para Prisma. Máximo 100 registros por página. |
| `cardGenerator.ts` | Genera números de tarjeta RC de 16 dígitos con prefijo `5890` (Cinépolis Perú) y dígito de control Luhn. |
| `errorTypes.ts` | Clases de error: `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409), `ValidationError` (400), `BusinessRuleError` (422). |
| `logger.ts` | Winston: consola en desarrollo, archivos `logs/combined.log` y `logs/error.log` en producción. Formato JSON para AWS CloudWatch. |

### `shared/types/`

| Archivo | Qué hace |
|---|---|
| `enums.ts` | Todos los enums del sistema: `UserRole`, `LevelName`, `TransactionType`, `MemberStatus`, etc. Deben coincidir con los enums del schema Prisma. |
| `express.d.ts` | Extiende `Request` de Express para agregar `req.user` (con `id`, `email`, `role`, `memberId?`) y `req.requestId`. |

---

## `backend/src/modules/`

Cada módulo agrupa todo lo relacionado a un dominio. Estructura interna estándar:

```
modulo/
├── modulo.schema.ts      ← Zod: define y valida el input del endpoint
├── modulo.service.ts     ← Lógica de negocio + consultas Prisma
├── modulo.controller.ts  ← Recibe request, llama service, devuelve response
└── modulo.routes.ts      ← URLs, métodos HTTP y middlewares
```

**Flujo de una petición:**
```
Request → routes → [authenticate] → [rbac] → [validate] → controller → service → Prisma → PostgreSQL
                                                                      ↑
                                                          errores → errorHandler
```

### `auth/`
Autenticación del sistema. Login devuelve `accessToken` (8h) + `refreshToken` (7d). Registra LOGIN/LOGOUT en `audit_logs`. Solo `authLimiter` aplica siempre (10 intentos fallidos / 15min).

### `members/`
CRUD de miembros RC. Al registrar: valida DNI único, crea miembro y membresía en el nivel elegido, genera número de tarjeta con Luhn, envía notificación de bienvenida. **Si el nivel es Golden, entrega automáticamente el kit de merchandising** via `autoDeliverGoldenKit`.

### `membership/`
Niveles y progreso del miembro. Contiene la lógica de **upgrade automático** (RC-F06): después de cada transacción, verifica si el miembro alcanzó el umbral de visitas para subir de nivel. **Si sube a Golden, entrega automáticamente el kit de bienvenida** y envía notificación.

### `points/`
Acreditación de puntos (CU-03). Calcula `puntos = monto × 5% × multiplicador_nivel`. Operación atómica: si falla la BD, no se modifican puntos ni visitas. Incluye ajuste manual por el admin con registro en auditoría.

### `benefits/`
CRUD del catálogo de beneficios. Cada beneficio se asigna a uno o más niveles. Soporta vigencia temporal, costo en puntos y tipo de descuento (porcentaje o monto fijo).

### `redemptions/`
Procesamiento de canjes (CU-06). Verifica membresía activa, saldo suficiente, beneficio vigente y disponible para el nivel. Descuenta puntos y registra el canje en una transacción atómica.

### `merchandise/`
Inventario del kit Golden (RC-F07). Método `autoDeliverGoldenKit(memberId, staffId)` con protecciones de idempotencia: no entrega si stock es 0, si no hay kit activo, o si el miembro ya lo recibió. El endpoint `POST /merchandise/deliver` permite entregas manuales de reemplazo sin restricción de duplicado.

### `notifications/`
Servicio interno de notificaciones. Los demás módulos lo llaman al ocurrir eventos: puntos acreditados, upgrade de nivel, canje exitoso, entrega de kit, bienvenida.

### `pos/`
Integración con terminales de punto de venta (CU-02, CU-03). Diseñado para responder en menos de 2 segundos. `lookupByCard` devuelve el miembro siempre (activo o inactivo) para que el cajero pueda ver su estado. La restricción de miembro activo aplica solo al procesar una transacción. Soporta modo offline con cola de sincronización.

### `reports/`
Dashboard KPI y reportes (CU-08). Usa `Promise.all` para consultas paralelas. Los rate limits de reportes se deshabilitan en desarrollo para no bloquear al admin.

### `admin/`
Configuración del sistema en caliente sin tocar código (RC-F24). Cada cambio de configuración queda en `audit_logs`. También gestiona usuarios de staff (cajeros y administradores).

---

## `frontend/`

Panel web que consume el API REST del backend.

### `frontend/src/api/`

| Archivo | Qué hace |
|---|---|
| `axios.js` | Instancia de axios con `baseURL: /api/v1`, interceptor que adjunta el token JWT en cada petición, y auto-renovación del token al recibir 401. Usa las claves `rc_token` y `rc_refresh` en localStorage. |
| `index.js` | Funciones exportadas por dominio (`login`, `getMembers`, `posTransaction`, etc.) que encapsulan las llamadas HTTP. Las funciones de endpoints paginados devuelven `r.data` completo (para acceder a `meta`); las de item único devuelven `r.data.data`. |

### `frontend/src/context/`
`AuthContext.jsx` — Proveedor React que expone `{ user, login, logout, loading }`. Persiste sesión en localStorage. Al hacer login guarda `rc_token`, `rc_refresh` y `rc_user`.

### `frontend/src/components/Layout/`
- `AdminLayout.jsx` — Sidebar de navegación para administradores. Rutas a Dashboard, Miembros, Beneficios, Merchandising, Reportes, Staff, Configuración y Auditoría.
- `CajeroLayout.jsx` — Sidebar para cajeros. Rutas a Buscar, Registrar, Compra y Canje.

### `frontend/src/pages/admin/`

| Página | Qué hace |
|---|---|
| `AdminDashboard.jsx` | KPIs totales, distribución por nivel (pie chart), crecimiento mensual (area chart) y top 5 gastadores. |
| `Miembros.jsx` | Tabla paginada con búsqueda y filtros. Modales para cambiar estado y ajustar puntos. |
| `Beneficios.jsx` | CRUD de beneficios con asignación a niveles. |
| `Reportes.jsx` | Transacciones por tipo (bar chart), por origen, y volumen diario. |
| `Staff.jsx` | Cards de usuarios de staff con toggle activo/inactivo y creación. |
| `Merchandising.jsx` | Inventario de kits Golden con alertas de stock bajo y ajuste de lotes. |
| `Configuracion.jsx` | Editor en línea de todos los parámetros de negocio (tasa de puntos, umbrales de nivel, descuentos). |
| `Auditoria.jsx` | Feed de actividad del sistema con filtros por tipo de acción (chips), búsqueda por entidad, rango de fechas, y panel diff antes/después expandible. |

### `frontend/src/pages/cajero/`

| Página | Qué hace |
|---|---|
| `BuscarMiembro.jsx` | Búsqueda por número de tarjeta RC. Muestra perfil, nivel, puntos y barra de progreso. Si el miembro está inactivo/suspendido muestra banner de aviso. Acciones rápidas con navegación React Router. |
| `RegistrarMiembro.jsx` | Formulario de registro con selección de nivel, validación por campo y pantalla de confirmación con número de tarjeta generado. |
| `RegistrarCompra.jsx` | Flujo 2 pasos: identificar miembro por tarjeta → ingresar monto y tipo (entrada/dulcería). Preview de descuento y puntos a acreditar según nivel. |
| `AplicarCanje.jsx` | Búsqueda de miembro → lista de beneficios disponibles para su nivel con costo en puntos. Confirmación con saldo resultante. |

### `frontend/vite.config.js`
Configura el servidor de desarrollo en el puerto `5173` con un proxy que redirige todas las peticiones `/api` al backend en `localhost:3001`. Esto evita problemas de CORS en desarrollo sin necesitar configuración adicional.
