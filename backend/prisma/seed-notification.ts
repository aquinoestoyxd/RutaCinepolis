import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  // Crear notificación para todos los miembros demo
  const members = await prisma.member.findMany({
    where: {
      cardNumber: { in: [
        '5890000011110001',
        '5890000011110002',
        '5890000011110003',
        '5890000011110004',
      ] },
    },
  });

  for (const member of members) {
    // Evitar duplicados
    const existing = await prisma.notification.findFirst({
      where: { memberId: member.id, type: 'POINTS_EARNED', isRead: false },
    });
    if (existing) {
      console.log(`Ya existe notificación para ${member.firstName} — omitiendo`);
      continue;
    }

    const membership = await prisma.membership.findUnique({
      where: { memberId: member.id },
    });

    const points = membership?.points ?? 0;

    await prisma.notification.create({
      data: {
        memberId: member.id,
        type: 'POINTS_EARNED',
        title: '¡Puntos acumulados!',
        message: `Tienes ${points} puntos acumulados en tu cuenta. ¡Sigue visitándonos para subir de nivel y acceder a más beneficios!`,
        isRead: false,
      },
    });

    console.log(`✅ Notificación creada para: ${member.firstName} ${member.lastName} (${points} pts)`);
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
