import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const emails = [
    "qariarslan@gmail.com",
    "yasirhanif555@gmail.com",
    "admin@thequrangarden.com",
    "admin@qems.io"
  ];

  console.log("Updating email verification for:", emails);

  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: emails
      }
    },
    data: {
      emailVerified: new Date()
    }
  });

  console.log(`Successfully verified ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
