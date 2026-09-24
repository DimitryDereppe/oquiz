// Échantillonnage (seeding)

import { Role } from "../../generated/prisma/enums.ts";
import { prisma } from "./index.ts";
import argon2 from "argon2";

try {
  // Users
  await prisma.user.createMany({
    skipDuplicates: true, // Conserver les comptes existants lors des prochains démarrages.
    data: [
      {
        firstname: "Alice",
        lastname: "Demo",
        email: "alice@oquiz.test",
        // password: "Passw0rd!", // FIXED
        password: await argon2.hash("Password!1234"),
        role: Role.admin
      },
      {
        firstname: "Bob",
        lastname: "Demo",
        email: "bob@oquiz.test",
        // password: "Passw0rd!", // FIXED
        password: await argon2.hash("Password!1234"),
        role: Role.author,
      },
      {
        firstname: "Charly",
        lastname: "Demo",
        email: "charly@oquiz.test",
        password: await argon2.hash("Password!1234"),
      },
    ],
  });

  // Levels
  await prisma.level.createMany({
    skipDuplicates: true,
    data: [
      { name: "facile" },
      { name: "moyen" },
      { name: "difficile" }
    ]
  });

  console.log(`📊 Échantillonnage effectué avec succès.`);
} finally {
  await prisma.$disconnect();
}
