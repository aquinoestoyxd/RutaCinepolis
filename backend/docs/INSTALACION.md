# Instalación y ejecución local

Guía completa para correr el proyecto Ruta Cinépolis (backend + frontend) en tu máquina.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 20 | `node --version` |
| npm | 9 | `npm --version` |
| Docker Desktop | — | `docker --version` |
| Git | — | `git --version` |

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/aquinoestoyxd/RutaCinepolis.git
cd RutaCinepolis
git checkout backend-emmy
```

La rama `backend-emmy` contiene el monorepo completo:
```
RutaCinepolis/
├── backend/    ← API REST
└── frontend/   ← Panel web
```

---

## Paso 2 — Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

---

## Paso 3 — Configurar variables de entorno del backend

```bash
cd backend
cp .env.example .env
```

Abre `.env` y verifica los valores principales:

```env
PORT=3001
DATABASE_URL="postgresql://cinepolis:cinepolis_secret@localhost:5434/cinepolis_rc"
DB_PORT=5434

# Cámbia estos por cadenas de al menos 32 caracteres
JWT_SECRET=cambia_esto_por_una_cadena_secreta_larga
JWT_REFRESH_SECRET=otro_secreto_diferente_al_anterior
```

> El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

---

## Paso 4 — Levantar la base de datos con Docker

```bash
cd backend
docker-compose up postgres -d

# Verifica que esté corriendo
docker ps | grep cinepolis_db
```

Deberías ver `cinepolis_db` con estado `healthy`.

**Puertos que usa el proyecto (sin conflicto):**
| Servicio | Puerto |
|---|---|
| PostgreSQL | `5434` |
| Backend API | `3001` |
| Frontend dev | `5173` |
| pgAdmin | `5051` |

---

## Paso 5 — Crear las tablas en la base de datos

```bash
cd backend
npm run prisma:migrate
```

Prisma pedirá un nombre para la migración. Escribe `init_schema` y presiona Enter.

---

## Paso 6 — Cargar datos iniciales

```bash
cd backend
npm run prisma:seed
```

Carga:
- Niveles Estándar, Premium y Golden
- Beneficios de cada nivel (descuentos, avant-premières, kit Golden)
- Configuración del sistema (tasa de puntos 5%, umbrales de visitas)
- Usuarios de prueba

**Credenciales de acceso:**

| Email | Contraseña | Rol |
|---|---|---|
| `admin@cinepolis.com.pe` | `Admin123!` | ADMINISTRADOR |
| `cajero@cinepolis.com.pe` | `Cajero123!` | CAJERO |

---

## Paso 7 — Iniciar el backend

```bash
cd backend
npm run dev
```

Verifica en el navegador:
- `http://localhost:3001/health` → `{ "status": "ok" }`
- `http://localhost:3001/api/docs` → Swagger con todos los endpoints

---

## Paso 8 — Iniciar el frontend

En una **nueva terminal**:

```bash
cd frontend
npm run dev
```

Abre `http://localhost:5173` en el navegador.

Usa las credenciales del Paso 6 para ingresar:
- **Administrador** → redirige a `/admin/dashboard`
- **Cajero** → redirige a `/cajero/buscar`

> El frontend usa el proxy de Vite para enviar todas las peticiones `/api` al backend en `localhost:3001`. No es necesario ninguna configuración de CORS adicional en desarrollo.

---

## Herramientas opcionales

### Prisma Studio — editor visual de la BD
```bash
cd backend
npm run prisma:studio
# Abre http://localhost:5555
```

### pgAdmin — cliente completo de PostgreSQL
Levanta el servicio:
```bash
cd backend
docker-compose up pgadmin -d
```
Accede a `http://localhost:5051`:
- Email: `admin@cinepolis.com`
- Contraseña: `admin123`

Conecta al servidor con: Host `postgres`, Puerto `5432`, BD `cinepolis_rc`, Usuario `cinepolis`, Contraseña `cinepolis_secret`.

---

## Solución de problemas

### "Authentication failed against database server"
La base de datos no está corriendo:
```bash
cd backend && docker-compose up postgres -d
```

### "Port 5434 already in use"
Cambia el puerto en `backend/.env` y `backend/docker-compose.yml` por uno libre (ej: `5435`).

### "JWT_SECRET must be at least 32 characters"
Abre `backend/.env` y reemplaza `JWT_SECRET` por una cadena aleatoria de más de 32 caracteres.

### Error en `prisma:migrate` — "Table already exists"
Las tablas ya fueron creadas. Ejecuta directamente:
```bash
npx prisma migrate deploy
```

### El frontend muestra "Sin conexión con el servidor"
Verifica que el backend esté corriendo en `localhost:3001`:
```bash
curl http://localhost:3001/health
```

---

## Detener el proyecto

```bash
# Backend: Ctrl+C en la terminal donde corre npm run dev
# Frontend: Ctrl+C en la terminal donde corre npm run dev

# Detener PostgreSQL
cd backend
docker-compose stop postgres

# Detener y eliminar contenedores (los datos se conservan)
docker-compose down
```
