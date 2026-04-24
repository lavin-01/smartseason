const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const now = new Date();

function daysAgo(days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function createFieldWithTimeline({
  name,
  cropType,
  plantingDaysAgo,
  stage,
  location,
  sizeHectares,
  assignedAgentId = null,
  updates = [],
  updatedDaysAgo,
}) {
  const field = await prisma.field.create({
    data: {
      name,
      cropType,
      plantingDate: daysAgo(plantingDaysAgo),
      stage,
      location,
      sizeHectares,
      assignedAgentId,
    },
  });

  for (const update of updates) {
    await prisma.fieldUpdate.create({
      data: {
        fieldId: field.id,
        agentId: update.agentId,
        note: update.note,
        stage: update.stage || null,
        createdAt: daysAgo(update.daysAgo),
      },
    });
  }

  const latestTouchDaysAgo = updatedDaysAgo ?? updates.reduce(
    (latest, update) => Math.min(latest, update.daysAgo),
    plantingDaysAgo
  );

  await prisma.field.update({
    where: { id: field.id },
    data: { updatedAt: daysAgo(latestTouchDaysAgo) },
  });
}

async function main() {
  console.log('Seeding SmartSeason demo data...');

  await prisma.fieldUpdate.deleteMany();
  await prisma.field.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Wanjiru',
      email: 'admin@smartseason.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const james = await prisma.user.create({
    data: {
      name: 'James Kimani',
      email: 'james@smartseason.com',
      passwordHash: agentPassword,
      role: 'AGENT',
    },
  });

  const aisha = await prisma.user.create({
    data: {
      name: 'Aisha Mwangi',
      email: 'aisha@smartseason.com',
      passwordHash: agentPassword,
      role: 'AGENT',
    },
  });

  const peter = await prisma.user.create({
    data: {
      name: 'Peter Ochieng',
      email: 'peter@smartseason.com',
      passwordHash: agentPassword,
      role: 'AGENT',
    },
  });

  await createFieldWithTimeline({
    name: 'Mwea Block 7A',
    cropType: 'Maize',
    plantingDaysAgo: 122,
    stage: 'READY',
    location: 'Kirinyaga, Mwea East',
    sizeHectares: 8.4,
    assignedAgentId: james.id,
    updates: [
      {
        agentId: james.id,
        daysAgo: 28,
        stage: 'GROWING',
        note: 'Canopy is uniform and grain fill looks strong after the last irrigation round.',
      },
      {
        agentId: james.id,
        daysAgo: 12,
        stage: 'READY',
        note: 'Crop is ready for harvest, but the combine slot is still not confirmed.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Bungoma Riverbank Plot',
    cropType: 'Beans',
    plantingDaysAgo: 58,
    stage: 'GROWING',
    location: 'Bungoma, Kanduyi',
    sizeHectares: 3.1,
    assignedAgentId: aisha.id,
    updates: [
      {
        agentId: aisha.id,
        daysAgo: 18,
        stage: 'GROWING',
        note: 'Pods are forming well after the last top dressing pass.',
      },
      {
        agentId: aisha.id,
        daysAgo: 9,
        note: 'Leaves near the river edge are yellowing. Needs a follow-up visit after the weekend rain.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Kitale North Pivot',
    cropType: 'Wheat',
    plantingDaysAgo: 103,
    stage: 'GROWING',
    location: 'Trans Nzoia, Kitale',
    sizeHectares: 6.5,
    assignedAgentId: james.id,
    updates: [
      {
        agentId: james.id,
        daysAgo: 11,
        note: 'Rust scouting was clean and the stand remains even across the pivot.',
      },
      {
        agentId: james.id,
        daysAgo: 3,
        stage: 'GROWING',
        note: 'Heading is progressing on schedule and moisture levels look stable.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Machakos South Terrace',
    cropType: 'Sorghum',
    plantingDaysAgo: 131,
    stage: 'HARVESTED',
    location: 'Machakos, Kathiani',
    sizeHectares: 4.7,
    assignedAgentId: aisha.id,
    updates: [
      {
        agentId: aisha.id,
        daysAgo: 19,
        stage: 'READY',
        note: 'Heads are dry and transport has been booked for the Tuesday harvest run.',
      },
      {
        agentId: aisha.id,
        daysAgo: 4,
        stage: 'HARVESTED',
        note: 'Harvest completed. Average yield logged at 3.6 tonnes per hectare.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Meru Irrigation Strip',
    cropType: 'Maize',
    plantingDaysAgo: 94,
    stage: 'GROWING',
    location: 'Meru, Imenti South',
    sizeHectares: 5.2,
    assignedAgentId: peter.id,
    updates: [
      {
        agentId: peter.id,
        daysAgo: 6,
        note: 'Tasseling is around seventy percent complete and irrigation lines are stable.',
      },
      {
        agentId: peter.id,
        daysAgo: 2,
        stage: 'GROWING',
        note: 'No pest pressure on the latest walk. Crop is tracking to plan.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Nyeri Highlands Block B',
    cropType: 'Sunflower',
    plantingDaysAgo: 97,
    stage: 'READY',
    location: 'Nyeri, Othaya',
    sizeHectares: 2.8,
    assignedAgentId: peter.id,
    updates: [
      {
        agentId: peter.id,
        daysAgo: 11,
        stage: 'READY',
        note: 'Heads have browned evenly and moisture readings suggest harvest can begin now.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Kisumu Lowland Cassava',
    cropType: 'Cassava',
    plantingDaysAgo: 388,
    stage: 'GROWING',
    location: 'Kisumu, Nyando',
    sizeHectares: 7.0,
    assignedAgentId: james.id,
    updates: [
      {
        agentId: james.id,
        daysAgo: 14,
        note: 'Root bulking is uneven after the late rains. Team suspects delayed maturity in the lower section.',
      },
    ],
  });

  await createFieldWithTimeline({
    name: 'Naivasha Trial Bed',
    cropType: 'Beans',
    plantingDaysAgo: 7,
    stage: 'PLANTED',
    location: 'Nakuru, Naivasha',
    sizeHectares: 1.6,
    assignedAgentId: null,
    updates: [],
    updatedDaysAgo: 7,
  });

  console.log('Seed complete.');
  console.log('');
  console.log('Demo credentials:');
  console.log(`  Coordinator: ${admin.email} / admin123`);
  console.log(`  Agent James: ${james.email} / agent123`);
  console.log(`  Agent Aisha: ${aisha.email} / agent123`);
  console.log(`  Agent Peter: ${peter.email} / agent123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
