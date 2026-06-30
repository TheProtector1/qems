import { prisma } from "@/lib/prisma";

export async function getBranchManagerContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      branch: { select: { id: true, name: true, city: true, instituteId: true } },
      institute: { select: { id: true, name: true } },
    },
  });

  if (!user?.branchId || !user.branch) return null;

  return {
    userId: user.id,
    branchId: user.branchId,
    instituteId: user.instituteId || user.branch.instituteId,
    branchName: user.branch.name,
    instituteName: user.institute?.name || "Institute",
  };
}

export async function getBranchDashboardStats(branchId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [students, teachers, classes, attendanceRows, overdueFees] = await Promise.all([
    prisma.student.count({ where: { branchId, isActive: true } }),
    prisma.teacher.count({ where: { branchId, isActive: true } }),
    prisma.class.count({ where: { branchId, isActive: true } }),
    prisma.attendance.findMany({
      where: { student: { branchId }, date: { gte: thirtyDaysAgo } },
      select: { status: true },
    }),
    prisma.feePayment.count({
      where: {
        student: { branchId },
        status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  const attTotal = attendanceRows.filter((r) => r.status !== "HOLIDAY").length;
  const attPresent = attendanceRows.filter((r) => ["PRESENT", "LATE"].includes(r.status)).length;
  const attendanceRate = attTotal ? Math.round((attPresent / attTotal) * 100) : 0;

  const recentStudents = await prisma.student.findMany({
    where: { branchId, isActive: true },
    select: { id: true, fullName: true, studentId: true, programType: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    students,
    teachers,
    classes,
    attendanceRate,
    overdueFees,
    recentStudents,
  };
}
