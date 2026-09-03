import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { EmployeePanel } from "@/components/EmployeePanel";
import { todayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const session = await requireManager();
  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : todayISO();

  const employee = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      entries: { orderBy: { date: "desc" } },
      productivity: { orderBy: { date: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!employee || employee.role !== "EMPLOYEE") notFound();

  return (
    <>
      <Header session={session} active="employees" />
      <main className="wrap grid" style={{ gap: 14 }}>
        <div className="row">
          <Link href="/employees" className="btn ghost sm">
            ‹ Voltar
          </Link>
        </div>
        <EmployeePanel employee={employee} canManage date={date} />
      </main>
    </>
  );
}
