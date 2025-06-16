import { auth, signOut } from "@/app/(auth)/auth";
import Link from "next/link";
import { History } from "./history";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { CopyButton } from "./copy-button";
import { Suspense } from "react";

export const Navbar = async () => {
  let session = await auth();

  return (
    <div className="bg-white absolute top-0 left-0 w-dvw border-b dark:border-zinc-800 py-2 px-3 justify-between flex flex-row items-center dark:bg-zinc-900 z-30">
      <div className="flex flex-row gap-3 items-center">
        <History apiKey={session?.user?.apiKey} />
        <div className="text-sm dark:text-zinc-300">
          Internal Knowledge Base
        </div>
      </div>

      {session ? (
        <>
          <div className="group py-1 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer relative">
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm">
                {session.user?.email}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Suspense>
                    <CopyButton value={session.user?.apiKey}>
                      <Button
                        variant="ghost"
                        className="w-full bg-background h-auto overflow-hidden text-ellipsis whitespace-nowrap text-left block max-w-[200px]"
                      >
                        {session.user?.apiKey}
                      </Button>
                    </CopyButton>
                  </Suspense>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form
                    className="!p-0"
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <Button
                      className="w-full h-auto"
                      variant="ghost"
                      type="submit"
                    >
                      Sign out
                    </Button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <Link
          href="login"
          className="text-sm p-1 px-2 bg-zinc-900 rounded-md text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Login
        </Link>
      )}
    </div>
  );
};
