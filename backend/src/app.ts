import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { env, isProduction } from './config/env';
import { requestId } from './shared/middleware/requestId.middleware';
import { generalLimiter } from './shared/middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.middleware';
import { logger } from './shared/utils/logger';

// Rutas de módulos
import authRoutes from './modules/auth/auth.routes';
import membersRoutes from './modules/members/members.routes';
import membershipRoutes from './modules/membership/membership.routes';
import pointsRoutes from './modules/points/points.routes';
import benefitsRoutes from './modules/benefits/benefits.routes';
import redemptionsRoutes from './modules/redemptions/redemptions.routes';
import merchandiseRoutes from './modules/merchandise/merchandise.routes';
import notificationsRoutes from './modules/notifications/notification.routes';
import posRoutes from './modules/pos/pos.routes';
import reportsRoutes from './modules/reports/reports.routes';
import promotionsRoutes from './modules/promotions/promotions.routes';
import adminRoutes from './modules/admin/admin.routes';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ruta Cinépolis API',
      version: '1.0.0',
      description: 'API del Sistema de Membresía Ruta Cinépolis (RC). Gestión de miembros, puntos, beneficios y reportes.',
      contact: { name: 'Equipo RC', email: 'dev@cinepolis.com.pe' },
    },
    servers: [{ url: `/api/${env.API_VERSION}`, description: 'Servidor actual' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autenticación y sesiones' },
      { name: 'Members', description: 'Gestión de miembros RC' },
      { name: 'Membership', description: 'Niveles y progreso de membresía' },
      { name: 'Points', description: 'Acumulación y consulta de puntos' },
      { name: 'Benefits', description: 'Catálogo de beneficios por nivel' },
      { name: 'Redemptions', description: 'Canje de beneficios' },
      { name: 'Merchandise', description: 'Stock del kit Golden' },
      { name: 'Notifications', description: 'Notificaciones al miembro' },
      { name: 'POS', description: 'Integración punto de venta' },
      { name: 'Reports', description: 'Dashboard KPI y reportes' },
      { name: 'Admin', description: 'Administración y configuración del sistema' },
    ],
    paths: {
      // ── AUTH ──────────────────────────────────────────────────
      '/auth/login': {
        post: { tags: ['Auth'], summary: 'Iniciar sesión', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string', format: 'email', example: 'admin@cinepolis.com.pe' }, password: { type: 'string', example: 'Admin123!' } } } } } },
          responses: { 200: { description: 'Login exitoso' }, 401: { description: 'Credenciales inválidas' } } },
      },
      '/auth/refresh': {
        post: { tags: ['Auth'], summary: 'Renovar token de acceso', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'Token renovado' }, 401: { description: 'Refresh token inválido' } } },
      },
      '/auth/logout': {
        post: { tags: ['Auth'], summary: 'Cerrar sesión', responses: { 200: { description: 'Sesión cerrada' } } },
      },
      '/auth/change-password': {
        put: { tags: ['Auth'], summary: 'Cambiar contraseña',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword','newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } } },
          responses: { 200: { description: 'Contraseña actualizada' }, 401: { description: 'Contraseña actual incorrecta' } } },
      },
      '/auth/me': {
        get: { tags: ['Auth'], summary: 'Obtener usuario autenticado', responses: { 200: { description: 'Datos del usuario actual' } } },
      },
      // ── MEMBERS ──────────────────────────────────────────────
      '/members/register': {
        post: { tags: ['Members'], summary: 'Registrar nuevo miembro (CU-01)', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['dni','firstName','lastName','email','password'], properties: { dni: { type: 'string', example: '12345678' }, firstName: { type: 'string', example: 'Ana' }, lastName: { type: 'string', example: 'García' }, email: { type: 'string', format: 'email' }, phone: { type: 'string', example: '987654321' }, birthDate: { type: 'string', format: 'date' }, password: { type: 'string', minLength: 8 } } } } } },
          responses: { 201: { description: 'Miembro registrado' }, 409: { description: 'DNI o correo ya registrado' } } },
      },
      '/members/me': {
        get: { tags: ['Members'], summary: 'Ver mi perfil RC', responses: { 200: { description: 'Perfil del miembro autenticado' } } },
      },
      '/members': {
        get: { tags: ['Members'], summary: 'Listar todos los miembros (Admin)',
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Buscar por nombre, DNI o tarjeta' },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE','INACTIVE','SUSPENDED'] } },
            { in: 'query', name: 'levelName', schema: { type: 'string', enum: ['ESTANDAR','PREMIUM','GOLDEN'] } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          ],
          responses: { 200: { description: 'Lista paginada de miembros' } } },
      },
      '/members/card/{cardNumber}': {
        get: { tags: ['Members'], summary: 'Buscar miembro por número de tarjeta (Cajero)',
          parameters: [{ in: 'path', name: 'cardNumber', required: true, schema: { type: 'string', minLength: 16, maxLength: 16 } }],
          responses: { 200: { description: 'Datos del miembro' }, 404: { description: 'Tarjeta no registrada' } } },
      },
      '/members/{id}': {
        get: { tags: ['Members'], summary: 'Ver miembro por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Datos del miembro' }, 404: { description: 'Miembro no encontrado' } } },
        put: { tags: ['Members'], summary: 'Actualizar perfil del miembro',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' }, birthDate: { type: 'string', format: 'date' } } } } } },
          responses: { 200: { description: 'Perfil actualizado' } } },
      },
      '/members/{id}/status': {
        patch: { tags: ['Members'], summary: 'Cambiar estado del miembro (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ACTIVE','INACTIVE','SUSPENDED'] }, reason: { type: 'string' } } } } } },
          responses: { 200: { description: 'Estado actualizado' } } },
      },
      // ── MEMBERSHIP ───────────────────────────────────────────
      '/membership/levels': {
        get: { tags: ['Membership'], summary: 'Listar niveles y sus beneficios', security: [], responses: { 200: { description: 'Niveles: Estándar, Premium, Golden' } } },
      },
      '/membership/my': {
        get: { tags: ['Membership'], summary: 'Ver mi membresía y progreso hacia el siguiente nivel', responses: { 200: { description: 'Membresía actual con visitas y puntos' } } },
      },
      '/membership/{memberId}': {
        get: { tags: ['Membership'], summary: 'Ver membresía de un miembro (Cajero)',
          parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Membresía del miembro' } } },
      },
      // ── POINTS ───────────────────────────────────────────────
      '/points/earn': {
        post: { tags: ['Points'], summary: 'Acreditar puntos por compra (CU-03) - Cajero',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['memberId','amount','transactionType'], properties: { memberId: { type: 'string', format: 'uuid' }, amount: { type: 'number', example: 45.50 }, transactionType: { type: 'string', enum: ['PURCHASE_TICKET','PURCHASE_CANDY'] }, posId: { type: 'string', example: 'POS-01' }, externalRef: { type: 'string' } } } } } },
          responses: { 200: { description: 'Puntos acreditados con saldo nuevo' } } },
      },
      '/points/my-balance': {
        get: { tags: ['Points'], summary: 'Ver mi saldo de puntos', responses: { 200: { description: 'Balance actual de puntos' } } },
      },
      '/points/my-history': {
        get: { tags: ['Points'], summary: 'Ver mi historial de transacciones',
          parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }, { in: 'query', name: 'limit', schema: { type: 'integer' } }],
          responses: { 200: { description: 'Historial paginado' } } },
      },
      '/points/{memberId}/balance': {
        get: { tags: ['Points'], summary: 'Ver saldo de un miembro (Cajero)',
          parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Balance de puntos' } } },
      },
      '/points/{memberId}/history': {
        get: { tags: ['Points'], summary: 'Ver historial de un miembro (Cajero)',
          parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Historial de transacciones' } } },
      },
      '/points/{memberId}/adjust': {
        post: { tags: ['Points'], summary: 'Ajuste manual de puntos (Admin)',
          parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['delta','reason'], properties: { delta: { type: 'integer', example: 50, description: 'Positivo para sumar, negativo para restar' }, reason: { type: 'string', example: 'Compensación por error en POS' } } } } } },
          responses: { 200: { description: 'Ajuste aplicado' }, 422: { description: 'Ajuste resultaría en saldo negativo' } } },
      },
      // ── BENEFITS ─────────────────────────────────────────────
      '/benefits': {
        get: { tags: ['Benefits'], summary: 'Listar beneficios activos', security: [],
          parameters: [{ in: 'query', name: 'levelName', schema: { type: 'string', enum: ['ESTANDAR','PREMIUM','GOLDEN'] } }],
          responses: { 200: { description: 'Catálogo de beneficios' } } },
        post: { tags: ['Benefits'], summary: 'Crear beneficio (Admin)',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','type','levelIds'], properties: { name: { type: 'string' }, type: { type: 'string', enum: ['DISCOUNT_TICKET','DISCOUNT_CANDY','AVANT_PREMIERE','PREMIUM_ROOM','MERCHANDISE','POINTS_REDEMPTION'] }, discountType: { type: 'string', enum: ['PERCENTAGE','FIXED_AMOUNT'] }, discountValue: { type: 'number' }, pointsCost: { type: 'integer' }, levelIds: { type: 'array', items: { type: 'string', format: 'uuid' } } } } } } },
          responses: { 201: { description: 'Beneficio creado' } } },
      },
      '/benefits/{id}': {
        get: { tags: ['Benefits'], summary: 'Ver beneficio por ID', security: [],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Detalle del beneficio' } } },
        put: { tags: ['Benefits'], summary: 'Actualizar beneficio (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, discountValue: { type: 'number' }, levelIds: { type: 'array', items: { type: 'string' } } } } } } },
          responses: { 200: { description: 'Beneficio actualizado' } } },
        delete: { tags: ['Benefits'], summary: 'Desactivar beneficio (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 204: { description: 'Beneficio desactivado' } } },
      },
      // ── REDEMPTIONS ──────────────────────────────────────────
      '/redemptions': {
        post: { tags: ['Redemptions'], summary: 'Canjear beneficio (CU-06) - Cajero',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['memberId','benefitId'], properties: { memberId: { type: 'string', format: 'uuid' }, benefitId: { type: 'string', format: 'uuid' }, posId: { type: 'string' }, notes: { type: 'string' } } } } } },
          responses: { 201: { description: 'Canje realizado' }, 422: { description: 'Puntos insuficientes o beneficio no disponible' } } },
      },
      '/redemptions/my-history': {
        get: { tags: ['Redemptions'], summary: 'Ver mi historial de canjes', responses: { 200: { description: 'Historial de canjes del cliente' } } },
      },
      '/redemptions/{memberId}/history': {
        get: { tags: ['Redemptions'], summary: 'Ver historial de canjes de un miembro (Cajero)',
          parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Historial de canjes' } } },
      },
      // ── MERCHANDISE ──────────────────────────────────────────
      '/merchandise': {
        get: { tags: ['Merchandise'], summary: 'Listar items de merchandising Golden', responses: { 200: { description: 'Stock de kits Golden' } } },
      },
      '/merchandise/deliver': {
        post: { tags: ['Merchandise'], summary: 'Registrar entrega de kit Golden (Cajero)',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['merchandiseId','memberId'], properties: { merchandiseId: { type: 'string', format: 'uuid' }, memberId: { type: 'string', format: 'uuid' }, quantity: { type: 'integer', default: 1 }, notes: { type: 'string' } } } } } },
          responses: { 201: { description: 'Entrega registrada' }, 422: { description: 'Stock insuficiente o miembro no es Golden' } } },
      },
      '/merchandise/{memberId}/history': {
        get: { tags: ['Merchandise'], summary: 'Historial de entregas de un miembro (Cajero)',
          parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Historial de entregas' } } },
      },
      '/merchandise/{id}/stock': {
        patch: { tags: ['Merchandise'], summary: 'Ajustar stock de merchandising (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['delta'], properties: { delta: { type: 'integer', description: 'Positivo para ingresar stock, negativo para restar' } } } } } },
          responses: { 200: { description: 'Stock actualizado' } } },
      },
      // ── NOTIFICATIONS ────────────────────────────────────────
      '/notifications': {
        get: { tags: ['Notifications'], summary: 'Ver mis notificaciones',
          parameters: [{ in: 'query', name: 'unread', schema: { type: 'boolean' }, description: 'Solo no leídas' }, { in: 'query', name: 'page', schema: { type: 'integer' } }],
          responses: { 200: { description: 'Lista de notificaciones' } } },
      },
      '/notifications/unread-count': {
        get: { tags: ['Notifications'], summary: 'Cantidad de notificaciones no leídas', responses: { 200: { description: 'Contador' } } },
      },
      '/notifications/read-all': {
        patch: { tags: ['Notifications'], summary: 'Marcar todas como leídas', responses: { 200: { description: 'Todas marcadas como leídas' } } },
      },
      '/notifications/{id}/read': {
        patch: { tags: ['Notifications'], summary: 'Marcar notificación como leída (staff JWT)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notificación marcada como leída' } } },
      },
      '/notifications/{id}/read-member': {
        patch: { tags: ['Notifications'], summary: 'Marcar notificación como leída (member JWT)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notificación marcada como leída' } } },
      },
      '/notifications/read-all-member': {
        patch: { tags: ['Notifications'], summary: 'Marcar todas como leídas (member JWT)', responses: { 200: { description: 'Todas marcadas como leídas' } } },
      },
      // ── POS ──────────────────────────────────────────────────
      '/pos/lookup': {
        post: { tags: ['POS'], summary: 'Consultar miembro por tarjeta RC (< 2s) - Cajero',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['cardNumber'], properties: { cardNumber: { type: 'string', minLength: 16, maxLength: 16, example: '5890123456789012' } } } } } },
          responses: { 200: { description: 'Datos del miembro: nombre, nivel, puntos' }, 404: { description: 'Tarjeta no registrada' } } },
      },
      '/pos/transaction': {
        post: { tags: ['POS'], summary: 'Registrar compra y acreditar puntos (< 2s) - Cajero',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['cardNumber','posId','amount','transactionType'], properties: { cardNumber: { type: 'string', minLength: 16, maxLength: 16 }, posId: { type: 'string', example: 'POS-LIMA-01' }, amount: { type: 'number', example: 35.00 }, transactionType: { type: 'string', enum: ['PURCHASE_TICKET','PURCHASE_CANDY'] }, externalRef: { type: 'string' } } } } } },
          responses: { 200: { description: 'Transacción procesada con puntos acreditados' } } },
      },
      '/pos/sync': {
        post: { tags: ['POS'], summary: 'Sincronizar transacciones offline del POS - Cajero',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['posId','transactions'], properties: { posId: { type: 'string' }, transactions: { type: 'array', items: { type: 'object', properties: { cardNumber: { type: 'string' }, amount: { type: 'number' }, transactionType: { type: 'string' }, occurredAt: { type: 'string', format: 'date-time' } } } } } } } } },
          responses: { 200: { description: 'Resultado de sincronización con conteo de éxitos y fallos' } } },
      },
      '/pos/queue': {
        get: { tags: ['POS'], summary: 'Ver cola de transacciones offline pendientes (Admin)',
          parameters: [{ in: 'query', name: 'posId', schema: { type: 'string' } }],
          responses: { 200: { description: 'Cola de transacciones pendientes de procesar' } } },
      },
      // ── REPORTS ──────────────────────────────────────────────
      '/reports/kpi': {
        get: { tags: ['Reports'], summary: 'Dashboard KPI principal (Admin)',
          parameters: [{ in: 'query', name: 'from', schema: { type: 'string', format: 'date' } }, { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } }],
          responses: { 200: { description: 'KPIs: miembros por nivel, ingresos, top gastadores' } } },
      },
      '/reports/member-growth': {
        get: { tags: ['Reports'], summary: 'Crecimiento de miembros por mes (Admin)',
          parameters: [{ in: 'query', name: 'year', schema: { type: 'integer', example: 2025 } }],
          responses: { 200: { description: 'Registros por mes del año seleccionado' } } },
      },
      '/reports/transactions': {
        get: { tags: ['Reports'], summary: 'Reporte de transacciones por tipo y origen (Admin)',
          parameters: [{ in: 'query', name: 'from', schema: { type: 'string', format: 'date' } }, { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } }],
          responses: { 200: { description: 'Transacciones por tipo, origen y volumen diario' } } },
      },
      '/reports/merchandise-stock': {
        get: { tags: ['Reports'], summary: 'Estado del stock de merchandising Golden (Admin)', responses: { 200: { description: 'Inventario con alertas de stock bajo' } } },
      },
      // ── ADMIN ────────────────────────────────────────────────
      '/admin/config': {
        get: { tags: ['Admin'], summary: 'Ver toda la configuración del sistema (Admin)', responses: { 200: { description: 'Parámetros configurables del negocio' } } },
      },
      '/admin/config/{key}': {
        put: { tags: ['Admin'], summary: 'Actualizar parámetro de configuración (Admin)',
          parameters: [{ in: 'path', name: 'key', required: true, schema: { type: 'string' }, example: 'POINTS_RATE' }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['value'], properties: { value: { type: 'string', example: '0.05' }, description: { type: 'string' } } } } } },
          responses: { 200: { description: 'Configuración actualizada' } } },
        delete: { tags: ['Admin'], summary: 'Eliminar parámetro de configuración (Admin)',
          parameters: [{ in: 'path', name: 'key', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Configuración eliminada' } } },
      },
      '/admin/audit-logs': {
        get: { tags: ['Admin'], summary: 'Ver log de auditoría (Admin - RC-F24)',
          parameters: [
            { in: 'query', name: 'action', schema: { type: 'string', enum: ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','LEVEL_UPGRADE','POINTS_ADJUSTMENT','REDEMPTION','CONFIG_CHANGE'] } },
            { in: 'query', name: 'entity', schema: { type: 'string', example: 'Member' } },
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'page', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Logs de auditoría paginados' } } },
      },
      '/admin/staff': {
        get: { tags: ['Admin'], summary: 'Listar usuarios de staff (Admin)', responses: { 200: { description: 'Cajeros y administradores' } } },
        post: { tags: ['Admin'], summary: 'Crear usuario cajero o administrador (Admin)',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email','password','role'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, role: { type: 'string', enum: ['CAJERO','ADMINISTRADOR'] } } } } } },
          responses: { 201: { description: 'Usuario creado' }, 409: { description: 'Correo ya registrado' } } },
      },
      '/admin/staff/{userId}/toggle-status': {
        patch: { tags: ['Admin'], summary: 'Activar/desactivar usuario de staff (Admin)',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Estado del usuario cambiado' } } },
      },
    },
  },
  apis: [],
};

export function createApp(): Application {
  const app = express();

  // ── Seguridad ──────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: isProduction,
    crossOriginEmbedderPolicy: isProduction,
  }));

  app.use(cors({
    origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
  }));

  // ── Rendimiento ────────────────────────────
  app.use(compression());

  // ── Parseo ─────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Identificación de requests ─────────────
  app.use(requestId);

  // ── Logging HTTP ───────────────────────────
  if (!isProduction) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    }));
  }

  // ── Rate limiting global ───────────────────
  app.use(`/api/${env.API_VERSION}`, generalLimiter);

  // ── Swagger UI ─────────────────────────────
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #e31837; }',
    customSiteTitle: 'Ruta Cinépolis API Docs',
  }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  // ── Health Check ───────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: env.APP_NAME,
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Rutas API ──────────────────────────────
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/members', membersRoutes);
  apiRouter.use('/membership', membershipRoutes);
  apiRouter.use('/points', pointsRoutes);
  apiRouter.use('/benefits', benefitsRoutes);
  apiRouter.use('/redemptions', redemptionsRoutes);
  apiRouter.use('/merchandise', merchandiseRoutes);
  apiRouter.use('/notifications', notificationsRoutes);
  apiRouter.use('/pos', posRoutes);
  apiRouter.use('/reports', reportsRoutes);
  apiRouter.use('/promotions', promotionsRoutes);
  apiRouter.use('/admin', adminRoutes);

  app.use(`/api/${env.API_VERSION}`, apiRouter);

  // ── Listado de rutas (solo en desarrollo) ──
  if (!isProduction) {
    app.get('/api/routes', (_req, res) => {
      const routes: { method: string; path: string }[] = [];

      const extractRoutes = (stack: express.RequestHandler[], prefix = '') => {
        stack.forEach((layer: any) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
            methods.forEach(method => {
              routes.push({ method, path: prefix + layer.route.path });
            });
          } else if (layer.name === 'router' && layer.handle?.stack) {
            const match = layer.regexp?.source?.match(/\\\/([^\\?]+)/g);
            const sub = match ? match.map((s: string) => s.replace(/\\\//g, '/')).join('') : '';
            extractRoutes(layer.handle.stack, prefix + sub);
          }
        });
      };

      extractRoutes((app as any)._router.stack, '');
      const sorted = routes.sort((a, b) => a.path.localeCompare(b.path));
      res.json({ total: sorted.length, routes: sorted });
    });
  }

  // ── 404 y Error Handler ────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
