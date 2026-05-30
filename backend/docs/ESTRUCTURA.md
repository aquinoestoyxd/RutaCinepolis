# Estructura del proyecto

Explicación detallada de cada carpeta y archivo del backend de Ruta Cinépolis.

---

## Vista general

```
backend/
├── docs/                   ← Documentación del proyecto
├── prisma/                 ← Base de datos: schema y migraciones
├── src/                    ← Código fuente del servidor
│   ├── config/             ← Configuración global
│   ├── modules/            ← Lógica de negocio por dominio
│   └── shared/             ← Código reutilizable entre módulos
├── .env.example            ← Plantilla de variables de entorno
├── .gitignore              ← Archivos que Git ignora
├── docker-compose.yml      ← Contenedores para desarrollo local
├── Dockerfile              ← Imagen para producción (AWS)
├── Dockerfile.dev          ← Imagen para desarrollo local
├── jest.config.ts          ← Configuración de tests
├── package.json            ← Dependencias y scripts npm
└── tsconfig.json           ← Configuración de TypeScript
```

---

## Archivos raíz

### `package.json`
Define las dependencias del proyecto y los scripts `npm run ...`. Contiene dos tipos de dependencias:
- **dependencies:** librerías que se usan en producción (Express, Prisma, JWT, etc.)
- **devDependencies:** librerías solo para desarrollo (TypeScript, Jest, ESLint, etc.)

### `tsconfig.json`
Le dice al compilador de TypeScript cómo transformar el código `.ts` a `.js`. Configura:
- `strict: true` — activa todas las verificaciones de tipos estrictas
- `outDir: ./dist` — dónde guardar el código compilado
- `paths` — alias de importación (`@config/`, `@modules/`, `@shared/`)

### `docker-compose.yml`
Define los servicios que corren en contenedores Docker para desarrollo local:
- **postgres** — Base de datos PostgreSQL en el puerto 5434
- **pgadmin** — Interfaz visual de la BD en el puerto 5051
- **backend** — El servidor Node.js (opcional, se puede correr con `npm run dev`)

### `Dockerfile` y `Dockerfile.dev`
- **`Dockerfile`** — Optimizado para producción en AWS. Compila TypeScript, crea una imagen liviana con solo el código necesario y corre como usuario no-root por seguridad.
- **`Dockerfile.dev`** — Para desarrollo local. No compila, usa `ts-node-dev` para hot reload.

### `.env.example`
Plantilla con todas las variables de entorno que el proyecto necesita. Cada desarrollador copia este archivo como `.env` y completa sus propios valores. El `.env` nunca se sube a Git.

---

## `prisma/`

```
prisma/
├── schema.prisma   ← Define todas las tablas de la BD
├── seed.ts         ← Carga datos iniciales
└── init.sql        ← Extensiones de PostgreSQL necesarias
```

### `schema.prisma`
El corazón de la base de datos. Define 13 modelos (tablas):

| Modelo | Tabla en BD | Qué almacena |
|---|---|---|
| `User` | `users` | Credenciales de acceso y rol |
| `Member` | `members` | Datos personales del miembro RC |
| `Level` | `levels` | Los 3 niveles: Estándar, Premium, Golden |
| `Membership` | `memberships` | Estado actual: nivel, puntos, visitas |
| `Benefit` | `benefits` | Catálogo de beneficios disponibles |
| `LevelBenefit` | `level_benefits` | Qué beneficio corresponde a qué nivel |
| `Transaction` | `transactions` | Cada compra o canje registrado |
| `Redemption` | `redemptions` | Canjes de beneficios realizados |
| `Merchandise` | `merchandise` | Inventario del kit Golden |
| `MerchandiseDelivery` | `merchandise_deliveries` | Entregas de kits registradas |
| `Notification` | `notifications` | Mensajes al miembro |
| `AuditLog` | `audit_logs` | Registro de todas las acciones del sistema |
| `SystemConfig` | `system_configs` | Reglas de negocio configurables |
| `PosOfflineQueue` | `pos_offline_queue` | Transacciones POS sin conexión pendientes |

