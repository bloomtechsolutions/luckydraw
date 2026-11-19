import { prisma } from "@/lib/db";
import ConfirmButton from "@/components/ConfirmButton";
import { addDepartments, deleteDepartment } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const depts = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Departments</h1>
        <p className="text-slate-600">These appear as a dropdown on the registration form. If the list is empty, staff type their department.</p>
      </div>
      <form action={addDepartments} className="card space-y-3 p-5">
        <label className="label" htmlFor="names">Add departments (one per line, or comma separated)</label>
        <textarea id="names" name="names" rows={5} placeholder={"Finance\nHuman Resources\nIT\nOperations"} className="input" />
        <button className="btn-primary">Add</button>
      </form>
      <section className="card divide-y divide-slate-100">
        {depts.length === 0 && <p className="p-5 text-sm text-slate-500">No departments yet.</p>}
        {depts.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-5 py-2.5">
            <span>{d.name}</span>
            <ConfirmButton action={deleteDepartment.bind(null, d.id)} confirm={`Remove "${d.name}" from the list? Existing registrations keep their department.`}>
              Remove
            </ConfirmButton>
          </div>
        ))}
      </section>
    </div>
  );
}
