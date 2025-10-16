import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  await prisma.store.createMany({
    data: [
      { name: 'Supermercado Central' },
      { name: 'Mercado Econômico' },
      { name: 'SuperShop Express' },
    ],
  });

  await prisma.product.createMany({
    data: [
      // Supermercado Central
      { name: 'Feijão preto - 1kg', price: 799, storeId: 1 },
      { name: 'Arroz branco - 1kg', price: 599, storeId: 1 },
      { name: 'Farinha de mandioca - 500g', price: 425, storeId: 1 },
      { name: 'Linguiça calabresa - 500g', price: 1190, storeId: 1 },
      { name: 'Costelinha suína - 1kg', price: 1890, storeId: 1 },
      { name: 'Macarrão espaguete - 500g', price: 399, storeId: 1 },
      { name: 'Peito de frango - 1kg', price: 1290, storeId: 1 },
      { name: 'Creme de leite - 200g', price: 299, storeId: 1 },
      { name: 'Queijo mussarela - 200g', price: 690, storeId: 1 },
      { name: 'Cenoura - 1kg', price: 449, storeId: 1 },
      { name: 'Ovos - dúzia', price: 999, storeId: 1 },
      { name: 'Açúcar refinado - 1kg', price: 549, storeId: 1 },
      { name: 'Chocolate em pó - 200g', price: 679, storeId: 1 },
      { name: 'Fermento químico - 100g', price: 299, storeId: 1 },
      { name: 'Óleo de soja - 900ml', price: 649, storeId: 1 },
      // Mercado Econômico,
      { name: 'Feijão preto - 1kg', price: 749, storeId: 2 },
      { name: 'Arroz branco - 1kg', price: 579, storeId: 2 },
      { name: 'Linguiça calabresa - 500g', price: 1090, storeId: 2 },
      { name: 'Costelinha suína - 1kg', price: 1790, storeId: 2 },
      { name: 'Macarrão espaguete - 500g', price: 419, storeId: 2 },
      { name: 'Peito de frango - 1kg', price: 1240, storeId: 2 },
      { name: 'Creme de leite - 200g', price: 289, storeId: 2 },
      { name: 'Cenoura - 1kg', price: 429, storeId: 2 },
      { name: 'Ovos - dúzia', price: 959, storeId: 2 },
      { name: 'Chocolate em pó - 200g', price: 659, storeId: 2 },
      { name: 'Fermento químico - 100g', price: 289, storeId: 2 },
      // SuperShop Express
      { name: 'Farinha de mandioca - 500g', price: 399, storeId: 3 },
      { name: 'Linguiça calabresa - 500g', price: 1150, storeId: 3 },
      { name: 'Peito de frango - 1kg', price: 1350, storeId: 3 },
      { name: 'Creme de leite - 200g', price: 319, storeId: 3 },
      { name: 'Queijo mussarela - 200g', price: 729, storeId: 3 },
      { name: 'Cenoura - 1kg', price: 469, storeId: 3 },
      { name: 'Ovos - dúzia', price: 1020, storeId: 3 },
      { name: 'Açúcar refinado - 1kg', price: 569, storeId: 3 },
      { name: 'Chocolate em pó - 200g', price: 699, storeId: 3 },
      { name: 'Fermento químico - 100g', price: 319, storeId: 3 },
    ],
  });

  await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: 'password',
      name: 'User Name',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
