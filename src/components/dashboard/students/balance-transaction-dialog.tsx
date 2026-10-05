"use client";

import { ArrowRight, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentWallet } from "@/hooks/use-students";
import { Textarea } from "@/components/ui/textarea";

import { TransactionType } from "@/types/student";

interface BalanceTransactionDialogProps {
  studentName: string;
  studentId?: string;
  currentBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    type: TransactionType;
    amount: number;
    activeBalance: number;
    notes?: string;
  }) => void;
}

export function BalanceTransactionDialog({
  studentName,
  studentId,
  currentBalance,
  isOpen,
  onClose,
  onConfirm,
}: BalanceTransactionDialogProps) {
  const tModal = useTranslations("studentsPage.transactionModal");
  const tDetails = useTranslations("studentsPage.details");

  const { data: walletData } = useStudentWallet(isOpen && studentId ? studentId : undefined);
  const activeBalance =
    walletData?.balance !== undefined && !isNaN(Number(walletData.balance))
      ? Number(walletData.balance)
      : currentBalance;

  const [transactionType, setTransactionType] = React.useState<TransactionType>("deposit");

  const [amountInput, setAmountInput] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const amountNumber = parseFloat(amountInput) || 0;

  // Calculate projected new balance based on transaction type
  const calculateNewBalance = (): number => {
    switch (transactionType) {
      case "deposit":
      case "refund":
        return activeBalance + amountNumber;
      case "withdraw":
        return Math.max(0, activeBalance - amountNumber);
      case "adjustment":
        return amountNumber;
      default:
        return activeBalance;
    }
  };

  const projectedBalance = calculateNewBalance();

  const handleConfirm = () => {
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setErrorMsg(tModal("invalidAmount"));
      return;
    }

    if (transactionType === "adjustment" && amountNumber === activeBalance) {
      setErrorMsg(tModal("unchangedBalance"));
      return;
    }

    onConfirm({
      type: transactionType,
      amount: amountNumber,
      activeBalance,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setAmountInput("");
    setNotes("");
    setErrorMsg(null);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrorMsg(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Wallet className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {tModal("summaryTitle")}
            </span>
          </div>
          {/* First label as requested by user */}
          <DialogTitle className="text-lg font-bold">
            {tModal("headerLabel", { name: studentName })}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {tModal("previousBalance")}:{" "}
            <span className="font-semibold text-foreground" dir="ltr">
              {activeBalance} {tDetails("currency")}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Transaction Type Select */}
          <div className="space-y-2">
            <Label htmlFor="tx-type" className="text-xs font-semibold">
              {tModal("transactionType")}
            </Label>
            <Select
              value={transactionType}
              onValueChange={(val) => setTransactionType(val as TransactionType)}
            >
              <SelectTrigger id="tx-type" className="bg-background">
                <SelectValue placeholder={tModal("selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">{tModal("types.deposit")}</SelectItem>
                <SelectItem value="withdraw">{tModal("types.withdraw")}</SelectItem>
                <SelectItem value="refund">{tModal("types.refund")}</SelectItem>
                <SelectItem value="adjustment">{tModal("types.adjustment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="tx-amount" className="text-xs font-semibold">
              {tModal("amount")}
            </Label>
            <div className="relative">
              <Input
                id="tx-amount"
                type="number"
                min="0"
                step="any"
                placeholder={tModal("amountPlaceholder")}
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="bg-background"
              />
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="tx-notes" className="text-xs font-semibold">
              {tModal("notes")}
            </Label>
            <Textarea
              id="tx-notes"
              rows={2}
              placeholder={tModal("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background text-xs resize-none"
            />
          </div>

          {/* Transaction Summary Div Container */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{tModal("summaryTitle")}</span>
              <span className="capitalize text-primary">
                {tModal(`types.${transactionType}` as Parameters<typeof tModal>[0])}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>{tModal("amountSummary")}</span>
              <span className=" font-semibold text-foreground" dir="ltr">
                {amountNumber > 0 ? `${amountNumber} ${tDetails("currency")}` : "-"}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>{tModal("previousBalance")}</span>
              <span className=" font-medium text-foreground" dir="ltr">
                {activeBalance} {tDetails("currency")}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 font-bold">
              <span className="text-foreground flex items-center gap-1">
                <span>{tModal("newBalance")}</span>
                <ArrowRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
              </span>
              <span className=" text-sm text-emerald-600" dir="ltr">
                {projectedBalance} {tDetails("currency")}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            {tModal("cancel")}
          </Button>

          <Button type="button" onClick={handleConfirm}>
            {tModal("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
