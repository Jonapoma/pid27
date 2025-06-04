"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft, Save, FileText, Printer, Home, Download, Plus, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoicePreview } from "@/components/invoice-preview"
import { numberToWords } from "@/lib/number-to-words"
import Link from "next/link"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface ServiceItem {
  description: string
  unit: string
  quantity: string
  price: string
  discount: string
}

export default function InvoicePreviewPage() {
  const [activeTab, setActiveTab] = useState("form")
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [invoiceData, setInvoiceData] = useState({
    // Company information
    companyName: "Brendle",
    companyNameSecondLine: "Marko Marković PR Studio za dizajn Brendle",
    companyAddress: "Patrisa Lumumbe 163",
    companyCity: "Beograd 11000",
    companyEmail: "office@pausali.rs",
    companyPhone: "+38163578364",
    companyBankAccount: "160-6000000123456-01",
    companyGiroAccount: "",
    companyPib: "123456789",
    companyMb: "12345678",
    companyPdvNotice: "Poreski Obaveznik nije u Sistemu PDV-a u skladu sa članom 33 Zakona o porezu na dodatu vrednost",

    // Invoice details
    invoiceNumber: `6/2024`,
    invoiceDate: new Date("2024-02-01"),
    issuedBy: "Marko Marković",

    // Client information
    clientName: "SystemStar doo Zrenjanin",
    clientAddress: "Zrenjaninski put 31",
    clientCity: "Zrenjanin",
    clientPib: "987654321",
    clientMb: "87654321",

    // Payment details
    paymentDueDate: new Date("2024-02-16"),

    // Additional notes
    additionalNotes: "",

    // Issuer
    issuerName: "Marko Marković",
  })

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    {
      description: "Korporativni identitet - izrada logotipa",
      unit: "Komad",
      quantity: "2",
      price: "16200",
      discount: "0",
    },
    {
      description: "Izrada vizit karti",
      unit: "Sat",
      quantity: "6",
      price: "2360",
      discount: "0",
    },
    {
      description: "Korporativni identitet - dizajn memoranduma",
      unit: "Komad",
      quantity: "1",
      price: "2000",
      discount: "0",
    },
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInvoiceData((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceItemChange = (index: number, field: keyof ServiceItem, value: string) => {
    const updatedItems = [...serviceItems]
    updatedItems[index][field] = value
    setServiceItems(updatedItems)
  }

  const addServiceItem = () => {
    setServiceItems([
      ...serviceItems,
      {
        description: "",
        unit: "Komad",
        quantity: "1",
        price: "0",
        discount: "0",
      },
    ])
  }

  const removeServiceItem = (index: number) => {
    if (serviceItems.length > 1) {
      const updatedItems = [...serviceItems]
      updatedItems.splice(index, 1)
      setServiceItems(updatedItems)
    }
  }

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      setInvoiceData((prev) => ({ ...prev, [field]: date }))
    }
  }

  const calculateTotal = () => {
    return serviceItems.reduce((total, item) => {
      const quantity = Number.parseFloat(item.quantity) || 0
      const price = Number.parseFloat(item.price) || 0
      const discount = Number.parseFloat(item.discount) || 0
      const itemTotal = quantity * price * (1 - discount / 100)
      return total + itemTotal
    }, 0)
  }

  const total = calculateTotal()
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
      pdf.save(`Faktura-${invoiceData.invoiceNumber}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }

    setIsExporting(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="font-bold text-2xl text-primary">PID27 - Preview</div>
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
      <main className="flex-1 p-4 md:p-6 print:p-0">
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="print:hidden">
            <h1 className="text-2xl font-bold">Nova faktura</h1>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="bg-white rounded-lg shadow-sm print:shadow-none"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 print:hidden">
              <TabsTrigger
                value="form"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Forma
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Pregled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Podaci o izdavaocu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Naziv firme (prvi red)</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={invoiceData.companyName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyNameSecondLine">Naziv firme (drugi red)</Label>
                      <Input
                        id="companyNameSecondLine"
                        name="companyNameSecondLine"
                        value={invoiceData.companyNameSecondLine}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Adresa</Label>
                      <Input
                        id="companyAddress"
                        name="companyAddress"
                        value={invoiceData.companyAddress}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">Mesto</Label>
                      <Input
                        id="companyCity"
                        name="companyCity"
                        value={invoiceData.companyCity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        value={invoiceData.companyEmail}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Telefon</Label>
                      <Input
                        id="companyPhone"
                        name="companyPhone"
                        value={invoiceData.companyPhone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyBankAccount">Tekući račun</Label>
                      <Input
                        id="companyBankAccount"
                        name="companyBankAccount"
                        value={invoiceData.companyBankAccount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyGiroAccount">Žiro račun (opciono)</Label>
                      <Input
                        id="companyGiroAccount"
                        name="companyGiroAccount"
                        value={invoiceData.companyGiroAccount}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPib">PIB</Label>
                      <Input
                        id="companyPib"
                        name="companyPib"
                        value={invoiceData.companyPib}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyMb">Matični broj</Label>
                      <Input
                        id="companyMb"
                        name="companyMb"
                        value={invoiceData.companyMb}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyPdvNotice">Napomena o PDV-u</Label>
                      <Input
                        id="companyPdvNotice"
                        name="companyPdvNotice"
                        value={invoiceData.companyPdvNotice}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Podaci o fakturi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Broj fakture</Label>
                      <Input
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={invoiceData.invoiceNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceDate">Datum fakture</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            id="invoiceDate"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceData.invoiceDate
                              ? format(invoiceData.invoiceDate, "dd.MM.yyyy")
                              : "Izaberite datum"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={invoiceData.invoiceDate}
                            onSelect={(date) => handleDateChange("invoiceDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issuedBy">Račun izdao</Label>
                      <Input
                        id="issuedBy"
                        name="issuedBy"
                        value={invoiceData.issuedBy}
                        onChange={handleInputChange}
                        placeholder="Ime i prezime"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Podaci o klijentu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Naziv klijenta</Label>
                      <Input
                        id="clientName"
                        name="clientName"
                        value={invoiceData.clientName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientAddress">Adresa klijenta</Label>
                      <Input
                        id="clientAddress"
                        name="clientAddress"
                        value={invoiceData.clientAddress}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientCity">Grad</Label>
                      <Input
                        id="clientCity"
                        name="clientCity"
                        value={invoiceData.clientCity}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPib">PIB klijenta</Label>
                      <Input
                        id="clientPib"
                        name="clientPib"
                        value={invoiceData.clientPib}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientMb">Matični broj klijenta</Label>
                      <Input id="clientMb" name="clientMb" value={invoiceData.clientMb} onChange={handleInputChange} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Stavke fakture</CardTitle>
                  <Button onClick={addServiceItem} variant="outline" size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" /> Dodaj stavku
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {serviceItems.map((item, index) => (
                    <div key={index} className="p-4 border rounded-md relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => removeServiceItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`item-${index}-description`}>Vrsta usluge</Label>
                          <Input
                            id={`item-${index}-description`}
                            value={item.description}
                            onChange={(e) => handleServiceItemChange(index, "description", e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`item-${index}-unit`}>Jedinica</Label>
                            <Input
                              id={`item-${index}-unit`}
                              value={item.unit}
                              onChange={(e) => handleServiceItemChange(index, "unit", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-${index}-quantity`}>Količina</Label>
                            <Input
                              id={`item-${index}-quantity`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleServiceItemChange(index, "quantity", e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-${index}-price`}>Cena</Label>
                            <Input
                              id={`item-${index}-price`}
                              type="number"
                              value={item.price}
                              onChange={(e) => handleServiceItemChange(index, "price", e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-${index}-discount`}>Rabat (%)</Label>
                            <Input
                              id={`item-${index}-discount`}
                              type="number"
                              value={item.discount}
                              onChange={(e) => handleServiceItemChange(index, "discount", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Ukupno za stavku:</div>
                            <div className="font-medium">
                              {(
                                (Number.parseFloat(item.quantity) || 0) *
                                (Number.parseFloat(item.price) || 0) *
                                (1 - (Number.parseFloat(item.discount) || 0) / 100)
                              ).toLocaleString()}{" "}
                              RSD
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Ukupno:</span>
                      <span className="text-xl font-bold">{total.toLocaleString()} RSD</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setActiveTab("preview")}>
                  Pregled
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  Sačuvaj fakturu
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="p-4 space-y-6 print:p-0">
              <div
                id="invoice-preview"
                className="bg-white rounded-lg border p-8 print:p-0 print:border-0 print-container"
              >
                <InvoicePreview
                  invoiceData={invoiceData}
                  serviceItems={serviceItems}
                  total={total}
                  totalInWords={totalInWords}
                />
              </div>

              <div className="flex justify-between gap-4 print:hidden">
                <Button variant="outline" onClick={() => setActiveTab("form")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Nazad na formu
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrintPreview}>
                    <Printer className="mr-2 h-4 w-4" />
                    Štampaj
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Izvoz..." : "Izvoz PDF"}
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />
                    Sačuvaj fakturu
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
