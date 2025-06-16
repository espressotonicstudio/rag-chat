import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound, redirect } from "next/navigation";
import { FilesList } from "@/components/files-list";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.apiKey) {
    redirect("/login");
  }

  const config = await getConfigByApiKey(session?.user?.apiKey);

  if (!config) {
    notFound();
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Knowledge Base</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 p-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-3 h-full">
            <div className="rounded-lg overflow-hidden h-full">
              <FilesList
                session={session}
                config={config}
              />
            </div>
            <div className="rounded-lg overflow-hidden">
              <iframe
                src={`/?isIframe=true&apiKey=${session?.user?.apiKey}&author=${session?.user?.email}`}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
