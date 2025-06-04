"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { QRCode } from "@/components/qr-code"
import {
  ArrowRight,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Home,
  FileText,
  Settings,
  Globe,
  LogOut,
  Menu,
  LayoutDashboard,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  recipient: string
  recipientLocation: string
  model: string
  referenceNumber: string
  paymentPurpose: string
  accountNumber: string
  paymentCode: string
}

interface Invoice {
  id: string
  number: string
  date: Date
  dueDate: Date
  clientName: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
}

// Default payment details by type
const defaultPaymentDetails = {
  porez: {
    recipient: "Poreska uprava",
    recipientLocation: "Beograd",
    model: "97",
    referenceNumber: "7100790000005418408",
    paymentPurpose: "Uplata poreza",
    accountNumber: "840-0000711122843-32",
    paymentCode: "189",
    amount: "5000",
  },
  pio: {
    recipient: "Republički fond za penzijsko i invalidsko osiguranje",
    recipientLocation: "",
    model: "97",
    referenceNumber: "12-123456789-02",
    paymentPurpose: "Doprinos za PIO za samostalne delatnosti",
    accountNumber: "840-4848-37",
    paymentCode: "189",
    amount: "6000",
  },
  zdravstveno: {
    recipient: "Republički fond za zdravstveno osiguranje",
    recipientLocation: "",
    model: "97",
    referenceNumber: "13-123456789-03",
    paymentPurpose: "Doprinos za zdravstveno osiguranje",
    accountNumber: "840-4848-37",
    paymentCode: "189",
    amount: "3500",
  },
  nezaposlenost: {
    recipient: "Nacionalna služba za zapošljavanje",
    recipientLocation: "",
    model: "97",
    referenceNumber: "14-123456789-04",
    paymentPurpose: "Doprinos za osiguranje za slučaj nezaposlenosti",
    accountNumber: "840-4848-37",
    paymentCode: "189",
    amount: "1000",
  },
}

