/**
 * Seeds "The Quran Velley" institute with demo-ready data.
 * Safe to re-run: removes prior data for this institute slug first.
 *
 * Run: npm run db:seed:quran-valley
 */
import {
  PrismaClient,
  Role,
  Gender,
  ProgramType,
  HifzType,
  AttendanceStatus,
  PaymentStatus,
  PaymentMethod,
  AdmissionStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  SalaryPayeeType,
  EventType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const INSTITUTE = {
  name: "The Quran Velley",
  slug: "the-quran-velley",
  email: "info@quranvelley.com",
  phone: "+92 42 35551234",
  address: "Model Town, Block C, Link Road",
  city: "Lahore",
  country: "PK",
  description:
    "A modern Quran academy focused on Hifz, Nazra, and Tajweed with character building and parent engagement.",
  directorName: "Mufti Tariq Saeed",
  directorEmail: "director@quranvelley.com",
  directorPhone: "+92 300 1112233",
};

const DEMO_PASSWORD = "demo123";
const PARENT_PASSWORD = "parent123";

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function ensureSubscriptionPlans() {
  const plans = [
    {
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
    {
      plan: SubscriptionPlan.GROWTH,
      name: "Growth Plan",
      description: "For growing academies",
      monthlyPrice: 4999,
      annualPrice: 49990,
      maxStudents: 500,
      maxBranches: 5,
      maxTeachers: 20,
      features: JSON.stringify([
        "hifz-tracking",
        "attendance",
        "assessments",
        "finance",
        "parent-portal",
        "badges",
      ]),
    },
    {
      plan: SubscriptionPlan.ENTERPRISE,
      name: "Enterprise Plan",
      description: "For large institutions",
      monthlyPrice: 15000,
      annualPrice: 150000,
      maxStudents: null,
      maxBranches: null,
      maxTeachers: null,
      features: JSON.stringify(["all"]),
    },
  ];

  for (const p of plans) {
    await prisma.subscriptionPlanConfig.upsert({
      where: { plan: p.plan },
      create: p,
      update: p,
    });
  }
}

async function removeExistingInstitute() {
  const existing = await prisma.institute.findUnique({
    where: { slug: INSTITUTE.slug },
  });

  // Clean up orphaned rows from prior partial runs (no FK cascade on admissions)
  await prisma.admissionApplication.deleteMany({
    where: { applicationNo: { startsWith: "QV-APP-" } },
  });
  await prisma.feePayment.deleteMany({
    where: { invoiceNo: { startsWith: "QV-INV-" } },
  });

  if (!existing) return;

  console.log("Removing existing The Quran Velley data…");
  await prisma.admissionApplication.deleteMany({ where: { instituteId: existing.id } });
  await prisma.user.deleteMany({ where: { instituteId: existing.id } });
  await prisma.institute.delete({ where: { id: existing.id } });
}

function schoolDays(count: number): Date[] {
  const dates: Date[] = [];
  const d = new Date();
  while (dates.length < count) {
    if (d.getDay() !== 0) dates.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return dates;
}

async function main() {
  console.log("Seeding The Quran Velley demo institute…\n");

  await ensureSubscriptionPlans();
  await removeExistingInstitute();

  const demoHash = await hash(DEMO_PASSWORD);
  const parentHash = await hash(PARENT_PASSWORD);

  const institute = await prisma.institute.create({
    data: {
      ...INSTITUTE,
      isActive: true,
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  await prisma.instituteSubscription.create({
    data: {
      instituteId: institute.id,
      plan: SubscriptionPlan.GROWTH,
      status: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const mainBranch = await prisma.branch.create({
    data: {
      name: "Model Town Campus",
      code: "QV-MT",
      city: "Lahore",
      address: INSTITUTE.address,
      phone: INSTITUTE.phone,
      instituteId: institute.id,
    },
  });

  const girlsBranch = await prisma.branch.create({
    data: {
      name: "Gulberg Girls Wing",
      code: "QV-GB",
      city: "Lahore",
      instituteId: institute.id,
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      name: "Mufti Tariq Saeed",
      email: "owner@quranvelley.com",
      password: demoHash,
      role: Role.INSTITUTE_OWNER,
      isActive: true,
      emailVerified: new Date(),
      instituteId: institute.id,
      branchId: mainBranch.id,
    },
  });

  const teacherDefs = [
    {
      name: "Ustad Hassan Mahmood",
      email: "hassan@quranvelley.com",
      code: "QV-TCH-001",
      specialization: "Hifz ul Quran",
      branchId: mainBranch.id,
    },
    {
      name: "Ustad Fatima Zahra",
      email: "fatima@quranvelley.com",
      code: "QV-TCH-002",
      specialization: "Nazra & Tajweed",
      branchId: girlsBranch.id,
    },
    {
      name: "Qari Bilal Ashraf",
      email: "bilal@quranvelley.com",
      code: "QV-TCH-003",
      specialization: "Tajweed & Qiraat",
      branchId: mainBranch.id,
    },
  ];

  const teachers: { id: string; name: string }[] = [];
  for (const t of teacherDefs) {
    const user = await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        password: demoHash,
        role: Role.TEACHER,
        isActive: true,
        emailVerified: new Date(),
        instituteId: institute.id,
        branchId: t.branchId,
      },
    });
    const teacher = await prisma.teacher.create({
      data: {
        teacherCode: t.code,
        qualification: "Hafiz-ul-Quran / Dars-e-Nizami",
        specialization: t.specialization,
        experience: 6,
        joinDate: new Date("2023-06-01"),
        salary: 45000,
        bankName: "Meezan Bank",
        accountTitle: t.name,
        accountNumber: `0101${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
        userId: user.id,
        instituteId: institute.id,
        branchId: t.branchId,
      },
    });
    teachers.push({ id: teacher.id, name: t.name });
  }

  const [hassan, fatima, bilal] = teachers;

  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: "Hifz Morning — Boys",
        code: "QV-HIFZ-AM",
        programType: ProgramType.HIFZ,
        capacity: 20,
        teacherId: hassan.id,
        instituteId: institute.id,
        branchId: mainBranch.id,
      },
    }),
    prisma.class.create({
      data: {
        name: "Hifz Afternoon — Girls",
        code: "QV-HIFZ-PM",
        programType: ProgramType.HIFZ,
        capacity: 18,
        teacherId: fatima.id,
        instituteId: institute.id,
        branchId: girlsBranch.id,
      },
    }),
    prisma.class.create({
      data: {
        name: "Nazra Foundation",
        code: "QV-NAZRA-01",
        programType: ProgramType.NAZRA,
        capacity: 25,
        teacherId: fatima.id,
        instituteId: institute.id,
        branchId: mainBranch.id,
      },
    }),
    prisma.class.create({
      data: {
        name: "Tajweed Advanced",
        code: "QV-TAJ-01",
        programType: ProgramType.TAJWEED,
        capacity: 15,
        teacherId: bilal.id,
        instituteId: institute.id,
        branchId: mainBranch.id,
      },
    }),
  ]);

  const [hifzBoysClass, hifzGirlsClass, nazraClass, tajweedClass] = classes;

  type StudentSeed = {
    fullName: string;
    gender: Gender;
    program: ProgramType;
    classId: string;
    teacherId: string;
    branchId: string;
    currentJuz?: number;
    currentSurah?: number;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    studentNum: number;
  };

  const studentSeeds: StudentSeed[] = [
    {
      fullName: "Hamza Khan",
      gender: Gender.MALE,
      program: ProgramType.HIFZ,
      classId: hifzBoysClass.id,
      teacherId: hassan.id,
      branchId: mainBranch.id,
      currentJuz: 8,
      parentName: "Khalid Khan",
      parentPhone: "03001112233",
      parentEmail: "khalid.khan@email.com",
      studentNum: 1,
    },
    {
      fullName: "Usman Farooq",
      gender: Gender.MALE,
      program: ProgramType.HIFZ,
      classId: hifzBoysClass.id,
      teacherId: hassan.id,
      branchId: mainBranch.id,
      currentJuz: 14,
      parentName: "Farooq Ahmed",
      parentPhone: "03002223344",
      studentNum: 2,
    },
    {
      fullName: "Ayesha Malik",
      gender: Gender.FEMALE,
      program: ProgramType.HIFZ,
      classId: hifzGirlsClass.id,
      teacherId: fatima.id,
      branchId: girlsBranch.id,
      currentJuz: 5,
      parentName: "Nadia Malik",
      parentPhone: "03003334455",
      studentNum: 3,
    },
    {
      fullName: "Zainab Qureshi",
      gender: Gender.FEMALE,
      program: ProgramType.HIFZ,
      classId: hifzGirlsClass.id,
      teacherId: fatima.id,
      branchId: girlsBranch.id,
      currentJuz: 11,
      parentName: "Sadia Qureshi",
      parentPhone: "03004445566",
      studentNum: 4,
    },
    {
      fullName: "Ibrahim Ali",
      gender: Gender.MALE,
      program: ProgramType.NAZRA,
      classId: nazraClass.id,
      teacherId: fatima.id,
      branchId: mainBranch.id,
      currentSurah: 18,
      parentName: "Ali Hassan",
      parentPhone: "03005556677",
      studentNum: 5,
    },
    {
      fullName: "Maryam Siddiqui",
      gender: Gender.FEMALE,
      program: ProgramType.TAJWEED,
      classId: tajweedClass.id,
      teacherId: bilal.id,
      branchId: mainBranch.id,
      parentName: "Hina Siddiqui",
      parentPhone: "03006667788",
      parentEmail: "hina.siddiqui@email.com",
      studentNum: 6,
    },
  ];

  const year = new Date().getFullYear();
  const createdStudents: {
    id: string;
    program: ProgramType;
    teacherId: string;
    classId: string;
  }[] = [];

  for (const s of studentSeeds) {
    const studentId = `QV-${year}-${String(s.studentNum).padStart(3, "0")}`;
    const parentEmail =
      s.parentEmail || `p.${s.parentPhone.replace(/\D/g, "")}@parent.qems.local`;

    const parentUser = await prisma.user.create({
      data: {
        name: s.parentName,
        email: parentEmail,
        phone: s.parentPhone.replace(/\D/g, ""),
        password: parentHash,
        role: Role.PARENT,
        isActive: true,
        mustChangePassword: false,
        emailVerified: new Date(),
        instituteId: institute.id,
      },
    });

    const parent = await prisma.parent.create({
      data: { relation: "Father", userId: parentUser.id },
    });

    const studentUser = await prisma.user.create({
      data: {
        name: s.fullName,
        email: `student.${studentId.toLowerCase()}@quranvelley.com`,
        password: parentHash,
        role: Role.STUDENT,
        isActive: true,
        mustChangePassword: true,
        emailVerified: new Date(),
        instituteId: institute.id,
        branchId: s.branchId,
      },
    });

    const student = await prisma.student.create({
      data: {
        studentId,
        fullName: s.fullName,
        gender: s.gender,
        dateOfBirth: new Date(`${2012 + s.studentNum}-03-${10 + s.studentNum}`),
        admissionDate: new Date("2025-09-01"),
        admissionStatus: AdmissionStatus.ENROLLED,
        programType: s.program,
        currentJuz: s.currentJuz ?? null,
        currentPara: s.currentJuz ?? null,
        currentSurah: s.currentSurah ?? null,
        city: "Lahore",
        country: "PK",
        address: "Lahore, Pakistan",
        instituteId: institute.id,
        branchId: s.branchId,
        teacherId: s.teacherId,
        parentId: parent.id,
        userId: studentUser.id,
        emergencyContact: s.parentName,
        emergencyPhone: s.parentPhone,
      },
    });

    await prisma.classEnrollment.create({
      data: { studentId: student.id, classId: s.classId },
    });

    createdStudents.push({
      id: student.id,
      program: s.program,
      teacherId: s.teacherId,
      classId: s.classId,
    });
  }

  console.log("Seeding attendance & hifz records…");
  const attendanceDays = schoolDays(22);
  const attendanceRows: {
    date: Date;
    status: AttendanceStatus;
    studentId: string;
    classId: string;
    markedById: string;
  }[] = [];
  const hifzRows: {
    date: Date;
    type: HifzType;
    surahNumber: number;
    surahName: string;
    ayahFrom: number;
    ayahTo: number;
    rating: number;
    errorCount: number;
    studentId: string;
    teacherId: string;
  }[] = [];

  const surahs = [
    { num: 114, name: "An-Nas", ayahs: 6 },
    { num: 113, name: "Al-Falaq", ayahs: 5 },
    { num: 112, name: "Al-Ikhlas", ayahs: 4 },
    { num: 111, name: "Al-Masad", ayahs: 5 },
    { num: 110, name: "An-Nasr", ayahs: 3 },
  ];

  for (const st of createdStudents) {
    for (const date of attendanceDays) {
      const roll = Math.random();
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if (roll < 0.06) status = AttendanceStatus.ABSENT;
      else if (roll < 0.1) status = AttendanceStatus.LATE;
      else if (roll < 0.12) status = AttendanceStatus.LEAVE;

      attendanceRows.push({
        date,
        status,
        studentId: st.id,
        classId: st.classId,
        markedById: st.teacherId,
      });
    }

    if (st.program !== ProgramType.HIFZ) continue;

    for (let i = 0; i < 12; i++) {
      const recordDate = new Date();
      recordDate.setDate(recordDate.getDate() - i);
      if (recordDate.getDay() === 0) continue;
      const surah = surahs[i % surahs.length];
      hifzRows.push({
        date: recordDate,
        type: i % 2 === 0 ? HifzType.SABAQ : HifzType.SABQI,
        surahNumber: surah.num,
        surahName: surah.name,
        ayahFrom: 1,
        ayahTo: surah.ayahs,
        rating: 4 + (i % 2),
        errorCount: i % 3,
        studentId: st.id,
        teacherId: st.teacherId,
      });
    }
  }

  await prisma.attendance.createMany({ data: attendanceRows });
  if (hifzRows.length) {
    await prisma.hifzRecord.createMany({ data: hifzRows });
  }

  console.log("Seeding fees, badges & finance…");
  await prisma.feeStructure.createMany({
    data: [
      { name: "Hifz Monthly", programType: ProgramType.HIFZ, amount: 4500, instituteId: institute.id },
      { name: "Nazra Monthly", programType: ProgramType.NAZRA, amount: 3500, instituteId: institute.id },
      { name: "Tajweed Monthly", programType: ProgramType.TAJWEED, amount: 3000, instituteId: institute.id },
    ],
  });

  let inv = 1;
  const feeRows: {
    invoiceNo: string;
    amount: number;
    discount: number;
    netAmount: number;
    status: PaymentStatus;
    paymentMethod?: PaymentMethod;
    dueDate: Date;
    paidAt?: Date;
    month: string;
    studentId: string;
  }[] = [];

  for (const st of createdStudents) {
    const base =
      st.program === ProgramType.HIFZ ? 4500 : st.program === ProgramType.NAZRA ? 3500 : 3000;
    const paidInv = inv++;
    feeRows.push({
      invoiceNo: `QV-INV-${year}-${String(paidInv).padStart(4, "0")}`,
      amount: base,
      discount: paidInv % 3 === 0 ? 500 : 0,
      netAmount: paidInv % 3 === 0 ? base - 500 : base,
      status: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      dueDate: new Date(year, 3, 10),
      paidAt: new Date(year, 3, 8),
      month: `${year}-04`,
      studentId: st.id,
    });
    feeRows.push({
      invoiceNo: `QV-INV-${year}-${String(inv++).padStart(4, "0")}`,
      amount: base,
      discount: 0,
      netAmount: base,
      status: PaymentStatus.PENDING,
      dueDate: new Date(year, 5, 10),
      month: `${year}-06`,
      studentId: st.id,
    });
  }
  await prisma.feePayment.createMany({ data: feeRows });

  const juzBadge = await prisma.badge.create({
    data: {
      name: "First Juz Completed",
      description: "Completed the first Juz of Hifz.",
      icon: "juz-completed",
      instituteId: institute.id,
      criteria: { type: "juz-completed", juz: 1 },
    },
  });

  const hifzStudents = createdStudents.filter((s) => s.program === ProgramType.HIFZ);
  if (hifzStudents[0]) {
    await prisma.studentBadge.create({
      data: { studentId: hifzStudents[0].id, badgeId: juzBadge.id },
    });
  }

  console.log("Seeding character building tasks…");
  const dueSoon = new Date();
  dueSoon.setDate(dueSoon.getDate() + 14);
  const duePast = new Date();
  duePast.setDate(duePast.getDate() - 3);

  const taskDefs = [
    {
      title: "Speak truthfully and avoid lying",
      description: "Discuss the importance of sidq (truthfulness) with examples from Seerah.",
      category: "AKHLAAQ",
      priority: "HIGH",
      dueDate: dueSoon,
    },
    {
      title: "Mosque etiquette — entering & leaving",
      description: "Practice adab of masjid: walking calmly, not raising voice, leaving shoes neatly.",
      category: "ADAB",
      priority: "NORMAL",
      dueDate: dueSoon,
    },
    {
      title: "Helping parents at home",
      description: "Students share one way they helped parents this week.",
      category: "RESPONSIBILITY",
      priority: "NORMAL",
      dueDate: duePast,
    },
  ];

  const tasks: { id: string }[] = [];
  for (const def of taskDefs) {
    const task = await prisma.characterTask.create({
      data: { ...def, instituteId: institute.id },
    });
    tasks.push(task);
  }

  await prisma.characterTaskAssignment.createMany({
    data: tasks.flatMap((task) =>
      teachers.map((t) => ({ taskId: task.id, teacherId: t.id }))
    ),
  });

  await prisma.characterTaskClassProgress.create({
    data: {
      taskId: tasks[0].id,
      classId: hifzBoysClass.id,
      teacherId: hassan.id,
      status: "COMPLETED",
      taughtAt: new Date(),
      completedAt: new Date(),
      notes: "Excellent class discussion. Boys shared real examples.",
    },
  });
  await prisma.characterTaskClassProgress.create({
    data: {
      taskId: tasks[0].id,
      classId: hifzGirlsClass.id,
      teacherId: fatima.id,
      status: "TAUGHT",
      taughtAt: new Date(),
      notes: "Girls wing — follow up next week.",
    },
  });
  await prisma.characterTaskClassProgress.create({
    data: {
      taskId: tasks[2].id,
      classId: nazraClass.id,
      teacherId: fatima.id,
      status: "PENDING",
    },
  });

  console.log("Seeding salaries, announcements & admissions…");
  const salaryMonth = `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  await prisma.salaryPayment.createMany({
    data: teachers.map((t) => ({
      payeeType: SalaryPayeeType.TEACHER,
      payeeId: t.id,
      teacherId: t.id,
      instituteId: institute.id,
      periodMonth: salaryMonth,
      grossAmount: 47000,
      deductions: 0,
      netAmount: 47000,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      notes: "Demo salary record",
    })),
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "Summer Hifz Camp Registration Open",
        content:
          "Register your child for our 4-week intensive Hifz revision camp starting July 1st. Limited seats.",
        targetRoles: [Role.PARENT],
        instituteId: institute.id,
        createdById: ownerUser.id,
      },
      {
        title: "Parent-Teacher Meeting — Saturday",
        content: "All parents are invited this Saturday 10 AM at Model Town Campus.",
        targetRoles: [Role.TEACHER, Role.PARENT, Role.STUDENT, Role.INSTITUTE_OWNER],
        instituteId: institute.id,
        createdById: ownerUser.id,
      },
    ],
  });

  await prisma.admissionApplication.create({
    data: {
      applicationNo: `QV-APP-${year}-0001`,
      applicantName: "Omar Hassan",
      gender: Gender.MALE,
      dateOfBirth: new Date("2015-08-20"),
      parentName: "Rashid Hassan",
      parentPhone: "03009998877",
      parentEmail: "rashid@email.com",
      city: "Lahore",
      country: "PK",
      address: "Johar Town, Lahore",
      programType: ProgramType.HIFZ,
      status: AdmissionStatus.UNDER_REVIEW,
      interviewNotes: "Transferred from local mosque hifz class — currently on Juz 3.",
      instituteId: institute.id,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      title: "Annual Quran Competition",
      description: "Inter-class tilawah and hifz competition for all students.",
      startDate: new Date(year, 6, 15),
      endDate: new Date(year, 6, 15),
      type: EventType.EVENT,
      instituteId: institute.id,
    },
  });

  console.log("\n✅ The Quran Velley demo institute seeded successfully!\n");
  console.log("── Institute ──");
  console.log(`  Name:   ${INSTITUTE.name}`);
  console.log(`  Slug:   ${INSTITUTE.slug}`);
  console.log(`  City:   ${INSTITUTE.city}`);
  console.log("\n── Login credentials (password in parentheses) ──");
  console.log(`  Institute Owner:   owner@quranvelley.com  (${DEMO_PASSWORD})`);
  console.log(`  Teacher (Hifz):    hassan@quranvelley.com (${DEMO_PASSWORD})`);
  console.log(`  Teacher (Nazra):   fatima@quranvelley.com  (${DEMO_PASSWORD})`);
  console.log(`  Teacher (Tajweed): bilal@quranvelley.com   (${DEMO_PASSWORD})`);
  console.log(`  Parent (sample):   03001112233 or khalid.khan@email.com (${PARENT_PASSWORD})`);
  console.log("\n── Demo includes ──");
  console.log("  • 2 branches, 4 classes, 6 students (Hifz/Nazra/Tajweed)");
  console.log("  • 22 days attendance, hifz lesson records, fees, badges");
  console.log("  • 3 character-building tasks with class progress");
  console.log("  • Teacher salaries, announcements, 1 pending admission");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
