import * as React from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navConfig } from "@/config/nav-config";

// 1. The stateless trigger button
export function SearchTrigger({
  className,
  onClick,
  shortcut = "k",
}: {
  className?: string;
  onClick: () => void;
  shortcut?: string;
}) {
  let modifier = "Ctrl";
  if (typeof navigator !== "undefined") {
    modifier = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl";
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "relative h-9 w-9 p-0 md:w-40 md:px-3 lg:w-64 justify-center md:justify-start rounded-lg bg-background text-sm font-normal text-muted-foreground shadow-none transition-all hover:bg-accent",
        className,
      )}
      onClick={onClick}
    >
      <Search className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline-flex">Search...</span>
      <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
        <span className="text-xs">{modifier}+</span>
        <span className="uppercase">{shortcut}</span>
      </kbd>
    </Button>
  );
}

// 2. The modal and keyboard listener
export function SearchDialog({
  open,
  setOpen,
  shortcut = "k",
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shortcut?: string;
}) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === shortcut.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [shortcut, setOpen]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navConfig.sidebarNav.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => {
                runCommand(() => {
                  if (item.isExternal || item.href.startsWith("http")) {
                    window.open(item.href, "_blank", "noopener,noreferrer");
                  } else {
                    router.push(item.href);
                  }
                });
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
