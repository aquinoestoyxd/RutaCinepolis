import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './shared/utils/logger';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info('Conexión a base de datos establecida');

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🎬 ${env.APP_NAME} API iniciada`, {
      port: env.PORT,
      env: env.NODE_ENV,
      docs: `http://localhost:${env.PORT}/api/docs`,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} recibido. Cerrando servidor...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Servidor cerrado correctamente');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Cierre forzado por timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exit(1);
});
