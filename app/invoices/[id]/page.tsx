"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { InvoicePreview } from "@/components/invoice-preview"
import { numberToWords } from "@/lib/number-to-words"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface ServiceItem {
  description: string
  unit: string
  quantity: string
  price: string
  discount: string
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setIsLoading(true)

        // Ensure we have a valid user
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!userData?.user?.id) {
          throw new Error("User not authenticated")
        }

        // Fetch the invoice from Supabase
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", userData.user.id)
          .single()

        if (invoiceError) {
          if (invoiceError.code === "PGRST116") {
            router.push("/invoices")
            return
          }
          throw invoiceError
        }

        if (!invoiceData) {
          router.push("/invoices")
          return
        }

        // Fetch service items for this invoice
        const { data: serviceItemsData, error: serviceItemsError } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", params.id)
          .order("id", { ascending: true })

        if (serviceItemsError) {
          throw serviceItemsError
        }

        // Transform service items to match our interface
        const transformedServiceItems: ServiceItem[] = (serviceItemsData || []).map((item) => ({
          description: item.description || "",
          unit: item.unit || "",
          quantity: item.quantity?.toString() || "",
          price: item.price?.toString() || "",
          discount: item.discount?.toString() || "0",
        }))

        // If no service items found, create a default one
        if (transformedServiceItems.length === 0) {
          transformedServiceItems.push({
            description: invoiceData.data?.serviceDescription || "",
            unit: invoiceData.data?.serviceUnit || "",
            quantity: invoiceData.data?.serviceQuantity || "",
            price: invoiceData.data?.servicePrice || "",
            discount: "0",
          })
        }

        setInvoice(invoiceData)
        setServiceItems(transformedServiceItems)
      } catch (error) {
        console.error("Error fetching invoice:", error)
        toast({
          title: "Error",
          description: "Failed to load invoice. Please try again.",
          variant: "destructive",
        })
        router.push("/invoices")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoice()
  }, [params.id, router, supabase])

  const calculateTotal = () => {
    return serviceItems.reduce((total, item) => {
      const quantity = Number.parseFloat(item.quantity) || 0
      const price = Number.parseFloat(item.price) || 0
      const discount = Number.parseFloat(item.discount) || 0
      const itemTotal = quantity * price * (1 - discount / 100)
      return total + itemTotal
    }, 0)
  }

  const total = invoice ? calculateTotal() : 0
  const totalInWords = numberToWords(total)

  const handlePrintPreview = () => {
    // Add a print-specific style element before printing
    const style = document.createElement("style")
    style.innerHTML = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        margin: 0;
        padding: 0;
      }
      @media print {
        .print-container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `
    style.id = "print-styles"
    document.head.appendChild(style)

    window.print()

    // Remove the style element after printing
    document.head.removeChild(style)
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    const invoiceElement = document.getElementById("invoice-preview")

    if (!invoiceElement) {
      setIsExporting(false)
      return
    }

    try {
      // Prepare the element for capture
      const originalStyle = invoiceElement.style.cssText
      invoiceElement.style.width = "210mm"
      invoiceElement.style.padding = "15mm 15mm"
      invoiceElement.style.backgroundColor = "white"
      invoiceElement.style.position = "relative"
      invoiceElement.style.overflow = "visible"

      // Create a canvas from the invoice element
      const canvas = await html2canvas(invoiceElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200, // Fixed width to ensure consistent rendering
        onclone: (document, element) => {
          // Additional styling for the cloned element
          element.style.width = "210mm"
          element.style.padding = "15mm 15mm"
          element.style.backgroundColor = "white"
          element.style.position = "relative"
          element.style.overflow = "visible"
        },
      })

      // Restore original style
      invoiceElement.style.cssText = originalStyle

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      // Calculate dimensions to fit A4
      const imgWidth = 210 - 30 // A4 width in mm minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Add the image to the PDF
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 1.0),
        "JPEG",
        15, // Left margin
        15, // Top margin
        imgWidth,
        imgHeight,
      )

      // Save the PDF
      pdf.save(`Faktura-${invoice?.data?.invoiceNumber || "invoice"}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }

    setIsExporting(false)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Učitavanje fakture...</h2>
            <p className="text-muted-foreground">Molimo sačekajte</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Faktura nije pronađena</h2>
            <Button onClick={() => router.push("/invoices")} className="mt-4">
              Povratak na fakture
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Faktura {invoice.data.invoiceNumber}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 print:p-0 print:shadow-none">
          <div className="flex justify-end gap-2 mb-6 print:hidden">
            <Button variant="outline" onClick={handlePrintPreview}>
              <Printer className="mr-2 h-4 w-4" />
              Štampaj
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Izvoz..." : "Izvoz PDF"}
            </Button>
          </div>

          <div id="invoice-preview" className="print-container">
            <InvoicePreview
              invoiceData={invoice.data}
              serviceItems={serviceItems}
              total={total}
              totalInWords={totalInWords}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
