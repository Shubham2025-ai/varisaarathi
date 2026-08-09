import { PrismaClient, Role, CampType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  const dindi = await prisma.dindi.create({
    data: { name: "Demo Dindi", leaderId: null },
  });

  await prisma.camp.createMany({
    data: [
      { name: "Camp Alpha (Medical)", type: CampType.MEDICAL, latitude: 18.5204, longitude: 73.8567, capacity: 20, active: true },
      { name: "Camp Bravo (Police)", type: CampType.POLICE, latitude: 18.5314, longitude: 73.8446, capacity: 10, active: true },
      { name: "Camp Charlie (Ambulance Base)", type: CampType.AMBULANCE_BASE, latitude: 18.5099, longitude: 73.8636, capacity: 4, active: true },
      { name: "Camp Delta (Medical)", type: CampType.MEDICAL, latitude: 18.5410, longitude: 73.8720, capacity: 15, active: true },
    ],
  });

  const dispatcher = await prisma.user.create({
    data: {
      role: Role.DISPATCHER,
      name: "Demo Dispatcher",
      phone: "+919000000001",
      email: "dispatcher@varisaarathi.demo",
      passwordHash: await hashPassword("demo1234"),
    },
  });

  const responder1 = await prisma.user.create({
    data: {
      role: Role.RESPONDER,
      name: "Demo Responder 1",
      phone: "+919000000002",
      email: "responder1@varisaarathi.demo",
      passwordHash: await hashPassword("demo1234"),
    },
  });

  const admin = await prisma.user.create({
    data: {
      role: Role.ADMIN,
      name: "Demo Admin",
      phone: "+919000000004",
      email: "admin@varisaarathi.demo",
      passwordHash: await hashPassword("demo1234"),
    },
  });

  const volunteer = await prisma.user.create({
    data: {
      role: Role.VOLUNTEER,
      name: "Demo Volunteer",
      phone: "+919000000005",
      email: "volunteer@varisaarathi.demo",
      passwordHash: await hashPassword("demo1234"),
    },
  });

  await prisma.warkariProfile.create({
    data: {
      dindiId: dindi.id,
      name: "Demo Warkari",
      phone: "+919000000099",
      dob: new Date("1958-03-12"),
      gender: "M",
      bloodGroup: "O+",
      address: "Demo Village, Maharashtra",
      aadhaarHash: crypto.createHash("sha256").update("demo-aadhaar-000" + process.env.AADHAAR_HASH_SALT).digest("hex"),
      riskBadge: "AMBER",
      healthSummary: { hypertension: true, diabetes: false, asthma: false, other: null },
      qrCode: crypto.randomUUID(),
    },
  });

  console.log("Seeded successfully:");
  console.log({ dindi: dindi.id, dispatcher: dispatcher.id, responder1: responder1.id, admin: admin.id, volunteer: volunteer.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });