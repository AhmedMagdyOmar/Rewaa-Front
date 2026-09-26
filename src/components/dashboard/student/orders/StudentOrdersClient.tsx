"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentOrders } from "@/hooks/use-student-orders";
import type { BackendOrder, BackendOrderStatus } from "@/types/api-contracts";

export function StudentOrdersClient() {
  const locale = useLocale();

  const t = useTranslations("studentOrders.list");
  const tStatus = useTranslations("studentOrders.status");
  const tCommon = useTranslations("common");

  const [mounted, setMounted] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, refetch, isFetching } = useStudentOrders({
    status: statusFilter === "all" ? undefined : (statusFilter as BackendOrderStatus),
    search: debouncedSearch.trim() || undefined,
  });

  const orders = data?.orders ?? [];

  const resolveTranslation = (field?: Record<string, string> | string | null): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const getStatusBadge = (status: BackendOrderStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1.5 font-medium">
            <CheckCircle2 className="size-3.5" />
            {tStatus("paid")}
          </Badge>
        );
      case "awaiting_payment":
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1.5 font-medium">
            <Clock className="size-3.5" />
            {tStatus("awaiting_payment")}
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1.5 font-medium">
            <RefreshCw className="size-3.5 animate-spin" />
            {tStatus("under_review")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1.5 font-medium">
            <XCircle className="size-3.5" />
            {tStatus("cancelled")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1.5 font-medium">
            <AlertCircle className="size-3.5" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShoppingBag className="size-7 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={mounted ? isFetching : false}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 ${mounted && isFetching ? "animate-spin" : ""}`} />
          {tCommon("refresh")}
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="ps-9 h-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="size-4 text-muted-foreground shrink-0 hidden sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder={t("filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="awaiting_payment">{tStatus("awaiting_payment")}</SelectItem>
                <SelectItem value="under_review">{tStatus("under_review")}</SelectItem>
                <SelectItem value="paid">{tStatus("paid")}</SelectItem>
                <SelectItem value="cancelled">{tStatus("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List / Loading / Empty */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-center p-8">
          <AlertCircle className="size-10 text-destructive mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-lg mb-1">{t("errorTitle")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("errorDesc")}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {tCommon("refresh")}
          </Button>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-border/60 border-dashed text-center p-12">
          <ShoppingBag className="size-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-lg mb-1">{t("emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{t("emptyDesc")}</p>
          <Button asChild>
            <Link href="/student-dashboard/courses/explore">{t("exploreCourses")}</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order: BackendOrder) => {
            const itemCount = order.items?.length ?? 0;
            const courseTitles =
              order.items
                ?.map((item) => resolveTranslation(item.course_title))
                .filter(Boolean)
                .join(", ") || t("courseFallback");

            const isAwaitingPayment =
              order.status === "awaiting_payment" || order.status === "pending";

            const rawCurrency = order.currency_code;
            const currency = rawCurrency
              ? rawCurrency === "SAR"
                ? tCommon("sar")
                : rawCurrency === "EGP"
                  ? tCommon("egp")
                  : rawCurrency
              : tCommon("egp");

            return (
              <Card
                key={order.id}
                className="border-border/60 hover:border-border transition-all duration-200 shadow-2xs hover:shadow-xs"
              >
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-foreground text-base">
                        {order.order_number || `#${order.id}`}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>

                    <p
                      className="text-sm font-medium text-foreground/90 truncate"
                      title={courseTitles}
                    >
                      {courseTitles}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {t("itemsCount")} <strong className="text-foreground">{itemCount}</strong>
                      </span>
                      <span>
                        {t("total")}{" "}
                        <strong className="text-foreground">
                          {Number(order.total_amount).toFixed(2)} {currency}
                        </strong>
                      </span>
                      {order.status !== "paid" && Number(order.remaining_amount) > 0 && (
                        <span className="text-amber-600 font-medium">
                          {t("remaining")} {Number(order.remaining_amount).toFixed(2)} {currency}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                    {isAwaitingPayment ? (
                      <Button asChild size="sm" className="gap-1.5 font-semibold">
                        <Link href={`/student-dashboard/orders/${order.id}`}>
                          {t("completePayment")}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href={`/student-dashboard/orders/${order.id}`}>
                          <Eye className="size-4" />
                          {t("viewDetails")}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
