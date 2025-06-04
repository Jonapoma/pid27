"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import {
  ArrowRight,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Mock data types
type PaymentType = "porez" | "pio" | "zdravstveno" | "nezaposlenost"
type PaymentStatus = "pending" | "paid" | "overdue"

interface Payment {
  id: string
  paymentType: PaymentType
  dueDate: Date
  amount: number
  status: PaymentStatus
  paidAt?: Date
}

export default function DashboardPreviewPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Generate mock payments for preview
    const mockPayments = generateMockPayments()
    setPayments(mockPayments)

    // Initialize expanded months
    const currentDate = new Date()
    const currentMonthKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`
    setExpandedMonths({ [currentMonthKey]: true })
  }, [])

  // Generate mock payments for preview
  const generateMockPayments = (): Payment[] => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const mockPayments: Payment[] = []

    // Add pending payments for current month
    const paymentTypes: PaymentType[] = ["porez", "pio", "zdravstveno", "nezaposlenost"]
    const amounts = { porez: 5000, pio: 6000, zdravstveno: 3500, nezaposlenost: 1000 }

    paymentTypes.forEach((type) => {
      mockPayments.push({
        id: `${type}-${currentYear}-${currentMonth + 1}-current`,
        paymentType: type,
        dueDate: new Date(currentYear, currentMonth, 15),
        amount: amounts[type],
        status: "pending",
      })
    })

    // Add one overdue payment
    mockPayments.push({
      id: `porez-${currentYear}-${currentMonth}-overdue`,
      paymentType: "porez",
      dueDate: new Date(currentYear, currentMonth - 1, 15),
      amount: 5000,
      status: "overdue",
    })

    // Add paid payments for previous months
    for (let i = 1; i <= 3; i++) {
      const month = currentMonth - i
      const year = month < 0 ? currentYear - 1 : currentYear
      const adjustedMonth = month < 0 ? month + 12 : month

      paymentTypes.forEach((type) => {
        mockPayments.push({
          id: `${type}-${year}-${adjustedMonth + 1}-paid`,
          paymentType: type,
          dueDate: new Date(year, adjustedMonth, 15),
          amount: amounts[type],
          status: "paid",
          paidAt: new Date(year, adjustedMonth, 20),
        })
      })
    }

    return mockPayments
  }

  // Filter payments by status
  const dueNowPayments = payments.filter((payment) => payment.status === "pending")
  const overduePayments = payments.filter((payment) => payment.status === "overdue")
  const paidPayments = payments.filter((payment) => payment.status === "paid")

  // Group paid payments by month
  const paidPaymentsByMonth = paidPayments.reduce<Record<string, Payment[]>>((acc, payment) => {
    if (payment.paidAt) {
      const month = payment.paidAt.getMonth()
      const year = payment.paidAt.getFullYear()
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
        return <span className="status-badge status-pending">Na čekanju</span>
      case "paid":
        return <span className="status-badge status-paid">Plaćeno</span>
      case "overdue":
        return <span className="status-badge status-overdue">Zakašnjenje</span>
    }
  }

  const getPaymentTypeName = (type: PaymentType) => {
    switch (type) {
      case "porez":
        return "Porez"
      case "pio":
        return "PIO"
      case "zdravstveno":
        return "Zdravstveno"
      case "nezaposlenost":
        return "Nezaposlenost"
      default:
        return type
    }
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="font-bold text-xl text-primary">PID27 - Preview</div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Nazad na početnu
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Dobrodošli nazad!</h1>
            <p className="text-muted-foreground">Evo pregleda vaših poreskih obaveza</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Za plaćanje ovog meseca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDueNow.toLocaleString()} RSD</div>
                <p className="text-xs text-muted-foreground mt-1">{dueNowPayments.length} na čekanju</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Zakasnela plaćanja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString()} RSD</div>
                <p className="text-xs text-muted-foreground mt-1">{overduePayments.length} zakašnjenje</p>
                <div className="mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 inline-block mr-1" />
                  <span className="text-xs text-red-500">Zakašnjenje</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Plaćeno ove godine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPaid.toLocaleString()} RSD</div>
                <p className="text-xs text-muted-foreground mt-1">{paidPayments.length} plaćeno</p>
                <div className="mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 inline-block mr-1" />
                  <span className="text-xs text-green-500">Plaćeno</span>
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
                Za plaćanje{" "}
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
                Zakašnjenje{" "}
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
                Plaćeno
              </TabsTrigger>
            </TabsList>

            <TabsContent value="due-now" className="p-4">
              {dueNowPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p>Nema plaćanja na čekanju</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dueNowPayments.map((payment) => (
                    <div key={payment.id} className="payment-card bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPaymentIcon(payment.paymentType)}
                          <div>
                            <div className="font-medium">{getPaymentTypeName(payment.paymentType)}</div>
                            <div className="text-sm text-muted-foreground">{format(payment.dueDate, "dd.MM.yyyy")}</div>
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
                  <p>Nema zakasnelih plaćanja</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overduePayments.map((payment) => (
                    <div key={payment.id} className="payment-card overdue bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPaymentIcon(payment.paymentType)}
                          <div>
                            <div className="font-medium">{getPaymentTypeName(payment.paymentType)}</div>
                            <div className="text-sm text-muted-foreground">{format(payment.dueDate, "dd.MM.yyyy")}</div>
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
                  <p>Nema plaćenih plaćanja</p>
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
                            {paidPaymentsByMonth[monthKey].length} plaćeno
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
                              if (a.paidAt && b.paidAt) {
                                return b.paidAt.getTime() - a.paidAt.getTime()
                              }
                              return 0
                            })
                            .map((payment) => (
                              <div key={payment.id} className="payment-card paid bg-white">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getPaymentIcon(payment.paymentType)}
                                    <div>
                                      <div className="font-medium">{getPaymentTypeName(payment.paymentType)}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {payment.paidAt && `Plaćeno: ${format(payment.paidAt, "dd.MM.yyyy")}`}
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
      </main>
    </div>
  )
}
