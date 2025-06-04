"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useTranslation } from "@/components/language-provider"
import { format, isBefore } from "date-fns"
import { CalendarIcon, ArrowLeft, CreditCard, CheckCircle2, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { QRCode } from "@/components/qr-code"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase"

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
  recipientLocation?: string
  model: string
  referenceNumber: string
  paymentPurpose: string
  accountNumber: string
  paymentCode?: string
}

// Default payment details by type
const paymentDefaults: Record<
  PaymentType,
  {
    recipient: string
    recipientLocation?: string
    model: string
    referenceNumber: string
    paymentPurpose: string
    accountNumber: string
    paymentCode?: string
  }
> = {
  porez: {
    recipient: "Poreska uprava",
    recipientLocation: "Beograd",
    model: "97",
    referenceNumber: "7100790000005418408",
    paymentPurpose: "Uplata poreza",
    accountNumber: "840-0000711122843-32",
    paymentCode: "189",
  },
  pio: {
    recipient: "Republički fond za penzijsko i invalidsko osiguranje",
    model: "97",
    referenceNumber: "12-123456789-02",
    paymentPurpose: "Doprinos za PIO za samostalne delatnosti",
    accountNumber: "840-4848-37",
    paymentCode: "189",
  },
  zdravstveno: {
    recipient: "Republički fond za zdravstveno osiguranje",
    model: "97",
    referenceNumber: "13-123456789-03",
    paymentPurpose: "Doprinos za zdravstveno osiguranje",
    accountNumber: "840-4848-37",
    paymentCode: "189",
  },
  nezaposlenost: {
    recipient: "Nacionalna služba za zapošljavanje",
    model: "97",
    referenceNumber: "14-123456789-04",
    paymentPurpose: "Doprinos za osiguranje za slučaj nezaposlenosti",
    accountNumber: "840-4848-37",
    paymentCode: "189",
  },
}

// Function to format account number according to NBS requirements
function formatAccountNumber(accountNumber: string): string {
  // Remove all dashes and spaces
  const cleanAccount = accountNumber.replace(/[-\s]/g, "")

  // If the account number is already 18 digits, return it
  if (cleanAccount.length === 18) {
    return cleanAccount
  }

  // Extract the bank code (first 3 digits)
  const bankCode = cleanAccount.substring(0, 3)

  // Extract the rest of the account number
  const accountPart = cleanAccount.substring(3)

  // Pad with zeros to make it exactly 18 digits
  return bankCode + accountPart.padStart(15, "0")
}

