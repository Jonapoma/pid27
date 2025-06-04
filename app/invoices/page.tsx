"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/components/language-provider"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Invoice {
  id: string
  number: string
  date: Date
  clientName: string
  amount: number
  dueDate: Date
}

export default function InvoicesPage() {
  const { t, language } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  console.log(
    "[Invoices] Initial render - authLoading:",
    authLoading,
    "user:",
    user?.id ? `exists (${user.id})` : "null",
  )

  useEffect(() => {
    console.log(
      "[Invoices] useEffect triggered - authLoading:",
      authLoading,
      "user:",
      user?.id ? `exists (${user.id})` : "null",
    )

    // Only fetch invoices when auth is complete and we have a user
    if (authLoading) {
      console.log("[Invoices] Auth still loading, skipping fetchData")
      return
    }

    async function fetchInvoices() {
      console.log("[Invoices] fetchInvoices() called")

      // Create a timeout to detect stalled queries
      const timeoutId = setTimeout(() => {
        console.error("[Invoices] TIMEOUT: Supabase queries took too long (>10s)")
        setIsLoading(false)
        setError("Request timeout - Database queries are taking too long")
      }, 10000)

      try {
        setIsLoading(true)
        setError(null)

        if (!user || !user.id) {
          console.log("[Invoices] No user found, aborting data fetch")
          setIsLoading(false)
          setError("User not authenticated")
          clearTimeout(timeoutId)
          return
        }

        console.log("[Invoices] Fetching invoices for user:", user.id)
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        console.log("[Invoices] Invoices data result:", data ? `${data.length} items` : "null", "error:", error)

        if (error) {
          console.error("[Invoices] Invoice fetch error:", error)
          throw error
        }

        // Transform the data to match our Invoice interface
        const transformedInvoices: Invoice[] = (data || []).map((invoice) => ({
          id: invoice.id,
          number: invoice.number || "",
          date: new Date(invoice.date),
          clientName: invoice.client_name || "",
          amount: invoice.amount || 0,
          dueDate: new Date(invoice.due_date),
        }))

        console.log("[Invoices] Setting invoices state with transformed data")
        setInvoices(transformedInvoices)
      } catch (error: any) {
        console.error("[Invoices] Error fetching invoices:", error)
        setError(error.message || "Failed to load invoices")
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive",
        })
      } finally {
        clearTimeout(timeoutId)
        console.log("[Invoices] Finally block, setting isLoading to false")
        setIsLoading(false)
      }
    }

    fetchInvoices()

    console.log("[Invoices] useEffect completed setup")
  }, [supabase, user, authLoading])

  console.log("[Invoices] Rendering - authLoading:", authLoading, "isLoading:", isLoading, "error:", error)

  if (authLoading || isLoading) {
    console.log("[Invoices] Showing loading state")
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Loading invoices..." : "Učitavanje faktura..."}
            </h2>
            <p className="text-muted-foreground">{language === "en" ? "Please wait" : "Molimo sačekajte"}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    console.log("[Invoices] Showing error state:", error)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === "en" ? "Error Loading Invoices" : "Greška pri učitavanju faktura"}
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>{language === "en" ? "Try Again" : "Pokušaj ponovo"}</Button>
        </div>
      </DashboardLayout>
    )
  }

  console.log("[Invoices] Showing normal content state with", invoices.length, "invoices")
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Fakture</h1>
            <p className="text-muted-foreground">Kreirajte i upravljajte vašim fakturama</p>
          </div>
          <Link href="/invoices/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nova faktura
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="all" className="bg-white rounded-lg shadow-sm">
          <TabsList className="grid w-full grid-cols-3 p-1">
            <TabsTrigger
              value="all"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Sve fakture
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Nacrti
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Poslate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium mb-2">Nemate fakture</h3>
                <p className="text-muted-foreground mb-4">Kreirajte svoju prvu fakturu da biste počeli</p>
                <Link href="/invoices/new">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Nova faktura
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invoices.map((invoice) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Faktura #{invoice.number}</CardTitle>
                        <CardDescription>{format(invoice.date, "dd.MM.yyyy")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Klijent:</span>
                            <span className="font-medium">{invoice.clientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Iznos:</span>
                            <span className="font-medium">{invoice.amount.toLocaleString()} RSD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rok plaćanja:</span>
                            <span className="font-medium">{format(invoice.dueDate, "dd.MM.yyyy")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft" className="p-4">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium mb-2">Nemate nacrte faktura</h3>
              <p className="text-muted-foreground mb-4">Kreirajte svoju prvu fakturu da biste počeli</p>
              <Link href="/invoices/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Nova faktura
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="sent" className="p-4">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium mb-2">Nemate poslate fakture</h3>
              <p className="text-muted-foreground mb-4">Kreirajte svoju prvu fakturu da biste počeli</p>
              <Link href="/invoices/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Nova faktura
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
