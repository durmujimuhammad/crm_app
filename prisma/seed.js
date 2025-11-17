const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full access to all modules',
    },
  });

  const salesRole = await prisma.role.upsert({
    where: { name: 'Sales' },
    update: {},
    create: {
      name: 'Sales',
      description: 'Access to sales and customer management',
    },
  });

  const supportRole = await prisma.role.upsert({
    where: { name: 'Support' },
    update: {},
    create: {
      name: 'Support',
      description: 'Access to ticket and customer support',
    },
  });

  console.log('✅ Roles created');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@crm.com',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@crm.com' },
    update: {},
    create: {
      name: 'Sales User',
      email: 'sales@crm.com',
      password: hashedPassword,
      roleId: salesRole.id,
    },
  });

  const supportUser = await prisma.user.upsert({
    where: { email: 'support@crm.com' },
    update: {},
    create: {
      name: 'Support User',
      email: 'support@crm.com',
      password: hashedPassword,
      roleId: supportRole.id,
    },
  });

  console.log('✅ Users created');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@crm.com / password123');
  console.log('   Sales: sales@crm.com / password123');
  console.log('   Support: support@crm.com / password123');

  // Create Sample Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'PT Maju Jaya',
        email: 'contact@majujaya.com',
        phone: '081234567890',
        company: 'PT Maju Jaya',
        segment: 'Enterprise',
        type: 'LEAD',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'CV Sejahtera',
        email: 'info@sejahtera.com',
        phone: '081234567891',
        company: 'CV Sejahtera',
        segment: 'SME',
        type: 'PROSPECT',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Toko Makmur',
        email: 'toko@makmur.com',
        phone: '081234567892',
        company: 'Toko Makmur',
        segment: 'Retail',
        type: 'CUSTOMER',
      },
    }),
  ]);

  console.log('✅ Sample customers created');

  // Create Sample Interactions
  await prisma.interaction.create({
    data: {
      customerId: customers[0].id,
      userId: salesUser.id,
      note: 'Initial contact via email, interested in enterprise package',
      type: 'EMAIL',
    },
  });

  console.log('✅ Sample interactions created');

  // Create Sample Leads and Pipeline
  const lead = await prisma.lead.create({
    data: {
      customerId: customers[0].id,
      source: 'Website',
      status: 'NEW',
    },
  });

  const pipeline = await prisma.pipeline.create({
    data: {
      leadId: lead.id,
      stage: 'LEAD',
    },
  });

  console.log('✅ Sample lead and pipeline created');

  // Create Sample Sales Activity
  await prisma.salesActivity.create({
    data: {
      pipelineId: pipeline.id,
      description: 'Follow up call to discuss requirements',
      type: 'FOLLOW_UP',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      done: false,
    },
  });

  console.log('✅ Sample sales activity created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
