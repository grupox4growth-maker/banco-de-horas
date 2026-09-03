import { redirect } from "next/navigation";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { EmployeePanel } from "@/components/EmployeePanel";
import { todayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function MePage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await requireSession();
  if (session.role === "MANAGER") redirect("/dashboard");

  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : todayISO();

  const employee = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      entries: { orderBy: { data: "desc" } },
      productivity: { orderBy: { data: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!employee) redirect("/login");

  return (
    <>
      <Header session={session} />
      <main className="wrap grid" style={{ gap: 14 }}>
        <EmployeePanel employee={employee} canManage={false} date={date} />
      </main>
    </>
  );
}