### `seed.ts`
Script que carga los datos base que el sistema necesita para funcionar:
- Niveles Estándar, Premium y Golden con sus configuraciones
- Beneficios de cada nivel (descuentos 20%/30%, avant-premières, sala premium, kit Golden)
- Asignación de beneficios a niveles
- Parámetros de negocio (tasa de puntos 5%, umbral Premium 10 visitas, Golden 25 visitas)
- Usuarios de prueba: admin y cajero

---

## `src/`

### `src/server.ts`
Punto de entrada del servidor. Hace cuatro cosas:
1. Conecta a la base de datos
2. Crea la aplicación Express
3. Pone el servidor a escuchar en el puerto configurado
4. Maneja el cierre limpio (cuando haces Ctrl+C, espera que terminen las peticiones antes de apagarse)

### `src/app.ts`
Configura Express con todos los middlewares y registra las rutas de los módulos. Se separa de `server.ts` para poder importar la app en los tests sin que arranque el servidor real.

Middlewares que aplica en orden:
1. `helmet` — cabeceras de seguridad HTTP
2. `cors` — permite peticiones desde el frontend
3. `compression` — comprime las respuestas para que sean más rápidas
4. `express.json` — parsea el body JSON de las peticiones
5. `requestId` — asigna un ID único a cada petición para el log
6. `morgan` — log de cada petición HTTP
7. `generalLimiter` — rate limiting global (100 peticiones cada 15 min por IP)

---

## `src/config/`

### `env.ts`
Lee todas las variables del archivo `.env` y las valida con Zod al arrancar el servidor. Si alguna variable crítica falta o tiene formato incorrecto, el servidor falla inmediatamente con un mensaje claro en lugar de explotar silenciosamente en producción.

Variables que valida: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `CORS_ORIGINS`, y más.

### `database.ts`
Crea una única instancia de `PrismaClient` que toda la aplicación comparte. Sin este singleton, cada módulo crearía su propia conexión y se agotaría el pool de conexiones de PostgreSQL.

---

## `src/shared/`

Código que usan todos los módulos. No contiene lógica de negocio específica.

### `shared/middleware/`

| Archivo | Qué hace |
|---|---|
| `authenticate.middleware.ts` | Verifica el token JWT en el header `Authorization`. Si el token no existe, expiró o es inválido, devuelve 401 y la petición no llega al controller. |
| `rbac.middleware.ts` | Control de acceso por roles. Verifica que el usuario tenga el rol necesario para el endpoint. Ej: solo CAJERO puede registrar compras, solo ADMIN puede ver reportes. |
| `validate.middleware.ts` | Valida el body, params o query de la petición con un schema Zod. Si los datos no cumplen el formato, devuelve 400 con los errores detallados antes de tocar la BD. |
| `rateLimiter.middleware.ts` | Limita la cantidad de peticiones por IP. Define 4 limitadores: general (100/15min), auth (10 intentos de login/15min), POS (500/15min, más permisivo), reportes (30/hora). |
| `errorHandler.middleware.ts` | Captura todos los errores de la aplicación en un punto central. Convierte errores de Prisma (duplicados, no encontrado), Zod y propios en respuestas JSON consistentes con el código HTTP correcto. |
| `requestId.middleware.ts` | Asigna un UUID único a cada petición. Se incluye en los logs y en el header `X-Request-ID` de la respuesta para poder rastrear peticiones específicas. |

### `shared/utils/`

