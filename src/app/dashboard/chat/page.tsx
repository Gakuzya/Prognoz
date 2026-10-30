import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import AiChatClient from "@/components/dashboard/AiChatClient";

export default async function ChatPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-4">
      <AiChatClient
        initialCompany={
          company
            ? {
                name: company.name,
                industry: company.industry || undefined,
                currency: company.currency,
              }
            : undefined
        }
      />
    </div>
  );
}
