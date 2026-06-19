import { PrismaClient, LevelName, BenefitType, DiscountType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Ruta Cinépolis...');

  // ── NIVELES ──────────────────────────────────────────────────────────────
  const estandar = await prisma.level.upsert({
    where: { name: LevelName.ESTANDAR },
    update: {},
    create: {
      name: LevelName.ESTANDAR,
      displayName: 'Estándar',
      minVisits: 0,
      pointsMultiplier: 1.0,
      description: 'Nivel de entrada al programa Ruta Cinépolis',
      colorHex: '#808080',
    },
  });

  const premium = await prisma.level.upsert({
    where: { name: LevelName.PREMIUM },
    update: {},
    create: {
      name: LevelName.PREMIUM,
      displayName: 'Premium',
      minVisits: 10,
      pointsMultiplier: 1.5,
      description: 'Acceso con 10 visitas. Descuentos exclusivos en entradas y dulcería.',
      colorHex: '#C0C0C0',
    },
  });

  const golden = await prisma.level.upsert({
    where: { name: LevelName.GOLDEN },
    update: {},
    create: {
      name: LevelName.GOLDEN,
      displayName: 'Golden',
      minVisits: 25,
      pointsMultiplier: 2.0,
      description: 'Nivel máximo. Beneficios exclusivos, sala premium y kit de bienvenida.',
      colorHex: '#FFD700',
    },
  });

  console.log('✅ Niveles creados: Estándar, Premium, Golden');

  // ── BENEFICIOS ───────────────────────────────────────────────────────────

  // Estándar
  const benefitStd1 = await prisma.benefit.upsert({
    where: { id: 'b0000001-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: 'b0000001-0000-4000-8000-000000000001',
      name: 'Canje de puntos por entradas',
      description: 'Usa tus puntos para obtener entradas de cine',
      type: BenefitType.POINTS_REDEMPTION,
      pointsCost: 100,
      isActive: true,
    },
  });

  // Premium
  const benefitPrem1 = await prisma.benefit.upsert({
    where: { id: 'b0000002-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: 'b0000002-0000-4000-8000-000000000002',
      name: '20% de descuento en entradas',
      description: 'Descuento del 20% en cualquier entrada de cine',
      type: BenefitType.DISCOUNT_TICKET,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      isActive: true,
    },
  });

  const benefitPrem2 = await prisma.benefit.upsert({
    where: { id: 'b0000003-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: 'b0000003-0000-4000-8000-000000000003',
      name: '10% de descuento en dulcería',
      description: 'Descuento del 10% en productos de dulcería',
      type: BenefitType.DISCOUNT_CANDY,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      isActive: true,
    },
  });

  // Golden
  const benefitGold1 = await prisma.benefit.upsert({
    where: { id: 'b0000004-0000-4000-8000-000000000004' },
    update: {},
    create: {
      id: 'b0000004-0000-4000-8000-000000000004',
      name: '30% de descuento en entradas',
      description: 'Descuento del 30% en cualquier entrada de cine',
      type: BenefitType.DISCOUNT_TICKET,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 30,
      isActive: true,
    },
  });

  const benefitGold2 = await prisma.benefit.upsert({
    where: { id: 'b0000005-0000-4000-8000-000000000005' },
    update: {},
    create: {
      id: 'b0000005-0000-4000-8000-000000000005',
      name: '15% de descuento en dulcería',
      description: 'Descuento del 15% en productos de dulcería',
      type: BenefitType.DISCOUNT_CANDY,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      isActive: true,
    },
  });

  const benefitGold3 = await prisma.benefit.upsert({
    where: { id: 'b0000006-0000-4000-8000-000000000006' },
    update: {},
    create: {
      id: 'b0000006-0000-4000-8000-000000000006',
      name: 'Acceso a avant-premières exclusivas',
      description: 'Invitaciones a funciones exclusivas antes del estreno',
      type: BenefitType.AVANT_PREMIERE,
      isActive: true,
    },
  });

  const benefitGold4 = await prisma.benefit.upsert({
    where: { id: 'b0000007-0000-4000-8000-000000000007' },
    update: {},
    create: {
      id: 'b0000007-0000-4000-8000-000000000007',
      name: 'Acceso a sala premium',
      description: 'Acceso preferencial a salas premium (IMAX, 4DX)',
      type: BenefitType.PREMIUM_ROOM,
      isActive: true,
    },
  });

  const benefitGold5 = await prisma.benefit.upsert({
    where: { id: 'b0000008-0000-4000-8000-000000000008' },
    update: {},
    create: {
      id: 'b0000008-0000-4000-8000-000000000008',
      name: 'Kit de bienvenida Golden',
      description: 'Kit exclusivo con merchandising Cinépolis para miembros Golden',
      type: BenefitType.MERCHANDISE,
      isActive: true,
    },
  });

  console.log('✅ Beneficios creados');

  // ── ASIGNACIÓN BENEFICIO ↔ NIVEL ─────────────────────────────────────────
  const levelBenefitData = [
    { levelId: estandar.id, benefitId: benefitStd1.id },
    { levelId: premium.id, benefitId: benefitStd1.id },
    { levelId: premium.id, benefitId: benefitPrem1.id },
    { levelId: premium.id, benefitId: benefitPrem2.id },
    { levelId: golden.id, benefitId: benefitStd1.id },
    { levelId: golden.id, benefitId: benefitGold1.id },
    { levelId: golden.id, benefitId: benefitGold2.id },
    { levelId: golden.id, benefitId: benefitGold3.id },
    { levelId: golden.id, benefitId: benefitGold4.id },
    { levelId: golden.id, benefitId: benefitGold5.id },
  ];

  for (const lb of levelBenefitData) {
    await prisma.levelBenefit.upsert({
      where: { levelId_benefitId: { levelId: lb.levelId, benefitId: lb.benefitId } },
      update: {},
      create: lb,
    });
  }

  console.log('✅ Beneficios asignados a niveles');

  // ── MERCHANDISING ─────────────────────────────────────────────────────────
  await prisma.merchandise.upsert({
    where: { id: 'm0000001-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: 'm0000001-0000-4000-8000-000000000001',
      name: 'Kit Golden Cinépolis 2024',
      description: 'Incluye: taza, vaso, sombrero y voucher de dulcería',
      levelRequired: LevelName.GOLDEN,
      stockCurrent: 100,
      stockMinAlert: 10,
      stockTotal: 100,
      isActive: true,
    },
  });

  console.log('✅ Merchandising creado');

  // ── CONFIGURACIÓN DEL SISTEMA ─────────────────────────────────────────────
  const configs = [
    { key: 'POINTS_RATE', value: '0.05', description: 'Tasa de acumulación de puntos (5% del monto)' },
    { key: 'PREMIUM_VISITS_THRESHOLD', value: '10', description: 'Visitas para alcanzar nivel Premium' },
    { key: 'GOLDEN_VISITS_THRESHOLD', value: '25', description: 'Visitas para alcanzar nivel Golden' },
    { key: 'LEVEL_UPGRADE_NOTICE_VISITS', value: '2', description: 'Visitas restantes para avisar proximidad de cambio de nivel' },
    { key: 'DISCOUNT_TICKET_PREMIUM', value: '0.20', description: 'Descuento en entradas Premium (20%)' },
    { key: 'DISCOUNT_CANDY_PREMIUM', value: '0.10', description: 'Descuento en dulcería Premium (10%)' },
    { key: 'DISCOUNT_TICKET_GOLDEN', value: '0.30', description: 'Descuento en entradas Golden (30%)' },
    { key: 'DISCOUNT_CANDY_GOLDEN', value: '0.15', description: 'Descuento en dulcería Golden (15%)' },
    { key: 'POINTS_REDEMPTION_RATE', value: '100', description: 'Puntos necesarios para canjear 1 entrada' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log('✅ Configuración del sistema cargada');

  // ── USUARIO ADMINISTRADOR ─────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@cinepolis.com.pe' },
    update: {},
    create: {
      email: 'admin@cinepolis.com.pe',
      password: adminPassword,
      role: UserRole.ADMINISTRADOR,
      isActive: true,
    },
  });

  const cajeroPassword = await bcrypt.hash('Cajero123!', 12);
  await prisma.user.upsert({
    where: { email: 'cajero@cinepolis.com.pe' },
    update: {},
    create: {
      email: 'cajero@cinepolis.com.pe',
      password: cajeroPassword,
      role: UserRole.CAJERO,
      isActive: true,
    },
  });

  // ── MIEMBROS SOCIOS DE PRUEBA (DEMO HU-06) ───────────────────────────────
  const sociosDemo = [
    {
      dni: '71234567',
      firstName: 'Diego',
      lastName: 'Rodríguez',
      email: 'diego@mail.com',
      cardNumber: '5890000011110001',
      levelId: estandar.id,
      visits: 8,
      points: 450,
      spent: 90.00
    },
    {
      dni: '73456789',
      firstName: 'Lucía',
      lastName: 'Torres',
      email: 'lucia@mail.com',
      cardNumber: '5890000011110002',
      levelId: premium.id,
      visits: 23,
      points: 1250,
      spent: 250.00
    },
    {
      dni: '74567890',
      firstName: 'Mariana',
      lastName: 'Vega',
      email: 'mariana@mail.com',
      cardNumber: '5890000011110003',
      levelId: golden.id,
      visits: 31,
      points: 6200,
      spent: 620.00
    },
    {
      dni: '70123456',
      firstName: 'Carlos',
      lastName: 'Ramírez',
      email: 'carlos@mail.com',
      cardNumber: '5890000011110004',
      levelId: estandar.id,
      visits: 2,
      points: 100,
      spent: 20.00
    }
  ];

  for (const socio of sociosDemo) {
    const member = await prisma.member.upsert({
      where: { dni: socio.dni },
      update: {},
      create: {
        dni: socio.dni,
        firstName: socio.firstName,
        lastName: socio.lastName,
        email: socio.email,
        cardNumber: socio.cardNumber,
        status: 'ACTIVE',
        registeredBy: 'admin@cinepolis.com.pe',
      },
    });

    await prisma.membership.upsert({
      where: { memberId: member.id },
      update: {
        levelId: socio.levelId,
        points: socio.points,
        totalVisits: socio.visits,
        totalSpent: socio.spent,
      },
      create: {
        memberId: member.id,
        levelId: socio.levelId,
        points: socio.points,
        totalVisits: socio.visits,
        totalSpent: socio.spent,
      },
    });
  }

  console.log('✅ Miembros socio de prueba creados (para ingreso en el dashboard)');
  console.log('✅ Usuarios de prueba creados:');
  console.log('   Admin:  admin@cinepolis.com.pe   / Admin123!');
  console.log('   Cajero: cajero@cinepolis.com.pe  / Cajero123!');
  console.log('');
  console.log('🎬 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