// Function to format amount according to NBS requirements
function formatAmount(amount: number): string {
  // Format with comma as decimal separator and no spaces
  // Format should be exactly like "RSD3596,13" (no space between currency and amount)
  return `RSD${amount.toFixed(2).replace(".", ",")}`
}

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const { t, language } = useTranslation()
  const router = useRouter()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [qrData, setQrData] = useState("")
  const [qrError, setQrError] = useState(false)
  const [hasPaymentDetails, setHasPaymentDetails] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPaymentData() {
      try {
        setIsLoading(true)
        setIsNotFound(false)

        // Ensure we have a valid user
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!userData?.user?.id) {
          throw new Error("User not authenticated")
        }

        const userId = userData.user.id

        // Fetch the payment from Supabase
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", userId)
          .single()

        if (paymentError) {
          console.error("Payment fetch error:", paymentError)
          if (paymentError.code === "PGRST116") {
            // Record not found
            setIsNotFound(true)
            return
          }
          throw paymentError
        }

        if (!paymentData) {
          setIsNotFound(true)
          return
        }

        // Fetch payment details from Supabase
        const { data: paymentDetailsData, error: paymentDetailsError } = await supabase
          .from("payment_details")
          .select("*")
          .eq("payment_type", paymentData.payment_type)
          .eq("user_id", userId)

        if (paymentDetailsError) {
          console.error("Payment details fetch error:", paymentDetailsError)
          throw paymentDetailsError
        }

        // Check if we have payment details
        setHasPaymentDetails(paymentDetailsData && paymentDetailsData.length > 0)

        // Convert the Supabase data to our Payment interface
        const paymentType = paymentData.payment_type as PaymentType

        // Find the matching payment details for this payment type
        const paymentTypeDetails = paymentDetailsData?.find((detail) => detail.payment_type === paymentType)

        // If no payment details found, use defaults
        const detailsToUse = paymentTypeDetails || paymentDefaults[paymentType]

        // Check if the payment is overdue
        const today = new Date()
        let status = paymentData.status as PaymentStatus

        if (status === "pending" && isBefore(new Date(paymentData.due_date), today)) {
          status = "overdue"

          // Update the payment status in Supabase
          const { error: updateError } = await supabase
            .from("payments")
            .update({ status: "overdue" })
            .eq("id", params.id)

          if (updateError) {
            console.error("Error updating payment status:", updateError)
          }
        }

        // Create the payment object from Supabase data
        const completePayment: Payment = {
          id: paymentData.id,
          paymentType: paymentType,
          dueDate: new Date(paymentData.due_date),
          amount: paymentData.amount,
          status: status,
          paidAt: paymentData.paid_at ? new Date(paymentData.paid_at) : undefined,
          recipient: detailsToUse.recipient,
          recipientLocation: detailsToUse.recipientLocation,
          model: detailsToUse.model,
          referenceNumber: detailsToUse.referenceNumber,
          paymentPurpose: detailsToUse.paymentPurpose,
          accountNumber: detailsToUse.accountNumber,
          paymentCode: detailsToUse.paymentCode,
        }

        setPayment(completePayment)
        generateQRData(completePayment)
      } catch (error: any) {
        console.error("Error fetching payment data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load payment details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentData()
  }, [params.id, supabase, language])

  const generateQRData = (payment: Payment) => {
    try {
      if (!payment) {
        throw new Error("Payment data is missing")
      }

      // Format account number - must be exactly 18 digits without dashes
      const formattedAccount = formatAccountNumber(payment.accountNumber || "")

      // Format amount with comma as decimal separator and no spaces
      const formattedAmount = formatAmount(payment.amount)

      // Prepare recipient with location (max 70 characters, max 3 lines)
      const recipient = payment.recipient || ""
      const recipientLocation = payment.recipientLocation || ""
      const fullRecipient = recipientLocation ? `${recipient}\r\n${recipientLocation}` : recipient

      // Prepare payment purpose (max 35 characters, single line)
      const purpose = payment.paymentPurpose || ""
      const truncatedPurpose = purpose.substring(0, 35)

      // Prepare model and reference number
      const model = payment.model || "97"
      // For model 97, reference number must not contain dashes
      const cleanReference = payment.referenceNumber.replace(/[-\s]/g, "")

      // Payment code (SF) - mandatory
      const paymentCode = payment.paymentCode || "189"

      // Build the QR code string exactly as shown in the NBS example
      // K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD\r\nBALKANSKA 13|I:RSD3596,13|SF:189|S:UPLATA PO RAČUNU ZA EL. ENERGIJU|RO:97163220000111111111000

      // Start with the mandatory fields in the exact order specified by NBS
      let qrString = `K:PR|V:01|C:1|R:${formattedAccount}|N:${fullRecipient}|I:${formattedAmount}|SF:${paymentCode}`

      // Add purpose if available (S) - this is optional
      if (truncatedPurpose) {
        qrString += `|S:${truncatedPurpose}`
      }

      // Add reference number (RO) - this is optional but important
      // For model 97, the format is "97" followed by the reference number without dashes
      // For other models, the format is "00" followed by the reference number
      if (model === "97") {
        qrString += `|RO:97${cleanReference}`
      } else {
        qrString += `|RO:00${cleanReference}`
      }

      console.log("Generated QR data:", qrString)
      setQrData(qrString)
      setQrError(false)
    } catch (error) {
      console.error("Error generating QR data:", error)
      setQrError(true)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!date || !payment) return

    setIsLoading(true)

    try {
      // Update the payment in Supabase
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: date.toISOString(),
        })
        .eq("id", payment.id)

      if (error) {
        throw error
      }

      // Update the current payment state
      setPayment({
        ...payment,
        status: "paid",
        paidAt: date,
      })

      // Show success toast
      toast({
        title: "Payment marked as paid",
        description: "The payment has been successfully marked as paid.",
      })

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error updating payment:", error)
      toast({
        title: "Error",
        description: "There was an error updating the payment status.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>{language === "en" ? "Loading payment details..." : "Učitavanje detalja plaćanja..."}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (isNotFound) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Payment not found" : "Plaćanje nije pronađeno"}
            </h2>
            <p className="text-muted-foreground">
              {language === "en"
                ? "The requested payment does not exist or is unavailable"
                : "Traženo plaćanje ne postoji ili je nedostupno"}
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard")}>
            {language === "en" ? "Return to dashboard" : "Povratak na kontrolnu tablu"}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Loading Error" : "Greška pri učitavanju"}
            </h2>
            <p className="text-muted-foreground">
              {language === "en"
                ? "There was an error loading payment details"
                : "Došlo je do greške pri učitavanju detalja plaćanja"}
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard")}>
            {language === "en" ? "Return to dashboard" : "Povratak na kontrolnu tablu"}
          </Button>
        </div>
      </DashboardLayout>
    )
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
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        )
      case "pio":
        return (
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-purple-600" />
          </div>
        )
      case "zdravstveno":
        return (
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
        )
      case "nezaposlenost":
        return (
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-orange-600" />
          </div>
        )
    }
  }

  // Format amount for display in European format
  const formatAmountEuropean = (amount: number): string => {
    return amount.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t("paymentDetails")}</h1>
        </div>

        {!hasPaymentDetails && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <Info className="h-5 w-5 text-amber-600" />
            <AlertTitle>Podešavanje IPS QR kodova</AlertTitle>
            <AlertDescription className="mt-2">
              Da biste generisali ispravan IPS QR kod za plaćanje, potrebno je da podesite detalje plaćanja.
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

        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {getPaymentIcon(payment.paymentType)}
                <div>
                  <CardTitle className="text-xl">{getPaymentTypeName(payment.paymentType)}</CardTitle>
                  <CardDescription>
                    {t("dueDate")}: {format(payment.dueDate, "dd.MM.yyyy")}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(payment.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-primary/5 rounded-lg">
              <div className="text-lg font-medium">{t("amount")}</div>
              <div className="text-3xl font-bold">{formatAmountEuropean(payment.amount)} RSD</div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">{t("paymentInstructions")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Naziv primaoca</div>
                  <div className="font-medium mt-1">{payment.recipient}</div>
                </div>
                {payment.recipientLocation && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Mesto primaoca</div>
                    <div className="font-medium mt-1">{payment.recipientLocation}</div>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Račun primaoca</div>
                  <div className="font-medium mt-1">{payment.accountNumber}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Model</div>
                  <div className="font-medium mt-1">{payment.model}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Poziv na broj (odobrenje)</div>
                  <div className="font-medium mt-1">{payment.referenceNumber}</div>
                </div>
                {payment.paymentCode && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Šifra plaćanja</div>
                    <div className="font-medium mt-1">{payment.paymentCode}</div>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <div className="text-sm text-muted-foreground">Svrha plaćanja</div>
                  <div className="font-medium mt-1">{payment.paymentPurpose}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-white">
              <div className="text-center mb-4 font-medium">{t("scanQR")}</div>
              {qrError ? (
                <div
                  className="flex items-center justify-center bg-gray-100 rounded-lg"
                  style={{ width: 200, height: 200 }}
                >
                  <div className="text-4xl text-gray-400">QR</div>
                </div>
              ) : (
                <QRCode data={qrData} size={200} className="rounded-lg" />
              )}
              <div className="mt-4 text-xs text-muted-foreground">NBS IPS QR</div>
            </div>
          </CardContent>
          <CardFooter>
            {payment.status !== "paid" ? (
              <div className="w-full space-y-4">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-11">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd.MM.yyyy") : t("paidDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  className="w-full h-11 text-base bg-primary hover:bg-primary/90"
                  onClick={handleMarkAsPaid}
                  disabled={!date || isLoading}
                >
                  {isLoading ? "..." : t("markAsPaid")}
                </Button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 text-green-600 font-medium p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {t("paid")} {payment.paidAt && `(${format(payment.paidAt, "dd.MM.yyyy")})`}
                </span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
