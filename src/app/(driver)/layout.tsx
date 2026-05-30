import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

async function signOut() {
  "use server";
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
}

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.user.role !== "driver") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <h1 className="text-lg font-bold">DeliveryFlow</h1>
        <form action={signOut}>
          <Button variant="ghost" size="icon" type="submit">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
