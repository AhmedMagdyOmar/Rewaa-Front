"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface PhoneCountryOption {
  id: number | string;
  name: string;
  country_code?: string | null;
  flag?: string | null;
}

interface PhoneInputWithCodeProps {
  id?: string;
  phone: string;
  phoneCode: string;
  onPhoneChange: (phone: string) => void;
  onPhoneCodeChange: (phoneCode: string) => void;
  countries?: PhoneCountryOption[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  customCodePlaceholder?: string;
}

// Fallback emoji flags based on common Arabic and English names
function getFallbackFlag(name: string): string {
  const cn = name.toLowerCase();
  if (cn.includes("egypt") || cn.includes("مصر")) return "🇪🇬";
  if (cn.includes("saudi") || cn.includes("سعود")) return "🇸🇦";
  if (cn.includes("emirates") || cn.includes("uae") || cn.includes("إمارات")) return "🇦🇪";
  if (cn.includes("kuwait") || cn.includes("كويت")) return "🇰🇼";
  if (cn.includes("qatar") || cn.includes("قطر")) return "🇶🇦";
  if (cn.includes("jordan") || cn.includes("أردن")) return "🇯🇴";
  if (cn.includes("oman") || cn.includes("عمان") || cn.includes("عُمان")) return "🇴🇲";
  if (cn.includes("bahrain") || cn.includes("بحرين")) return "🇧🇭";
  if (cn.includes("iraq") || cn.includes("عراق")) return "🇮🇶";
  if (cn.includes("palestine") || cn.includes("فلسطين")) return "🇵🇸";
  if (cn.includes("morocco") || cn.includes("مغرب")) return "🇲🇦";
  if (cn.includes("algeria") || cn.includes("جزائر")) return "🇩🇿";
  if (cn.includes("tunisia") || cn.includes("تونس")) return "🇹🇳";
  if (cn.includes("libya") || cn.includes("ليبيا")) return "🇱🇾";
  if (cn.includes("sudan") || cn.includes("سودان")) return "🇸🇩";
  if (cn.includes("yemen") || cn.includes("يمن")) return "🇾🇪";
  if (cn.includes("syria") || cn.includes("سوريا")) return "🇸🇾";
  if (cn.includes("lebanon") || cn.includes("لبنان")) return "🇱🇧";
  return "";
}

export function PhoneInputWithCode({
  id,
  phone,
  phoneCode,
  onPhoneChange,
  onPhoneCodeChange,
  countries = [],
  disabled = false,
  required = false,
  placeholder = "10XXXXXXXX",
  className,
  searchPlaceholder = "ابحث عن الدولة أو الرمز...",
  emptyPlaceholder = "لا توجد نتائج",
  customCodePlaceholder = "+...",
}: PhoneInputWithCodeProps) {
  const [open, setOpen] = React.useState(false);

  // Find country matching the current phoneCode
  const selectedCountry = React.useMemo(() => {
    if (!phoneCode) return null;
    const normalizedCode = phoneCode.startsWith("+") ? phoneCode : `+${phoneCode}`;
    return countries.find(
      (c) =>
        c.country_code &&
        (c.country_code === normalizedCode ||
          c.country_code === phoneCode ||
          `+${c.country_code.replace(/^\+/, "")}` === normalizedCode),
    );
  }, [countries, phoneCode]);

  const displayFlag = React.useMemo(() => {
    if (selectedCountry?.flag) {
      return (
        <span className="relative size-4 shrink-0 overflow-hidden rounded-full inline-block border">
          <Image
            src={selectedCountry.flag}
            alt={selectedCountry.name}
            fill
            className="object-cover"
          />
        </span>
      );
    }
    if (selectedCountry?.name) {
      const emoji = getFallbackFlag(selectedCountry.name);
      if (emoji) return <span className="text-sm shrink-0">{emoji}</span>;
    }
    return <Globe className="size-3.5 text-muted-foreground shrink-0" />;
  }, [selectedCountry]);

  return (
    <div className={cn("flex items-center gap-1.5 w-full", className)} dir="ltr">
      {/* Dial Code Dropdown + Direct Editor */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-10 px-2.5 min-w-24 justify-between font-mono text-sm bg-background hover:bg-accent/40 shrink-0"
          >
            <div className="flex items-center gap-1.5">
              {displayFlag}
              <span className="font-semibold text-foreground">
                {phoneCode ? (phoneCode.startsWith("+") ? phoneCode : `+${phoneCode}`) : "+--"}
              </span>
            </div>
            <ChevronsUpDown className="size-3 text-muted-foreground ms-1 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2 border-b bg-muted/40">
            <div className="text-xs text-muted-foreground mb-1.5 font-sans">رمز الدولة المخصص:</div>
            <Input
              value={phoneCode}
              onChange={(e) => {
                let val = e.target.value.trim();
                if (val && !val.startsWith("+")) {
                  val = `+${val}`;
                }
                onPhoneCodeChange(val);
              }}
              placeholder={customCodePlaceholder}
              className="h-8 text-xs font-mono"
              dir="ltr"
            />
          </div>

          <Command>
            <CommandInput placeholder={searchPlaceholder} className="text-xs" />
            <CommandList className="max-h-56">
              <CommandEmpty className="py-2.5 text-center text-xs text-muted-foreground">
                {emptyPlaceholder}
              </CommandEmpty>
              <CommandGroup>
                {countries.map((c) => {
                  const cCode = c.country_code
                    ? c.country_code.startsWith("+")
                      ? c.country_code
                      : `+${c.country_code}`
                    : "";
                  const isSelected = selectedCountry?.id === c.id || phoneCode === cCode;
                  const fallbackEmoji = getFallbackFlag(c.name);

                  return (
                    <CommandItem
                      key={String(c.id)}
                      value={`${c.name} ${cCode}`}
                      onSelect={() => {
                        if (cCode) {
                          onPhoneCodeChange(cCode);
                        }
                        setOpen(false);
                      }}
                      className="flex items-center justify-between text-xs py-1.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {c.flag ? (
                          <span className="relative size-4 shrink-0 overflow-hidden rounded-full border">
                            <Image src={c.flag} alt={c.name} fill className="object-cover" />
                          </span>
                        ) : fallbackEmoji ? (
                          <span className="text-sm shrink-0">{fallbackEmoji}</span>
                        ) : (
                          <Globe className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate font-sans">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-muted-foreground">
                        <span>{cCode}</span>
                        {isSelected && <Check className="size-3.5 text-primary" />}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input */}
      <Input
        id={id}
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="flex-1 h-10 font-mono text-sm bg-background"
        dir="ltr"
      />
    </div>
  );
}
