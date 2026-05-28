import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash,
      displayName: "Alice",
      houseLabel: "123 Maple St",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash,
      displayName: "Bob",
      houseLabel: "456 Oak Ave",
    },
  });

  const existingListings = await prisma.listing.count({ where: { sellerId: alice.id } });
  if (existingListings === 0) {
    await prisma.listing.createMany({
      data: [
        {
          sellerId: alice.id,
          title: "Heirloom tomatoes",
          description: "Mixed colors, picked this morning.",
          category: "VEGETABLE",
          unit: "LB",
          pricePerUnit: 3.0,
          quantityAvailable: 8,
        },
        {
          sellerId: alice.id,
          title: "Basil seedlings",
          description: "4-inch pots, ready to transplant.",
          category: "PLANT",
          unit: "EACH",
          pricePerUnit: 2.5,
          quantityAvailable: 12,
        },
        {
          sellerId: bob.id,
          title: "Backyard lemons",
          description: "Meyer lemons from a backyard tree.",
          category: "FRUIT",
          unit: "EACH",
          pricePerUnit: 0.5,
          quantityAvailable: 30,
        },
      ],
    });
  }

  console.log("Seeded users: alice@example.com / bob@example.com (password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
