"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/language-provider"
import { format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { ArrowRight, Calendar, CreditCard, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

// Payment types
type PaymentType = "porez" | "pio" | "zdravstveno" | "nezaposlenost"
type PaymentStatus = "pending" | "paid" | "overdue"

interface Payment {
  id: string
  user_id: string
  payment_type: PaymentType
  due_date: string
  amount: number
  status: PaymentStatus
  paid_at?: string
  recipient: string
  recipient_location?: string
  model: string
  reference_number: string
  payment_purpose: string
  account_number: string
  payment_code: string
}

export default function PaymentsPage() {
  const { t, language } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  console.log(
    "[Payments] Initial render - authLoading:",
    authLoading,
    "user:",
    user?.id ? `exists (${user.id})` : "null",
  )

  useEffect(() => {
    console.log(
      "[Payments] useEffect triggered - authLoading:",
      authLoading,
      "user:",
      user?.id ? `exists (${user.id})` : "null",
    )

    // Only fetch payments when auth is complete and we have a user
    if (authLoading) {
      console.log("[Payments] Auth still loading, skipping fetchData")
      return
    }

    async function fetchPayments() {
      console.log("[Payments] fetchPayments() called")

      // Create a timeout to detect stalled queries
      const timeoutId = setTimeout(() => {
        console.error("[Payments] TIMEOUT: Supabase queries took too long (>10s)")
        setIsLoading(false)
        setError("Request timeout - Database queries are taking too long")
      }, 10000)

      try {
        setIsLoading(true)
        setError(null)

        if (!user || !user.id) {
          console.log("[Payments] No user found, aborting data fetch")
          setIsLoading(false)
          setError("User not authenticated")
          clearTimeout(timeoutId)
          return
        }

        console.log("[Payments] Fetching payments for user:", user.id)
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: false })

        console.log("[Payments] Payments data result:", data ? `${data.length} items` : "null", "error:", error)

        if (error) {
          console.error("[Payments] Payments fetch error:", error)
          throw error
        }

        console.log("[Payments] Setting payments state with data")
        setPayments(data || [])

        // Initialize expanded months
        const currentDate = new Date()
        const currentMonthKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`
        setExpandedMonths({ [currentMonthKey]: true })
      } catch (error: any) {
        console.error("[Payments] Error fetching payments:", error)
        setError(error.message || "Failed to load payments")
        toast({
          title: "Error",
          description: "Failed to load payments. Please try again.",
          variant: "destructive",
        })
      } finally {
        clearTimeout(timeoutId)
        console.log("[Payments] Finally block, setting isLoading to false")
        setIsLoading(false)
      }
    }

    fetchPayments()

    console.log("[Payments] useEffect completed setup")
  }, [supabase, user, authLoading])

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }))
  }

  const getMonthName = (monthKey: string) => {
    const [month, year] = monthKey.split("-").map(Number)
    const date = new Date(year, month)
    return format(date, "MMMM yyyy")
  }

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return <span className="status-badge status-pending">{t("pending")}</span>
      case "paid":
        return <span className="status-badge status-paid">{t("paid")}</span>
      case "overdue":
        return <span className="status-badge status-overdue">{t("overdue")}</span>
    }
  }

  const getPaymentTypeName = (type: PaymentType) => {
    return t(type)
  }

  const getPaymentIcon = (type: PaymentType) => {
    switch (type) {
      case "porez":
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
        )
      case "pio":
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-purple-600" />
          </div>
        )
      case "zdravstveno":
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
        )
      case "nezaposlenost":
        return (
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-orange-600" />
          </div>
        )
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-gray-600" />
          </div>
        )
    }
  }

  // Filter payments by status
  const pendingPayments = payments.filter((payment) => payment.status === "pending")
  const overduePayments = payments.filter((payment) => payment.status === "overdue")
  const paidPayments = payments.filter((payment) => payment.status === "paid")

  // Group paid payments by month
  const paidPaymentsByMonth = paidPayments.reduce<Record<string, Payment[]>>((acc, payment) => {
    if (payment.paid_at) {
      const paidDate = new Date(payment.paid_at)
      const month = paidDate.getMonth()
      const year = paidDate.getFullYear()
      const key = `${month}-${year}`

      if (!acc[key]) {
        acc[key] = []
      }

      acc[key].push(payment)
    }

    return acc
  }, {})

  // Sort the months in descending order (newest first)
  const sortedMonthKeys = Object.keys(paidPaymentsByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split("-").map(Number)
    const [monthB, yearB] = b.split("-").map(Number)

    if (yearA !== yearB) {
      return yearB - yearA // Sort by year descending
    }

    return monthB - monthA // Sort by month descending
  })

  console.log("[Payments] Rendering - authLoading:", authLoading, "isLoading:", isLoading, "error:", error)

  if (authLoading || isLoading) {
    console.log("[Payments] Showing loading state")
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Loading payments..." : "Učitavanje plaćanja..."}
            </h2>
            <p className="text-muted-foreground">{language === "en" ? "Please wait" : "Molimo sačekajte"}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    console.log("[Payments] Showing error state:", error)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Error Loading Payments" : "Greška pri učitavanju plaćanja"}
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>{language === "en" ? "Try Again" : "Pokušaj ponovo"}</Button>
        </div>
      </DashboardLayout>
    )
  }

  console.log(
    "[Payments] Showing normal content state with payment counts - pending:",
    pendingPayments.length,
    "overdue:",
    overduePayments.length,
    "paid:",
    paidPayments.length,
  )
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("payments")}</h1>
          <p className="text-muted-foreground">{t("paymentsDescription")}</p>
        </div>

        <Tabs defaultValue="pending" className="bg-white rounded-lg shadow-sm">
          <TabsList className="grid w-full grid-cols-3 p-1">
            <TabsTrigger
              value="pending"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {t("pending")}{" "}
              {pendingPayments.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {t("overdue")}{" "}
              {overduePayments.length > 0 && (
                <span className="ml-2 rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium">
                  {overduePayments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="paid"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {t("paid")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="p-4">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p>{language === "en" ? "No pending payments" : "Nema plaćanja na čekanju"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="payment-card bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentIcon(payment.payment_type)}
                        <div>
                          <div className="font-medium">{getPaymentTypeName(payment.payment_type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(payment.due_date), "dd.MM.yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{payment.amount.toLocaleString()} RSD</div>
                        <div>{getStatusBadge(payment.status)}</div>
                      </div>
                      <Link href={`/payment/${payment.id}`}>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="p-4">
            {overduePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p>{language === "en" ? "No overdue payments" : "Nema zakasnelih plaćanja"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overduePayments.map((payment) => (
                  <div key={payment.id} className="payment-card overdue bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentIcon(payment.payment_type)}
                        <div>
                          <div className="font-medium">{getPaymentTypeName(payment.payment_type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(payment.due_date), "dd.MM.yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{payment.amount.toLocaleString()} RSD</div>
                        <div>{getStatusBadge(payment.status)}</div>
                      </div>
                      <Link href={`/payment/${payment.id}`}>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="p-4">
            {paidPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p>{language === "en" ? "No paid payments" : "Nema plaćenih plaćanja"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMonthKeys.map((monthKey) => (
                  <Collapsible
                    key={monthKey}
                    open={expandedMonths[monthKey]}
                    onOpenChange={() => toggleMonth(monthKey)}
                    className="border rounded-lg overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="font-medium">{getMonthName(monthKey)}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {paidPaymentsByMonth[monthKey].length} {t("paid").toLowerCase()}
                        </span>
                        {expandedMonths[monthKey] ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-3 p-4">
                        {paidPaymentsByMonth[monthKey]
                          .sort((a, b) => {
                            // Sort by paid date (newest first)
                            if (a.paid_at && b.paid_at) {
                              return new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
                            }
                            return 0
                          })
                          .map((payment) => (
                            <div key={payment.id} className="payment-card paid bg-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getPaymentIcon(payment.payment_type)}
                                  <div>
                                    <div className="font-medium">{getPaymentTypeName(payment.payment_type)}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {payment.paid_at && `Plaćeno: ${format(parseISO(payment.paid_at), "dd.MM.yyyy")}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">{payment.amount.toLocaleString()} RSD</div>
                                  <div>{getStatusBadge(payment.status)}</div>
                                </div>
                                <Link href={`/payment/${payment.id}`}>
                                  <Button variant="ghost" size="sm" className="ml-2">
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