| Archivo | Qué hace |
|---|---|
| `logger.ts` | Configura Winston para escribir logs en consola (desarrollo) y en archivos `logs/combined.log` y `logs/error.log` (producción). Formato JSON para fácil análisis en AWS CloudWatch. |
| `apiResponse.ts` | Clase `ResponseHelper` con métodos estáticos para devolver respuestas JSON con formato uniforme: `{ success, data, message, timestamp, requestId }`. Todos los controllers la usan. |
| `pagination.ts` | Extrae los parámetros `?page=1&limit=20` de la URL y calcula el `skip` para Prisma. Limita el máximo a 100 registros por página. |
| `cardGenerator.ts` | Genera números de tarjeta RC de 16 dígitos con prefijo `5890` (Cinépolis Perú) y dígito de control Luhn (el mismo algoritmo que usan las tarjetas de crédito para detectar errores tipográficos). |
| `errorTypes.ts` | Clases de error personalizadas: `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409), `ValidationError` (400), `BusinessRuleError` (422). El `errorHandler` las convierte al código HTTP correcto. |

### `shared/types/`

| Archivo | Qué hace |
|---|---|
| `enums.ts` | Todos los enums del sistema en TypeScript: `UserRole`, `LevelName`, `TransactionType`, `MemberStatus`, etc. Deben coincidir exactamente con los enums del `schema.prisma`. |
| `express.d.ts` | Extiende el tipo `Request` de Express para agregar `req.user` (datos del usuario autenticado) y `req.requestId`. Sin esto TypeScript no reconocería esos campos. |

---

## `src/modules/`

Cada módulo agrupa todo lo relacionado a un dominio de negocio. Cada uno tiene la misma estructura interna de 4 archivos:

```
modulo/
├── modulo.schema.ts      ← Zod: define qué datos acepta el endpoint
├── modulo.service.ts     ← Lógica de negocio + consultas a Prisma
├── modulo.controller.ts  ← Recibe request, llama service, devuelve response
└── modulo.routes.ts      ← URLs, métodos HTTP y middlewares aplicados
```

**Flujo de una petición:**
```
Request HTTP → routes → [authenticate] → [rbac] → [validate] → controller → service → Prisma → PostgreSQL
                                                                           ↑
                                                               Si hay error, lo captura errorHandler
```

### Módulo `auth/`
Gestiona la autenticación del sistema. Emite tokens JWT al hacer login. El token de acceso dura 8 horas, el refresh token 7 días. Registra cada login/logout en `audit_logs`.

### Módulo `members/`
CRUD de miembros RC. Al registrar un miembro nuevo: valida DNI único, crea el usuario en `users`, crea el miembro en `members`, lo asigna al nivel Estándar en `memberships` y genera un número de tarjeta único.

### Módulo `membership/`
Gestiona los niveles y el progreso del miembro. Contiene la lógica de upgrade automático (RC-F06): después de cada transacción verifica si el miembro alcanzó el umbral de visitas para subir de nivel. Si llega a Golden, notifica al administrador para gestionar el kit.

### Módulo `points/`
Acreditación de puntos por compra (CU-03). Calcula `puntos = monto × 5% × multiplicador_del_nivel`. La operación es atómica: si falla la actualización de puntos, la transacción completa se revierte (rollback). Incluye endpoint para ajuste manual de puntos por el administrador con registro en auditoría.

### Módulo `benefits/`
CRUD del catálogo de beneficios. Cada beneficio se asigna a uno o más niveles. Los beneficios pueden tener fecha de vigencia, costo en puntos y tipo de descuento (porcentaje o monto fijo).

### Módulo `redemptions/`
Procesamiento de canjes (CU-06). Verifica que el miembro tenga saldo suficiente, que el beneficio esté vigente y disponible para su nivel, descuenta los puntos y registra el canje. Todo en una transacción atómica: si la entrega del beneficio falla, los puntos se restauran.

### Módulo `merchandise/`
Gestión del inventario del kit Golden (RC-F07). Controla el stock, registra entregas y genera alertas cuando el stock baja del umbral mínimo. Solo permite entregar a miembros que hayan alcanzado nivel Golden.

### Módulo `notifications/`
Servicio interno de notificaciones. Los demás módulos lo llaman para crear notificaciones cuando ocurren eventos: puntos acreditados, upgrade de nivel, canje exitoso, entrega de kit.

### Módulo `pos/`
Integración con los terminales de punto de venta (CU-02, CU-03). Diseñado para responder en menos de 2 segundos. Incluye soporte offline: cuando el POS pierde conexión, las transacciones se guardan localmente y se sincronizan cuando vuelve la conectividad.

### Módulo `reports/`
Dashboard KPI y reportes exportables (CU-08). Usa agregaciones paralelas con `Promise.all()` para responder en menos de 5 segundos con hasta 19,600 miembros. Incluye: distribución por nivel, ingresos por período, crecimiento de miembros, estado del stock.

### Módulo `admin/`
Panel de administración. Permite al administrador configurar las reglas de negocio del sistema (tasa de puntos, umbrales de nivel, descuentos) sin tocar código. Cada cambio queda registrado en `audit_logs` con el identificador del admin y la marca de tiempo (RC-F24). También gestiona los usuarios de staff (cajeros y administradores).