export default function AppPreviewPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState("account")
  const [activePaymentType, setActivePaymentType] = useState("porez")
  const [paymentDetails, setPaymentDetails] = useState(defaultPaymentDetails)
  const [formData, setFormData] = useState({
    pib: "123456789",
    taxationType: "pausalno",
    porezAmount: "5000",
    pioAmount: "6000",
    zdravstvenoAmount: "3500",
    nezaposlenostAmount: "1000",
  })

  useEffect(() => {
    // Generate mock payments and invoices for preview
    const mockPayments = generateMockPayments()
    const mockInvoices = generateMockInvoices()
    setPayments(mockPayments)
    setInvoices(mockInvoices)

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
        recipient: defaultPaymentDetails[type].recipient,
        recipientLocation: defaultPaymentDetails[type].recipientLocation,
        model: defaultPaymentDetails[type].model,
        referenceNumber: defaultPaymentDetails[type].referenceNumber,
        paymentPurpose: defaultPaymentDetails[type].paymentPurpose,
        accountNumber: defaultPaymentDetails[type].accountNumber,
        paymentCode: defaultPaymentDetails[type].paymentCode,
      })
    })

    // Add one overdue payment
    mockPayments.push({
      id: `porez-${currentYear}-${currentMonth}-overdue`,
      paymentType: "porez",
      dueDate: new Date(currentYear, currentMonth - 1, 15),
      amount: 5000,
      status: "overdue",
      recipient: defaultPaymentDetails.porez.recipient,
      recipientLocation: defaultPaymentDetails.porez.recipientLocation,
      model: defaultPaymentDetails.porez.model,
      referenceNumber: defaultPaymentDetails.porez.referenceNumber,
      paymentPurpose: defaultPaymentDetails.porez.paymentPurpose,
      accountNumber: defaultPaymentDetails.porez.accountNumber,
      paymentCode: defaultPaymentDetails.porez.paymentCode,
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
          recipient: defaultPaymentDetails[type].recipient,
          recipientLocation: defaultPaymentDetails[type].recipientLocation,
          model: defaultPaymentDetails[type].model,
          referenceNumber: defaultPaymentDetails[type].referenceNumber,
          paymentPurpose: defaultPaymentDetails[type].paymentPurpose,
          accountNumber: defaultPaymentDetails[type].accountNumber,
          paymentCode: defaultPaymentDetails[type].paymentCode,
        })
      })
    }

    return mockPayments
  }

  // Generate mock invoices for preview
  const generateMockInvoices = (): Invoice[] => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const mockInvoices: Invoice[] = []

    // Add some invoices with different statuses
    mockInvoices.push({
      id: "inv-1",
      number: "2023-001",
      date: new Date(currentYear, currentMonth - 2, 5),
      dueDate: new Date(currentYear, currentMonth - 2, 19),
      clientName: "Tehnološki Park d.o.o.",
      amount: 35000,
      status: "paid",
    })

    mockInvoices.push({
      id: "inv-2",
      number: "2023-002",
      date: new Date(currentYear, currentMonth - 1, 12),
      dueDate: new Date(currentYear, currentMonth - 1, 26),
      clientName: "Inovacioni Centar a.d.",
      amount: 42500,
      status: "paid",
    })

    mockInvoices.push({
      id: "inv-3",
      number: "2023-003",
      date: new Date(currentYear, currentMonth, 3),
      dueDate: new Date(currentYear, currentMonth, 17),
      clientName: "Digital Solutions d.o.o.",
      amount: 28750,
      status: "sent",
    })

    mockInvoices.push({
      id: "inv-4",
      number: "2023-004",
      date: new Date(currentYear, currentMonth, 8),
      dueDate: new Date(currentYear, currentMonth, 22),
      clientName: "Web Studio d.o.o.",
      amount: 15000,
      status: "draft",
    })

    mockInvoices.push({
      id: "inv-5",
      number: "2023-005",
      date: new Date(currentYear, currentMonth - 3, 20),
      dueDate: new Date(currentYear, currentMonth - 3, 4),
      clientName: "Marketing Pro d.o.o.",
      amount: 22000,
      status: "overdue",
    })

    return mockInvoices
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

  const getInvoiceStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "draft":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Nacrt</span>
      case "sent":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Poslato</span>
      case "paid":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Plaćeno</span>
      case "overdue":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Zakašnjenje</span>
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

  // Calculate invoice totals
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const totalPaidInvoices = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const totalOutstanding = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowQRModal(true)
  }

  const handleCloseQRModal = () => {
    setShowQRModal(false)
    setSelectedPayment(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, taxationType: value }))
  }

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentDetails((prev) => ({
      ...prev,
      [activePaymentType]: {
        ...prev[activePaymentType as keyof typeof prev],
        [name]: value,
      },
    }))
  }

  const handlePaymentTypeChange = (value: string) => {
    setActivePaymentType(value)
  }

  const handlePaymentCodeChange = (value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [activePaymentType]: {
        ...prev[activePaymentType as keyof typeof prev],
        paymentCode: value,
      },
    }))
  }

  const handleModelChange = (value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [activePaymentType]: {
        ...prev[activePaymentType as keyof typeof prev],
        model: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert("Settings saved successfully!")
    }, 1000)
  }

  const handlePaymentDetailsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert("Payment details saved successfully!")
    }, 1000)
  }

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => (
    <Button
      variant={activeTab === href ? "default" : "ghost"}
      className={`w-full justify-start ${activeTab === href ? "bg-primary text-white" : ""}`}
      onClick={() => setActiveTab(href)}
    >
      <Icon className="h-5 w-5 mr-2" />
      <span>{label}</span>
    </Button>
  )

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dobrodošli nazad!</h1>
        <p className="text-muted-foreground">Evo pregleda vaših poreskih obaveza</p>
      </div>

      <Alert className="bg-blue-50 border-blue-100 text-blue-800">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle>Pregled aplikacije</AlertTitle>
        <AlertDescription className="mt-2">
          Ovo je pregled aplikacije bez potrebe za prijavom. Ovde možete videti kako izgleda aplikacija kada je korisnik
          prijavljen.
        </AlertDescription>
      </Alert>

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
                <div key={payment.id} className="payment-card bg-white border rounded-lg p-4">
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
                    <Button variant="ghost" size="sm" className="ml-2" onClick={() => handlePaymentClick(payment)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
                <div key={payment.id} className="payment-card overdue bg-white border rounded-lg p-4 border-red-200">
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
                    <Button variant="ghost" size="sm" className="ml-2" onClick={() => handlePaymentClick(payment)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
                          <div key={payment.id} className="payment-card paid bg-white border rounded-lg p-4">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2"
                                onClick={() => handlePaymentClick(payment)}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
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

      {/* QR Code Modal */}
      {showQRModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">IPS QR Kod za plaćanje</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseQRModal}>
                ✕
              </Button>
            </div>
            <div className="text-center mb-4">
              <div className="font-medium">{getPaymentTypeName(selectedPayment.paymentType)}</div>
              <div className="text-2xl font-bold mt-1">{selectedPayment.amount.toLocaleString()} RSD</div>
              <div className="text-sm text-muted-foreground mt-1">
                Rok plaćanja: {format(selectedPayment.dueDate, "dd.MM.yyyy")}
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <QRCode
                value={`https://nbs.rs/QRcode/PR|${selectedPayment.recipient}|${selectedPayment.amount}|RSD|${
                  selectedPayment.paymentPurpose
                }|${selectedPayment.model}|${selectedPayment.referenceNumber}|${format(
                  selectedPayment.dueDate,
                  "dd.MM.yyyy",
                )}`}
                size={200}
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primalac:</span>
                <span className="font-medium">{selectedPayment.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Račun primaoca:</span>
                <span className="font-medium">{selectedPayment.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">{selectedPayment.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Poziv na broj:</span>
                <span className="font-medium">{selectedPayment.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Šifra plaćanja:</span>
                <span className="font-medium">{selectedPayment.paymentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Svrha plaćanja:</span>
                <span className="font-medium">{selectedPayment.paymentPurpose}</span>
              </div>
            </div>
            <div className="mt-6">
              <Button className="w-full" onClick={handleCloseQRModal}>
                Zatvori
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInvoices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fakture</h1>
          <p className="text-muted-foreground">Upravljajte vašim fakturama</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => router.push("/preview/invoice")}>
          <FileText className="h-4 w-4 mr-2" />
          Nova faktura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ukupno fakturisano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoiced.toLocaleString()} RSD</div>
            <p className="text-xs text-muted-foreground mt-1">{invoices.length} faktura</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plaćeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPaidInvoices.toLocaleString()} RSD</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((invoice) => invoice.status === "paid").length} faktura
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Neplaćeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalOutstanding.toLocaleString()} RSD</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "overdue").length} faktura
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Sve fakture</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Broj fakture
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klijent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rok plaćanja
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Iznos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{invoice.number}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{invoice.clientName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{format(invoice.date, "dd.MM.yyyy")}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{format(invoice.dueDate, "dd.MM.yyyy")}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    {invoice.amount.toLocaleString()} RSD
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{getInvoiceStatusBadge(invoice.status)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/preview/invoice")}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Podešavanja</h1>

      <Tabs defaultValue={settingsTab} className="bg-white rounded-lg shadow-sm" onValueChange={setSettingsTab}>
        <TabsList className="grid w-full grid-cols-3 p-1">
          <TabsTrigger
            value="account"
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Podešavanja
          </TabsTrigger>
          <TabsTrigger
            value="payment-details"
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Detalji plaćanja
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Globe className="h-4 w-4 mr-2" />
            Jezik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pib">PIB</Label>
                <Input
                  id="pib"
                  name="pib"
                  value={formData.pib}
                  onChange={handleChange}
                  required
                  className="h-11"
                  placeholder="123456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Tip oporezivanja</Label>
                <RadioGroup defaultValue={formData.taxationType} onValueChange={handleRadioChange} className="mt-2">
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-md border">
                    <RadioGroupItem value="pausalno" id="settings-pausalno" />
                    <Label htmlFor="settings-pausalno" className="flex-1 cursor-pointer">
                      Paušalno
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-md border mt-2">
                    <RadioGroupItem value="samooporezivanje" id="settings-samooporezivanje" />
                    <Label htmlFor="settings-samooporezivanje" className="flex-1 cursor-pointer">
                      Samooporezivanje
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="porezAmount">Porez (iznos)</Label>
                <Input
                  id="porezAmount"
                  name="porezAmount"
                  type="number"
                  value={formData.porezAmount}
                  onChange={handleChange}
                  required
                  className="h-11"
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pioAmount">PIO (iznos)</Label>
                <Input
                  id="pioAmount"
                  name="pioAmount"
                  type="number"
                  value={formData.pioAmount}
                  onChange={handleChange}
                  required
                  className="h-11"
                  placeholder="6000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zdravstvenoAmount">Zdravstveno (iznos)</Label>
                <Input
                  id="zdravstvenoAmount"
                  name="zdravstvenoAmount"
                  type="number"
                  value={formData.zdravstvenoAmount}
                  onChange={handleChange}
                  required
                  className="h-11"
                  placeholder="3500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nezaposlenostAmount">Nezaposlenost (iznos)</Label>
                <Input
                  id="nezaposlenostAmount"
                  name="nezaposlenostAmount"
                  type="number"
                  value={formData.nezaposlenostAmount}
                  onChange={handleChange}
                  required
                  className="h-11"
                  placeholder="1000"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? "..." : "Sačuvaj"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="payment-details" className="p-4">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">O IPS QR kodu</h3>
                <p className="text-sm text-blue-700 mt-1">
                  IPS (Instant Payments Serbia) QR kod omogućava brzo i jednostavno plaćanje skeniranjem koda putem
                  mobilne aplikacije vaše banke. Popunite detalje plaćanja ispod za svaki tip obaveze kako biste
                  generisali ispravne QR kodove za plaćanje.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-4">
                <div className="font-medium mb-2">Tip plaćanja</div>
                <div className="space-y-2">
                  <Button
                    variant={activePaymentType === "porez" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handlePaymentTypeChange("porez")}
                  >
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <CreditCard className="h-3 w-3 text-blue-600" />
                    </div>
                    Porez
                  </Button>
                  <Button
                    variant={activePaymentType === "pio" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handlePaymentTypeChange("pio")}
                  >
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <CreditCard className="h-3 w-3 text-purple-600" />
                    </div>
                    PIO
                  </Button>
                  <Button
                    variant={activePaymentType === "zdravstveno" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handlePaymentTypeChange("zdravstveno")}
                  >
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                      <CreditCard className="h-3 w-3 text-green-600" />
                    </div>
                    Zdravstveno
                  </Button>
                  <Button
                    variant={activePaymentType === "nezaposlenost" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handlePaymentTypeChange("nezaposlenost")}
                  >
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                      <CreditCard className="h-3 w-3 text-orange-600" />
                    </div>
                    Nezaposlenost
                  </Button>
                </div>
              </div>

              <div className="md:col-span-3">
                <form onSubmit={handlePaymentDetailsSubmit}>
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle>
                        {activePaymentType === "porez" && "Porez"}
                        {activePaymentType === "pio" && "PIO"}
                        {activePaymentType === "zdravstveno" && "Zdravstveno"}
                        {activePaymentType === "nezaposlenost" && "Nezaposlenost"}
                      </CardTitle>
                      <CardDescription>Unesite detalje plaćanja za generisanje IPS QR koda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="recipient">Naziv primaoca</Label>
                          <Input
                            id="recipient"
                            name="recipient"
                            value={paymentDetails[activePaymentType as keyof typeof paymentDetails]?.recipient || ""}
                            onChange={handlePaymentDetailsChange}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recipientLocation">Mesto primaoca</Label>
                          <Input
                            id="recipientLocation"
                            name="recipientLocation"
                            value={
                              paymentDetails[activePaymentType as keyof typeof paymentDetails]?.recipientLocation || ""
                            }
                            onChange={handlePaymentDetailsChange}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Račun primaoca</Label>
                          <Input
                            id="accountNumber"
                            name="accountNumber"
                            value={
                              paymentDetails[activePaymentType as keyof typeof paymentDetails]?.accountNumber || ""
                            }
                            onChange={handlePaymentDetailsChange}
                            required
                            className="h-11"
                            placeholder="840-0000000000000-00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Iznos (RSD)</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            value={paymentDetails[activePaymentType as keyof typeof paymentDetails]?.amount || ""}
                            onChange={handlePaymentDetailsChange}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Model</Label>
                          <Select
                            value={paymentDetails[activePaymentType as keyof typeof paymentDetails]?.model || "97"}
                            onValueChange={handleModelChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Izaberite model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="97">97</SelectItem>
                              <SelectItem value="11">11</SelectItem>
                              <SelectItem value="00">00</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="referenceNumber">Poziv na broj (odobrenje)</Label>
                          <Input
                            id="referenceNumber"
                            name="referenceNumber"
                            value={
                              paymentDetails[activePaymentType as keyof typeof paymentDetails]?.referenceNumber || ""
                            }
                            onChange={handlePaymentDetailsChange}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentCode">Šifra plaćanja</Label>
                          <Select
                            value={
                              paymentDetails[activePaymentType as keyof typeof paymentDetails]?.paymentCode || "189"
                            }
                            onValueChange={handlePaymentCodeChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Izaberite šifru plaćanja" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="189">189 - Plaćanje gotovinom</SelectItem>
                              <SelectItem value="289">289 - Bezgotovinsko plaćanje</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="paymentPurpose">Svrha plaćanja</Label>
                          <Input
                            id="paymentPurpose"
                            name="paymentPurpose"
                            value={
                              paymentDetails[activePaymentType as keyof typeof paymentDetails]?.paymentPurpose || ""
                            }
                            onChange={handlePaymentDetailsChange}
                            required
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-6">
                    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                      {isLoading ? "..." : "Sačuvaj"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Jezik</Label>
              <Select defaultValue="sr">
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Izaberite jezik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sr">Srpski</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="font-bold text-xl text-primary">PID27 - Preview</div>
                  </div>
                  <nav className="flex flex-col gap-2 p-4 flex-1">
                    <NavLink href="dashboard" icon={LayoutDashboard} label="Kontrolna tabla" />
                    <NavLink href="invoices" icon={FileText} label="Fakture" />
                    <NavLink href="settings" icon={Settings} label="Podešavanja" />
                  </nav>
                  <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/")}>
                      <LogOut className="h-5 w-5 mr-2" />
                      <span>Nazad na početnu</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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

      <div className="flex flex-1">
        <aside className="hidden md:block w-64 border-r bg-white">
          <nav className="flex flex-col gap-2 p-4 sticky top-16">
            <NavLink href="dashboard" icon={LayoutDashboard} label="Kontrolna tabla" />
            <NavLink href="invoices" icon={FileText} label="Fakture" />
            <NavLink href="settings" icon={Settings} label="Podešavanja" />
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "invoices" && renderInvoices()}
          {activeTab === "settings" && renderSettings()}
        </main>
      </div>
    </div>
  )
}
