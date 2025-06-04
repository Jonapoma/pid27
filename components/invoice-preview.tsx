"use client"

import { format } from "date-fns"

interface ServiceItem {
  description: string
  unit: string
  quantity: string
  price: string
  discount: string
}

interface InvoicePreviewProps {
  invoiceData: any
  serviceItems: ServiceItem[]
  total: number
  totalInWords: string
}

export function InvoicePreview({ invoiceData, serviceItems, total, totalInWords }: InvoicePreviewProps) {
  // Format dates
  const formattedInvoiceDate = invoiceData.invoiceDate ? format(invoiceData.invoiceDate, "dd.MM.yyyy") : ""
  const formattedDueDate = invoiceData.paymentDueDate ? format(invoiceData.paymentDueDate, "dd.MM.yyyy") : ""

  // Generate a random identification number
  const identificationNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  // Calculate item totals with percentage discount
  const calculateItemTotal = (quantity: string, price: string, discount: string) => {
    const qty = Number.parseFloat(quantity) || 0
    const prc = Number.parseFloat(price) || 0
    const disc = Number.parseFloat(discount) || 0
    return qty * prc * (1 - disc / 100)
  }

  return (
    <div className="font-sans bg-white text-gray-900 print:p-0 print:m-0 print:bg-white">
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print-container {
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
        }
      `}</style>

      {/* Invoice Document */}
      <div className="max-w-[210mm] mx-auto px-6 py-6 print:p-0 print:shadow-none print-container">
        {/* Header */}
        <div className="flex justify-between mb-6 print:mb-4">
          {/* Left side - Faktura */}
          <div className="w-1/3">
            <div className="flex flex-col">
              <span className="text-2xl font-bold print:text-xl">Faktura:</span>
              <span className="text-2xl font-bold print:text-xl">{invoiceData.invoiceNumber}</span>
              <span className="text-sm font-normal text-black mt-2">
                Račun je važeći bez pečata i potpisa. Račun izdao:{" "}
                {invoiceData.issuedBy || invoiceData.issuerName || ""}
              </span>
            </div>
          </div>

          {/* Right side - Dates and Location */}
          <div className="w-2/3 flex justify-end">
            <div className="flex flex-col items-start mr-12">
              <span className="text-amber-800 font-semibold">Datum fakture</span>
              <span>{formattedInvoiceDate}</span>
            </div>

            <div className="flex flex-col items-start">
              <span className="text-amber-800 font-semibold">Datum prometa</span>
              <span>{formattedInvoiceDate}</span>

              <div className="mt-4">
                <span className="text-amber-800 font-semibold">Mesto prometa</span>
                <div>{invoiceData.companyCity?.split(" ")[0] || "Beograd"}</div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-t border-black my-4 print:my-2" />

        {/* Sender and Recipient Information */}
        <div className="flex justify-between mb-6 print:mb-4">
          {/* Sender (Od:) */}
          <div className="w-1/2 pr-4">
            <div className="font-bold text-black mb-2 print:mb-1">Od:</div>
            <div className="text-xl font-bold text-black mb-2 print:text-lg print:mb-1">{invoiceData.companyName}</div>
            <div className="mb-2 leading-relaxed print:mb-1 print:leading-snug">
              {invoiceData.companyNameSecondLine}
            </div>
            <div className="text-sm space-y-1 leading-relaxed print:space-y-0 print:leading-tight">
              <p>{invoiceData.companyAddress}</p>
              <p>{invoiceData.companyCity}</p>
              <p className="mt-1 print:mt-0">PIB: {invoiceData.companyPib}</p>
              <p className="mt-1 print:mt-0">Matični broj: {invoiceData.companyMb || "/"}</p>
              <p className="mt-1 print:mt-0">Tekući RAČUN: {invoiceData.companyBankAccount}</p>
              {invoiceData.companyGiroAccount && (
                <p className="mt-1 print:mt-0">Žiro RAČUN: {invoiceData.companyGiroAccount}</p>
              )}
              <p className="mt-1 print:mt-0">E-mail: {invoiceData.companyEmail}</p>
            </div>
          </div>

          {/* Recipient (Komitent:) */}
          <div className="w-1/2 pl-4">
            <div className="font-bold text-black mb-2 print:mb-1">Komitent:</div>
            <div className="text-xl font-bold text-black mb-2 print:text-lg print:mb-1">{invoiceData.clientName}</div>
            <div className="text-sm space-y-1 leading-relaxed print:space-y-0 print:leading-tight">
              <p>Adresa: {invoiceData.clientAddress}</p>
              <p className="mt-1 print:mt-0">Grad: {invoiceData.clientCity || "Zrenjanin"}</p>
              <p className="mt-1 print:mt-0">PIB: {invoiceData.clientPib}</p>
              <p className="mt-1 print:mt-0">Matični broj: {invoiceData.clientMb || "/"}</p>
            </div>
          </div>
        </div>

        {/* Service Table */}
        <div className="mb-6 print:mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-sm font-bold uppercase border-b border-t border-black print:py-1">
                  VRSTA USLUGE
                </th>
                <th className="text-center py-2 px-2 text-sm font-bold uppercase border-b border-t border-black print:py-1">
                  JEDINICA
                </th>
                <th className="text-center py-2 px-2 text-sm font-bold uppercase border-b border-t border-black print:py-1">
                  KOLIČINA
                </th>
                <th className="text-right py-2 px-2 text-sm font-bold uppercase border-b border-t border-black print:py-1">
                  CENA
                </th>
                <th className="text-right py-2 px-2 text-sm font-bold uppercase border-b border-t border-black print:py-1">
                  RABAT
                </th>
                <th className="text-right py-2 px-2 text-sm font-bold uppercase border-b border-t border-black print:py-1">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {serviceItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-2 px-2 print:py-1">{item.description}</td>
                  <td className="py-2 px-2 text-center print:py-1">{item.unit}</td>
                  <td className="py-2 px-2 text-center print:py-1">{item.quantity}</td>
                  <td className="py-2 px-2 text-right print:py-1">
                    {Number.parseFloat(item.price).toLocaleString("sr-RS", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 px-2 text-right print:py-1">
                    {Number.parseFloat(item.discount || "0").toLocaleString("sr-RS", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 px-2 text-right print:py-1">
                    {calculateItemTotal(item.quantity, item.price, item.discount).toLocaleString("sr-RS", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-6 print:mb-4">
          <div className="flex justify-end">
            <div className="w-full">
              <div className="border-b border-black py-2 flex justify-between print:py-1">
                <span className="font-bold uppercase text-black">UKUPNO (RSD)</span>
                <span className="font-bold text-black">
                  {total.toLocaleString("sr-RS", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="border-b border-black py-2 flex justify-between print:py-1">
                <span className="font-bold uppercase text-black">RABAT (RSD)</span>
                <span>0,00</span>
              </div>
              <div className="border-b border-black py-2 flex justify-between print:py-1">
                <span className="font-bold uppercase text-black">UKUPNO ZA UPLATU (RSD)</span>
                <span className="font-bold text-black">
                  {total.toLocaleString("sr-RS", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-6 print:mb-4">
          <div className="font-bold uppercase text-black mb-2 print:mb-1">KOMENTAR / OPIS USLUGE</div>
          <div className="text-sm leading-relaxed print:leading-tight">
            <p>Rok za plaćanje je {formattedDueDate}</p>
            <p className="mt-1 print:mt-0">Pri plaćanju fakture navedite poziv na broj {invoiceData.invoiceNumber}</p>
            <p className="mt-1 print:mt-0">Identifikacioni broj: {identificationNumber}</p>
            <p className="mt-1 print:mt-0">
              Mesto izdavanja: {invoiceData.companyCity?.split(" ")[0] || "Beograd"}{" "}
              {invoiceData.companyCity?.split(" ")[1] || "11000"}
            </p>
          </div>
        </div>

        {/* Tax Exemption */}
        <div className="mb-6 print:mb-4">
          <div className="font-bold uppercase text-black mb-2 print:mb-1">NAPOMENA O PORESKOM OSLOBOĐENJU:</div>
          <div className="text-sm leading-relaxed print:leading-tight">
            <p>Poreski obveznik nije u sistemu PDV-a.</p>
            <p>PDV nije obračunat na fakturi u skladu za članom 33. Zakona o porezu na dodatu vrednost.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
