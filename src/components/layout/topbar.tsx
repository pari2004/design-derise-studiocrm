"use client";

import Link from "next/link";
import {
  Calendar,
  Plus,
  Settings,
  LogOut,
  UserPlus,
  FolderPlus,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "./global-search";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { logoutAction } from "@/app/(auth)/actions";
import { initials } from "@/lib/format";
import { ROLE_LABELS, type SessionUser } from "@/lib/roles";
import type { Notification } from "@/db/schema";

export function Topbar({
  user,
  notifications,
  unreadCount,
}: {
  user: SessionUser;
  notifications: Notification[];
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/40 bg-white/55 px-4 backdrop-blur-xl md:px-6">
      <MobileNav>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </MobileNav>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5">
        <QuickCreate />

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Schedule"
        >
          <Link href="/tasks">
            <Calendar className="text-taupe" />
          </Link>
        </Button>

        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
        />

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Settings"
        >
          <Link href="/settings">
            <Settings className="text-taupe" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-white/70">
              <Avatar className="h-9 w-9 ring-2 ring-white">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight lg:block">
                <p className="text-sm font-semibold text-charcoal-text">
                  {user.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold text-charcoal-text">{user.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <button type="submit" className="w-full">
                <DropdownMenuItem destructive asChild>
                  <span>
                    <LogOut className="h-4 w-4" /> Sign out
                  </span>
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function QuickCreate() {
  return (
    <>
      {/* Primary CTA */}
      <Button asChild variant="default" size="sm" className="hidden md:inline-flex">
        <Link href="/projects?new=1">
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="lime" size="icon" className="md:hidden" aria-label="Quick create">
            <Plus />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Quick create</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/projects?new=1">
              <FolderPlus className="h-4 w-4" /> New Project
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/leads?new=1">
              <UserPlus className="h-4 w-4" /> New Lead
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/quotations?new=1">
              <FileText className="h-4 w-4" /> New Quotation
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
