"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useTranslation } from "@/components/language-provider"
import { toast } from "@/hooks/use-toast"
import { FileText, Globe, CreditCard, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    pib: "",
    taxationType: "pausalno",
    porezAmount: "",
    porezAmount: "",
    pioAmount: "",
    zdravstvenoAmount: "",
    nezaposlenostAmount: "",
    yearlyRevenueLimit: "6000000", // Default to 6 million
  })
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({
    porez: {
      recipient: "",
      recipientLocation: "",
      model: "",
      referenceNumber: "",
      paymentPurpose: "",
      accountNumber: "",
      paymentCode: "",
      amount: "",
    },
    pio: {
      recipient: "",
      recipientLocation: "",
      model: "",
      referenceNumber: "",
      paymentPurpose: "",
      accountNumber: "",
      paymentCode: "",
      amount: "",
    },
    zdravstveno: {
      recipient: "",
      recipientLocation: "",
      model: "",
      referenceNumber: "",
      paymentPurpose: "",
      accountNumber: "",
      paymentCode: "",
      amount: "",
    },
    nezaposlenost: {
      recipient: "",
      recipientLocation: "",
      model: "",
      referenceNumber: "",
      paymentPurpose: "",
      accountNumber: "",
      paymentCode: "",
      amount: "",
    },
  })
  const [activePaymentType, setActivePaymentType] = useState("porez")
  const supabase = createClient()

  console.log(
    "[Settings] Initial render - authLoading:",
    authLoading,
    "user:",
    user?.id ? `exists (${user.id})` : "null",
  )

  useEffect(() => {
    console.log(
      "[Settings] useEffect triggered - authLoading:",
      authLoading,
      "user:",
      user?.id ? `exists (${user.id})` : "null",
    )

    // Only load settings when auth is complete and we have a user
    if (authLoading) {
      console.log("[Settings] Auth still loading, skipping fetchData")
      return
    }

    async function loadSettings() {
      console.log("[Settings] loadSettings() called")

      // Create a timeout to detect stalled queries
      const timeoutId = setTimeout(() => {
        console.error("[Settings] TIMEOUT: Supabase queries took too long (>10s)")
        setIsInitialLoading(false)
        setLoadError("Request timeout - Database queries are taking too long")
      }, 10000)

      try {
        setIsInitialLoading(true)
        setLoadError(null)

        if (!user || !user.id) {
          console.log("[Settings] No user found, aborting data fetch")
          setIsInitialLoading(false)
          setLoadError("User not authenticated")
          clearTimeout(timeoutId)
          return
        }

        console.log("[Settings] Fetching profile data for user:", user.id)
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        console.log("[Settings] Profile data result:", profileData ? "received" : "null", "error:", profileError)

        // Handle case where profile doesn't exist yet
        if (profileError && profileError.code !== "PGRST116") {
          console.error("[Settings] Profile fetch error:", profileError)
          throw profileError
        }

        console.log("[Settings] Fetching payment details data for user:", user.id)
        // Fetch payment details
        const { data: paymentDetailsData, error: paymentDetailsError } = await supabase
          .from("payment_details")
          .select("*")
          .eq("user_id", user.id)

        console.log(
          "[Settings] Payment details result:",
          paymentDetailsData ? `${paymentDetailsData.length} items` : "null",
          "error:",
          paymentDetailsError,
        )

        if (paymentDetailsError) {
          console.error("[Settings] Payment details fetch error:", paymentDetailsError)
          throw paymentDetailsError
        }

        // Update form data with profile data if available
        if (profileData) {
          console.log("[Settings] Updating form data with profile data")
          setFormData({
            pib: profileData.pib || "",
            taxationType: profileData.taxation_type || "pausalno",
            porezAmount: profileData.porez_amount?.toString() || "",
            pioAmount: profileData.pio_amount?.toString() || "",
            zdravstvenoAmount: profileData.zdravstveno_amount?.toString() || "",
            nezaposlenostAmount: profileData.nezaposlenost_amount?.toString() || "",
            yearlyRevenueLimit: profileData.yearly_revenue_limit?.toString() || "6000000",
          })
        }

        // Initialize empty payment details structure
        const updatedPaymentDetails = {
          porez: {
            recipient: "",
            recipientLocation: "",
            model: "",
            referenceNumber: "",
            paymentPurpose: "",
            accountNumber: "",
            paymentCode: "",
            amount: "",
          },
          pio: {
            recipient: "",
            recipientLocation: "",
            model: "",
            referenceNumber: "",
            paymentPurpose: "",
            accountNumber: "",
            paymentCode: "",
            amount: "",
          },
          zdravstveno: {
            recipient: "",
            recipientLocation: "",
            model: "",
            referenceNumber: "",
            paymentPurpose: "",
            accountNumber: "",
            paymentCode: "",
            amount: "",
          },
          nezaposlenost: {
            recipient: "",
            recipientLocation: "",
            model: "",
            referenceNumber: "",
            paymentPurpose: "",
            accountNumber: "",
            paymentCode: "",
            amount: "",
          },
        }

        // Update payment details with data from Supabase
        if (paymentDetailsData && paymentDetailsData.length > 0) {
          console.log("[Settings] Updating payment details with database data")
          paymentDetailsData.forEach((detail) => {
            const paymentType = detail.payment_type
            if (paymentType && paymentType in updatedPaymentDetails) {
              updatedPaymentDetails[paymentType] = {
                recipient: detail.recipient || "",
                recipientLocation: detail.recipient_location || "",
                model: detail.model || "",
                referenceNumber: detail.reference_number || "",
                paymentPurpose: detail.payment_purpose || "",
                accountNumber: detail.account_number || "",
                paymentCode: detail.payment_code || "",
                amount: detail.amount?.toString() || "",
              }
            }
          })
        }

        setPaymentDetails(updatedPaymentDetails)
        console.log("[Settings] Data fetch complete, setting loading to false")
      } catch (error: any) {
        console.error("[Settings] Error loading settings:", error)
        setLoadError(error.message || "Failed to load settings")
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        clearTimeout(timeoutId)
        console.log("[Settings] Finally block, setting isInitialLoading to false")
        setIsInitialLoading(false)
      }
    }

    loadSettings()

    console.log("[Settings] useEffect completed setup")
  }, [supabase, user, authLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, taxationType: value }))
  }

  const handleYearlyRevenueLimitChange = (value: string) => {
    setFormData((prev) => ({ ...prev, yearlyRevenueLimit: value }))
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    toast({
      title: "Language updated",
      description: "Your language preference has been saved.",
    })
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

    // Validate form data
    if (
      !formData.pib ||
      !formData.porezAmount ||
      !formData.pioAmount ||
      !formData.zdravstvenoAmount ||
      !formData.nezaposlenostAmount
    ) {
      toast({
        title: "Required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated")
      }

      // Update or insert profile data
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        pib: formData.pib,
        taxation_type: formData.taxationType,
        porez_amount: Number(formData.porezAmount),
        pio_amount: Number(formData.pioAmount),
        zdravstveno_amount: Number(formData.zdravstvenoAmount),
        nezaposlenost_amount: Number(formData.nezaposlenostAmount),
        yearly_revenue_limit: Number(formData.yearlyRevenueLimit),
      })

      if (profileError) {
        throw profileError
      }

      // Update payment details with amounts
      const updatedPaymentDetails = {
        ...paymentDetails,
        porez: { ...paymentDetails.porez, amount: formData.porezAmount },
        pio: { ...paymentDetails.pio, amount: formData.pioAmount },
        zdravstveno: { ...paymentDetails.zdravstveno, amount: formData.zdravstvenoAmount },
        nezaposlenost: { ...paymentDetails.nezaposlenost, amount: formData.nezaposlenostAmount },
      }

      setPaymentDetails(updatedPaymentDetails)

      // Update payment details in Supabase
      for (const [type, details] of Object.entries(updatedPaymentDetails)) {
        const { error: paymentDetailError } = await supabase.from("payment_details").upsert({
          user_id: user.id,
          payment_type: type,
          recipient: details.recipient,
          recipient_location: details.recipientLocation,
          model: details.model,
          reference_number: details.referenceNumber,
          payment_purpose: details.paymentPurpose,
          account_number: details.accountNumber,
          payment_code: details.paymentCode,
          amount: Number(details.amount),
        })

        if (paymentDetailError) {
          throw paymentDetailError
        }
      }

      // Update any existing payments with new amounts
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "overdue"])

      if (paymentsError) {
        throw paymentsError
      }

      // Update payment amounts based on type
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          let amount = 0

          switch (payment.payment_type) {
            case "porez":
              amount = Number(formData.porezAmount)
              break
            case "pio":
              amount = Number(formData.pioAmount)
              break
            case "zdravstveno":
              amount = Number(formData.zdravstvenoAmount)
              break
            case "nezaposlenost":
              amount = Number(formData.nezaposlenostAmount)
              break
            default:
              continue
          }

          const { error: updateError } = await supabase.from("payments").update({ amount }).eq("id", payment.id)

          if (updateError) {
            console.error(`Error updating payment ${payment.id}:`, updateError)
          }
        }
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated")
      }

      // Save payment details to Supabase
      for (const [type, details] of Object.entries(paymentDetails)) {
        const { error } = await supabase.from("payment_details").upsert({
          user_id: user.id,
          payment_type: type,
          recipient: details.recipient,
          recipient_location: details.recipientLocation,
          model: details.model,
          reference_number: details.referenceNumber,
          payment_purpose: details.paymentPurpose,
          account_number: details.accountNumber,
          payment_code: details.paymentCode,
          amount: Number(details.amount),
        })

        if (error) {
          throw error
        }
      }

      // Update any existing payments with new details
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "overdue"])

      if (paymentsError) {
        throw paymentsError
      }

      // Update payment details based on type
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          const paymentType = payment.payment_type
          const details = paymentDetails[paymentType as keyof typeof paymentDetails]

          if (details) {
            const { error: updateError } = await supabase
              .from("payments")
              .update({
                recipient: details.recipient,
                recipient_location: details.recipientLocation,
                model: details.model,
                reference_number: details.referenceNumber,
                payment_purpose: details.paymentPurpose,
                account_number: details.accountNumber,
                payment_code: details.paymentCode,
              })
              .eq("id", payment.id)

            if (updateError) {
              console.error(`Error updating payment ${payment.id}:`, updateError)
            }
          }
        }
      }

      toast({
        title: "Payment details saved",
        description: "Your payment details have been saved successfully.",
      })
    } catch (error: any) {
      console.error("Error saving payment details:", error)
      toast({
        title: "Error",
        description: "Failed to save payment details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  console.log(
    "[Settings] Rendering - authLoading:",
    authLoading,
    "isInitialLoading:",
    isInitialLoading,
    "loadError:",
    loadError,
  )

  if (authLoading || isInitialLoading) {
    console.log("[Settings] Showing loading state")
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Loading settings..." : "Učitavanje podešavanja..."}
            </h2>
            <p className="text-muted-foreground">{language === "en" ? "Please wait" : "Molimo sačekajte"}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loadError) {
    console.log("[Settings] Showing error state:", loadError)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Error Loading Settings" : "Greška pri učitavanju podešavanja"}
            </h2>
            <p className="text-muted-foreground">{loadError}</p>
          </div>
          <Button onClick={() => window.location.reload()}>{language === "en" ? "Try Again" : "Pokušaj ponovo"}</Button>
        </div>
      </DashboardLayout>
    )
  }

  console.log("[Settings] Showing normal content state")
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("settings")}</h1>

        <Tabs defaultValue="account" className="bg-white rounded-lg shadow-sm">
          <TabsList className="grid w-full grid-cols-3 p-1">
            <TabsTrigger
              value="account"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              {t("setup")}
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
              {t("language")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pib">{t("pib")}</Label>
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
                  <Label>{t("taxationType")}</Label>
                  <RadioGroup defaultValue={formData.taxationType} onValueChange={handleRadioChange} className="mt-2">
                    <div className="flex items-center space-x-2 bg-white p-3 rounded-md border">
                      <RadioGroupItem value="pausalno" id="settings-pausalno" />
                      <Label htmlFor="settings-pausalno" className="flex-1 cursor-pointer">
                        {t("pausalno")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-white p-3 rounded-md border mt-2">
                      <RadioGroupItem value="samooporezivanje" id="settings-samooporezivanje" />
                      <Label htmlFor="settings-samooporezivanje" className="flex-1 cursor-pointer">
                        {t("samooporezivanje")}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Yearly Revenue Limit Selection */}
                <div className="space-y-2">
                  <Label htmlFor="yearlyRevenueLimit">Godišnji limit prihoda</Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-700">
                          Postoje dva limita koje je potrebno pratiti – limit od 6 i 8 miliona dinara. Ukoliko se bilo
                          koji od ova dva limita prekorači, gubi se pravo na paušalno oporezivanje i preduzetnik je u
                          obavezi da odluči kako će se na dalje oporezivati i u skladu sa time podnese prijavu.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Select value={formData.yearlyRevenueLimit} onValueChange={handleYearlyRevenueLimitChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Izaberite godišnji limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6000000">6.000.000 RSD</SelectItem>
                      <SelectItem value="8000000">8.000.000 RSD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porezAmount">
                    {t("porez")} ({t("amount")})
                  </Label>
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
                  <Label htmlFor="pioAmount">
                    {t("pio")} ({t("amount")})
                  </Label>
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
                  <Label htmlFor="zdravstvenoAmount">
                    {t("zdravstveno")} ({t("amount")})
                  </Label>
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
                  <Label htmlFor="nezaposlenostAmount">
                    {t("nezaposlenost")} ({t("amount")})
                  </Label>
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
                  {isLoading ? "..." : t("save")}
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
                      {t("porez")}
                    </Button>
                    <Button
                      variant={activePaymentType === "pio" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handlePaymentTypeChange("pio")}
                    >
                      <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                        <CreditCard className="h-3 w-3 text-purple-600" />
                      </div>
                      {t("pio")}
                    </Button>
                    <Button
                      variant={activePaymentType === "zdravstveno" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handlePaymentTypeChange("zdravstveno")}
                    >
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <CreditCard className="h-3 w-3 text-green-600" />
                      </div>
                      {t("zdravstveno")}
                    </Button>
                    <Button
                      variant={activePaymentType === "nezaposlenost" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handlePaymentTypeChange("nezaposlenost")}
                    >
                      <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                        <CreditCard className="h-3 w-3 text-orange-600" />
                      </div>
                      {t("nezaposlenost")}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <form onSubmit={handlePaymentDetailsSubmit}>
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle>
                          {activePaymentType === "porez" && t("porez")}
                          {activePaymentType === "pio" && t("pio")}
                          {activePaymentType === "zdravstveno" && t("zdravstveno")}
                          {activePaymentType === "nezaposlenost" && t("nezaposlenost")}
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
                                paymentDetails[activePaymentType as keyof typeof paymentDetails]?.recipientLocation ||
                                ""
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
                        {isLoading ? "..." : t("save")}
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
                <Label htmlFor="language">{t("language")}</Label>
                <Select defaultValue={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t("languagePreference")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sr">{t("serbian")}</SelectItem>
                    <SelectItem value="en">{t("english")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
