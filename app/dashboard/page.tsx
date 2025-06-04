"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useTranslation } from "@/components/language-provider"
import { format, isSameMonth, isSameYear, parseISO } from "date-fns"
import {
  ArrowRight,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

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

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false)
  const [hasPaymentDetails, setHasPaymentDetails] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})
  const [yearlyRevenueLimit, setYearlyRevenueLimit] = useState(6000000)
  const [currentYearRevenue, setCurrentYearRevenue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastPaymentGenerationDate, setLastPaymentGenerationDate] = useState<Date | null>(null)

  useEffect(() => {
    // Load data from Supabase when component mounts
    const loadData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const supabase = getSupabaseClient()

        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw new Error(`Error loading profile: ${profileError.message}`)
        }

        // If no profile exists, create a minimal one
        if (!profile) {
          const { error: createProfileError } = await supabase.from("profiles").upsert({
            id: user.id,
            taxation_type: "pausalno", // Default value
            yearly_revenue_limit: "6000000", // Default value
          })

          if (createProfileError) {
            console.error("Error creating profile:", createProfileError)
          }

          // Show welcome guide for new users
          setShowWelcomeGuide(true)
        } else {
          // Set yearly revenue limit
          if (profile.yearly_revenue_limit) {
            setYearlyRevenueLimit(Number(profile.yearly_revenue_limit))
          }

          // Show welcome guide if needed
          if (!profile.has_seen_welcome_guide) {
            setShowWelcomeGuide(true)
          }

          // Store last payment generation date if available
          if (profile.last_payment_generation_date) {
            setLastPaymentGenerationDate(new Date(profile.last_payment_generation_date))
          }
        }

        // Check if user has payment details set up
        const { data: paymentDetails, error: paymentDetailsError } = await supabase
          .from("payment_details")
          .select("*")
          .eq("user_id", user.id)

        if (paymentDetailsError) {
          throw new Error(paymentDetailsError.message)
        }

        setHasPaymentDetails(paymentDetails && paymentDetails.length > 0)

        // Load payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: false })

        if (paymentsError) {
          throw new Error(paymentsError.message)
        }

        // Check if we need to generate payments for current month
        if (paymentsData) {
          setPayments(paymentsData)
          if (hasPaymentDetails) {
            await checkAndGenerateMonthlyPayments(paymentsData)
          }
        }

        // Calculate current year revenue from invoices
        await calculateCurrentYearRevenue()

        // Initialize expanded months
        const currentDate = new Date()
        const currentMonthKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`
        setExpandedMonths({ [currentMonthKey]: true })
      } catch (error: any) {
        console.error("Error loading dashboard data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  // Check if we need to generate payments for the current month
  const checkAndGenerateMonthlyPayments = async (existingPayments: Payment[]) => {
    if (!user) return

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    try {
      // Get the last payment generation date from profile
      const supabase = getSupabaseClient()
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("last_payment_generation_date")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching last payment generation date:", profileError)
        return
      }

      // Check if we already generated payments this month
      if (profile?.last_payment_generation_date) {
        const lastGenDate = new Date(profile.last_payment_generation_date)
        if (lastGenDate.getMonth() === currentMonth && lastGenDate.getFullYear() === currentYear) {
          // Already generated payments for this month
          return
        }
      }

      // Check if we already have payments for this month for each payment type
      const paymentTypes: PaymentType[] = ["porez", "pio", "zdravstveno", "nezaposlenost"]
      const needGeneration: PaymentType[] = []

      for (const type of paymentTypes) {
        // Check if we have a payment for this type in current month
        const hasPaymentForCurrentMonth = existingPayments.some((payment) => {
          const paymentDate = new Date(payment.due_date)
          return (
            payment.payment_type === type &&
            isSameMonth(paymentDate, new Date(currentYear, currentMonth)) &&
            isSameYear(paymentDate, new Date(currentYear, currentMonth))
          )
        })

        if (!hasPaymentForCurrentMonth) {
          needGeneration.push(type)
        }
      }

      if (needGeneration.length > 0) {
        await generateMonthlyPayments(needGeneration)

        // Update the last payment generation date in profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ last_payment_generation_date: currentDate.toISOString() })
          .eq("id", user.id)

        if (updateError) {
          console.error("Error updating last payment generation date:", updateError)
        }

        // Reload payments after generation
        const { data: refreshedPayments, error: refreshError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: false })

        if (refreshError) {
          console.error("Error refreshing payments:", refreshError)
          return
        }

        if (refreshedPayments) {
          setPayments(refreshedPayments)
        }
      }
    } catch (error) {
      console.error("Error checking and generating monthly payments:", error)
      toast({
        title: "Error",
        description: "Failed to check or generate monthly payments",
        variant: "destructive",
      })
    }
  }

  // Generate new payments for the current month
  const generateMonthlyPayments = async (paymentTypes: PaymentType[]) => {
    if (!user) return

    try {
      const currentDate = new Date()
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15)

      // Get payment details
      const supabase = getSupabaseClient()
      const { data: paymentDetails, error: detailsError } = await supabase
        .from("payment_details")
        .select("*")
        .eq("user_id", user.id)

      if (detailsError) {
        throw new Error(`Error fetching payment details: ${detailsError.message}`)
      }

      if (!paymentDetails || paymentDetails.length === 0) {
        console.warn("No payment details found for user")
        return
      }

      // Create a payment for each needed type
      for (const type of paymentTypes) {
        const detail = paymentDetails.find((d) => d.payment_type === type)
        if (detail) {
          const { error: insertError } = await supabase.from("payments").insert({
            user_id: user.id,
            payment_type: type,
            due_date: dueDate.toISOString(),
            amount: detail.amount,
            status: "pending",
            recipient: detail.recipient,
            recipient_location: detail.recipient_location,
            model: detail.model,
            reference_number: detail.reference_number,
            payment_purpose: detail.payment_purpose,
            account_number: detail.account_number,
            payment_code: detail.payment_code,
          })

          if (insertError) {
            console.error(`Error creating payment for ${type}:`, insertError)
          }
        }
      }
    } catch (error) {
      console.error("Error generating monthly payments:", error)
      toast({
        title: "Error",
        description: "Failed to generate monthly payments",
        variant: "destructive",
      })
    }
  }

  // Calculate current year revenue from invoices
  const calculateCurrentYearRevenue = async () => {
    if (!user) return

    try {
      const supabase = getSupabaseClient()
      const currentYear = new Date().getFullYear()
      const startDate = new Date(currentYear, 0, 1).toISOString()
      const endDate = new Date(currentYear, 11, 31).toISOString()

      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)

      if (error) {
        throw new Error(`Error fetching invoices: ${error.message}`)
      }

      if (invoices) {
        const totalRevenue = invoices.reduce((sum, invoice) => {
          return sum + (invoice.amount || 0)
        }, 0)

        setCurrentYearRevenue(totalRevenue)
      }
    } catch (error) {
      console.error("Error calculating revenue:", error)
      toast({
        title: "Error",
        description: "Failed to calculate yearly revenue",
        variant: "destructive",
      })
    }
  }

  const dismissWelcomeGuide = async () => {
    if (!user) return

    setShowWelcomeGuide(false)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("profiles").update({ has_seen_welcome_guide: true }).eq("id", user.id)

      if (error) {
        throw new Error(`Error updating profile: ${error.message}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update welcome guide status",
        variant: "destructive",
      })
    }
  }

  // Filter payments by status
  const dueNowPayments = payments.filter((payment) => payment.status === "pending")
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
    }
  }

  // Calculate total amounts
  const totalDueNow = dueNowPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)

  // Calculate revenue progress percentage
  const revenueProgressPercentage = Math.min(100, (currentYearRevenue / yearlyRevenueLimit) * 100)

  // Format the revenue limit for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sr-RS").format(amount)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.welcome")}</h1>
          <p className="text-muted-foreground">{t("dashboard.summary")}</p>
        </div>

        {/* Yearly Revenue Limit Tracker */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Godišnji limit prihoda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-muted-foreground">Trenutni prihod:</span>
                <span className="ml-2 font-bold">{formatCurrency(currentYearRevenue)} RSD</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Limit:</span>
                <span className="ml-2 font-bold">{formatCurrency(yearlyRevenueLimit)} RSD</span>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={revenueProgressPercentage} className="h-2" />
              <div className="text-xs text-right text-muted-foreground">
                {revenueProgressPercentage.toFixed(1)}% iskorišćeno
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  Postoje dva limita koje je potrebno pratiti – limit od 6 i 8 miliona dinara. Ukoliko se bilo koji od
                  ova dva limita prekorači, gubi se pravo na paušalno oporezivanje i preduzetnik je u obavezi da odluči
                  kako će se na dalje oporezivati i u skladu sa time podnese prijavu. PID27 brine o tome da ne
                  prekoračiš limit.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome guide now shows for new users and prompts them to set up payment details */}
        {showWelcomeGuide && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-start">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-800 mb-2">Dobrodošli u PID27!</h2>
                    <p className="text-blue-700 mb-4">
                      Da biste mogli da koristite IPS QR kodove za plaćanje, potrebno je da podesite detalje plaćanja.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Link href="/settings">
                        <Button className="bg-blue-600 hover:bg-blue-700">Podesi detalje plaćanja</Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={dismissWelcomeGuide}
                      >
                        Kasnije
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissWelcomeGuide}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasPaymentDetails && !showWelcomeGuide && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <Info className="h-5 w-5 text-amber-600" />
            <AlertTitle>Podešavanje IPS QR kodova</AlertTitle>
            <AlertDescription className="mt-2">
              Da biste mogli da koristite IPS QR kodove za plaćanje, potrebno je da podesite detalje plaćanja.
              <div className="mt-2">
                <Link href="/settings">
                  <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100">
                    Podesi detalje plaćanja
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.dueThisMonth")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDueNow.toLocaleString()} RSD</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dueNowPayments.length} {t("dueNow").toLowerCase()}
              </p>
              <div className="mt-2">
                <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-1" />
                <span className="text-xs text-muted-foreground">
                  15.{new Date().getMonth() + 1}.{new Date().getFullYear()}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.overduePayments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString()} RSD</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overduePayments.length} {t("overdue").toLowerCase()}
              </p>
              <div className="mt-2">
                <AlertTriangle className="h-4 w-4 text-red-500 inline-block mr-1" />
                <span className="text-xs text-red-500">{t("overdue")}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.paidThisYear")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPaid.toLocaleString()} RSD</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paidPayments.length} {t("paid").toLowerCase()}
              </p>
              <div className="mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 inline-block mr-1" />
                <span className="text-xs text-green-500">{t("paid")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="due-now" className="bg-white rounded-lg shadow-sm">
          <TabsList className="grid w-full grid-cols-3 p-1">
            <TabsTrigger
              value="due-now"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {t("dueNow")}{" "}
              {dueNowPayments.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
                  {dueNowPayments.length}
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

          <TabsContent value="due-now" className="p-4">
            {dueNowPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p>No payments due now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dueNowPayments.map((payment) => (
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
                <p>No overdue payments</p>
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
                <p>No paid payments</p>
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
