import { PrismaClient, Role, Gender, ProgramType, HifzType, AttendanceStatus, PaymentStatus, PaymentMethod, AdmissionStatus, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding process...");

  // 1. Clear database in correct order
  await prisma.hifzQualityScore.deleteMany({});
  await prisma.hifzRecord.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.assessmentResult.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.studentBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.teacherAttendance.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.classEnrollment.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.instituteSubscription.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.institute.deleteMany({});
  await prisma.subscriptionPlanConfig.deleteMany({});

  console.log("Database cleared.");

  // 2. Hash Password helper
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const demoPassword = await bcrypt.hash("demo123", salt);
  const headPassword = await bcrypt.hash("head123", salt);
  const arslanPassword = await bcrypt.hash("arslan123", salt);

  // 3. Seed Subscription Plans Config
  console.log("Seeding subscription plan configurations...");
  const starterConfig = await prisma.subscriptionPlanConfig.create({
    data: {
      plan: SubscriptionPlan.STARTER,
      name: "Starter Plan",
      description: "Perfect for small institutes",
      monthlyPrice: 0,
      annualPrice: 0,
      maxStudents: 50,
      maxBranches: 1,
      maxTeachers: 3,
      features: JSON.stringify(["hifz-tracking", "attendance", "basic-reports"]),
    },
  });

  const growthConfig = await prisma.subscriptionPlanConfig.create({
    data: {
      plan: SubscriptionPlan.GROWTH,
      name: "Growth Plan",
      description: "For growing academies",
      monthlyPrice: 4999.00,
      annualPrice: 49990.00,
      maxStudents: 500,
      maxBranches: 5,
      maxTeachers: 20,
      features: JSON.stringify(["hifz-tracking", "attendance", "assessments", "finance", "parent-portal", "badges"]),
    },
  });

  const enterpriseConfig = await prisma.subscriptionPlanConfig.create({
    data: {
      plan: SubscriptionPlan.ENTERPRISE,
      name: "Enterprise Plan",
      description: "For large institutions",
      monthlyPrice: 15000.00,
      annualPrice: 150000.00,
      maxStudents: null,
      maxBranches: null,
      maxTeachers: null,
      features: JSON.stringify(["all"]),
    },
  });

  // 4. Seed Super Admin
  console.log("Seeding Super Admin...");
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@qems.io",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // 5. Seed Institute
  console.log("Seeding Institutes...");
  const institute = await prisma.institute.create({
    data: {
      name: "Dar ul Uloom Karachi",
      slug: "darululoom",
      email: "darululoom@demo.com",
      phone: "+92 21 3456789",
      address: "Korangi Industrial Area, Sector 28",
      city: "Karachi",
      country: "PK",
      isActive: true,
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  const institute2 = await prisma.institute.create({
    data: {
      name: "The Quran Garden",
      slug: "qurangarden",
      email: "info@qurangarden.com",
      phone: "+92 300 9876543",
      address: "Gulshan-e-Iqbal, Block 4",
      city: "Karachi",
      country: "PK",
      isActive: true,
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  // 6. Link Subscription to Institute
  await prisma.instituteSubscription.create({
    data: {
      instituteId: institute.id,
      plan: SubscriptionPlan.GROWTH,
      status: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  });

  await prisma.instituteSubscription.create({
    data: {
      instituteId: institute2.id,
      plan: SubscriptionPlan.ENTERPRISE,
      status: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 7. Seed Branch
  const branch = await prisma.branch.create({
    data: {
      name: "Main Campus",
      code: "MC-01",
      city: "Karachi",
      instituteId: institute.id,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: "Main Branch",
      code: "QG-01",
      city: "Karachi",
      instituteId: institute2.id,
    },
  });

  // 8. Seed Users
  console.log("Seeding Owners, Teachers, Parents, Students users...");
  const ownerUser = await prisma.user.create({
    data: {
      name: "Mufti Asim Hafeez",
      email: "owner@demo.com",
      password: demoPassword,
      role: Role.INSTITUTE_OWNER,
      instituteId: institute.id,
      branchId: branch.id,
    },
  });

  // ── The Quran Garden: Institution Head ──────────────────────
  const quranGardenHead = await prisma.user.create({
    data: {
      name: "The Quran Garden Head",
      email: "head@qurangarden.com",
      password: headPassword,
      role: Role.INSTITUTE_OWNER,
      isActive: true,
      instituteId: institute2.id,
      branchId: branch2.id,
    },
  });

  // ── The Quran Garden: Teacher — Qari Muhammad Arslan Sahab ──
  const arslanUser = await prisma.user.create({
    data: {
      name: "Qari Muhammad Arslan",
      email: "arslan@qurangarden.com",
      password: arslanPassword,
      role: Role.TEACHER,
      isActive: true,
      instituteId: institute2.id,
      branchId: branch2.id,
    },
  });

  const arslanTeacher = await prisma.teacher.create({
    data: {
      teacherCode: "QG-TCH-001",
      qualification: "Hafiz-ul-Quran / Qari (Tajweed Expert)",
      specialization: "Hifz ul Quran, Tajweed",
      experience: 10,
      joinDate: new Date("2024-01-01"),
      userId: arslanUser.id,
      instituteId: institute2.id,
      branchId: branch2.id,
    },
  });


  const teacherUser = await prisma.user.create({
    data: {
      name: "Ustad Bilal Ahmad",
      email: "teacher@demo.com",
      password: demoPassword,
      role: Role.TEACHER,
      instituteId: institute.id,
      branchId: branch.id,
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      teacherCode: "TCH-001",
      qualification: "Shahadat-ul-Almiyah / Hafiz-ul-Quran",
      specialization: "Hifz, Tajweed",
      experience: 8,
      joinDate: new Date("2020-01-15"),
      userId: teacherUser.id,
      instituteId: institute.id,
      branchId: branch.id,
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      name: "Mohammad Al-Rashid",
      email: "parent@demo.com",
      password: demoPassword,
      role: Role.PARENT,
      instituteId: institute.id,
    },
  });

  const parent = await prisma.parent.create({
    data: {
      relation: "Father",
      cnic: "42101-1234567-1",
      userId: parentUser.id,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      name: "Ahmad Al-Rashid",
      email: "student@demo.com",
      password: demoPassword,
      role: Role.STUDENT,
      instituteId: institute.id,
      branchId: branch.id,
    },
  });

  const student = await prisma.student.create({
    data: {
      studentId: "STU-2026-001",
      fullName: "Ahmad Al-Rashid",
      gender: Gender.MALE,
      dateOfBirth: new Date("2014-06-15"),
      emergencyContact: "Mohammad Al-Rashid",
      emergencyPhone: "+92 300 9876543",
      admissionDate: new Date("2026-01-10"),
      admissionStatus: AdmissionStatus.ENROLLED,
      programType: ProgramType.HIFZ,
      currentPara: 13,
      currentJuz: 13,
      currentSurah: 14, // Ibrahim
      currentPage: 250,
      instituteId: institute.id,
      branchId: branch.id,
      teacherId: teacher.id,
      parentId: parent.id,
      userId: studentUser.id,
    },
  });

  // 9. Seed Class
  const mainClass = await prisma.class.create({
    data: {
      name: "Hifz Morning Session",
      code: "H-AM",
      programType: ProgramType.HIFZ,
      capacity: 25,
      teacherId: teacher.id,
      instituteId: institute.id,
      branchId: branch.id,
    },
  });

  // Enroll student
  await prisma.classEnrollment.create({
    data: {
      studentId: student.id,
      classId: mainClass.id,
    },
  });

  // 10. Seed Mock Attendance
  console.log("Seeding Mock Attendance...");
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });

  for (const date of dates) {
    const isSunday = date.getDay() === 0;
    if (isSunday) continue;

    const rand = Math.random();
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (rand < 0.05) status = AttendanceStatus.ABSENT;
    else if (rand < 0.10) status = AttendanceStatus.LATE;
    else if (rand < 0.12) status = AttendanceStatus.LEAVE;

    await prisma.attendance.create({
      data: {
        date: date,
        status: status,
        studentId: student.id,
        classId: mainClass.id,
        markedById: teacher.id,
      },
    });
  }

  // 11. Seed Mock Hifz records
  console.log("Seeding Mock Hifz Records...");
  const surahs = [
    { num: 114, name: "An-Nas", ayahs: 6 },
    { num: 113, name: "Al-Falaq", ayahs: 5 },
    { num: 112, name: "Al-Ikhlas", ayahs: 4 },
    { num: 111, name: "Al-Masad", ayahs: 5 },
    { num: 110, name: "An-Nasr", ayahs: 3 },
    { num: 109, name: "Al-Kafirun", ayahs: 6 },
    { num: 108, name: "Al-Kawthar", ayahs: 3 },
  ];

  for (let i = 0; i < 15; i++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - i);

    if (recordDate.getDay() === 0) continue;

    const surahIdx = i % surahs.length;
    const surah = surahs[surahIdx];

    // Sabaq
    await prisma.hifzRecord.create({
      data: {
        date: recordDate,
        type: HifzType.SABAQ,
        surahNumber: surah.num,
        surahName: surah.name,
        ayahFrom: 1,
        ayahTo: surah.ayahs,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        errorCount: Math.floor(Math.random() * 2), // 0-1 error
        studentId: student.id,
        teacherId: teacher.id,
      },
    });

    // Sabqi
    await prisma.hifzRecord.create({
      data: {
        date: recordDate,
        type: HifzType.SABQI,
        surahNumber: surah.num === 114 ? 113 : surah.num + 1,
        ayahFrom: 1,
        ayahTo: 5,
        rating: 4,
        errorCount: 1,
        studentId: student.id,
        teacherId: teacher.id,
      },
    });
  }

  // 12. Seed Mock Fee Payments
  console.log("Seeding Fee Payments...");
  await prisma.feePayment.create({
    data: {
      invoiceNo: "INV-2026-001",
      amount: 4000.00,
      discount: 500.00,
      netAmount: 3500.00,
      status: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      dueDate: new Date("2026-04-05"),
      paidAt: new Date("2026-04-04"),
      month: "2026-04",
      studentId: student.id,
    },
  });

  await prisma.feePayment.create({
    data: {
      invoiceNo: "INV-2026-002",
      amount: 4000.00,
      discount: 0.00,
      netAmount: 4000.00,
      status: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.STRIPE,
      dueDate: new Date("2026-05-05"),
      paidAt: new Date("2026-05-05"),
      month: "2026-05",
      studentId: student.id,
    },
  });

  await prisma.feePayment.create({
    data: {
      invoiceNo: "INV-2026-003",
      amount: 4000.00,
      discount: 0.00,
      netAmount: 4000.00,
      status: PaymentStatus.PENDING,
      dueDate: new Date("2026-06-05"),
      month: "2026-06",
      studentId: student.id,
    },
  });

  // 13. Seed Badges
  console.log("Seeding Badges...");
  const firstJuzBadge = await prisma.badge.create({
    data: {
      name: "First Juz Completed",
      description: "Awarded when the student completes their first Juz of the Quran.",
      icon: "juz-completed",
      instituteId: institute.id,
      criteria: { type: "juz-completed", juz: 1 },
    },
  });

  await prisma.studentBadge.create({
    data: {
      studentId: student.id,
      badgeId: firstJuzBadge.id,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
