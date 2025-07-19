
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

type NavLink = {
  href: string;
  label: string;
};

type NavItemWithItems = {
  label: string;
  items: NavLink[];
  href?: undefined;
};

type NavItemWithHref = {
  href: string;
  label: string;
  items?: undefined;
};

type NavItemType = NavItemWithItems | NavItemWithHref;

interface NavItemProps {
  item: NavItemType;
  isMobile: boolean;
  closeSheet?: () => void;
}

const NavItemComponent: React.FC<NavItemProps> = ({ item, isMobile, closeSheet }) => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  if (item.items) {
    const isDropdownActive = item.items.some((subItem) => isActive(subItem.href));

    if (isMobile) {
      return (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={item.label} className="border-b-0">
            <AccordionTrigger
              className={cn(
                "py-2 text-lg font-medium transition-colors hover:no-underline hover:text-primary [&[data-state=open]]:text-primary",
                isDropdownActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {item.label}
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <nav className="flex flex-col gap-2 pl-4 pt-2">
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={closeSheet}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-primary",
                      isActive(subItem.href)
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </nav>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "text-sm font-medium transition-colors hover:bg-transparent hover:text-primary focus-visible:ring-0",
              isDropdownActive
                ? "text-primary font-semibold"
                : "text-muted-foreground",
              "px-2"
            )}
            aria-expanded={isDropdownActive}
          >
            {item.label}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.items.map((subItem) => (
            <DropdownMenuItem key={subItem.href} asChild>
              <Link href={subItem.href}>{subItem.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={closeSheet}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        isMobile ? "text-lg" : "",
        isActive(item.href!) ? "text-primary font-semibold" : "text-muted-foreground"
      )}
    >
      {item.label}
    </Link>
  );
};

export const NavItem = React.memo(NavItemComponent);
