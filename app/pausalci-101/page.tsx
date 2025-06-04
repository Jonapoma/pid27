"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/components/language-provider"

export default function Pausalci101Page() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary">{t("pausalci101.title")}</h1>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed mb-6">{t("pausalci101.intro")}</p>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">{t("pausalci101.keyThings")}</h2>

        <Card className="mb-6 overflow-hidden border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-blue-500 mr-2">✅</span> {t("pausalci101.invoicing.title")}
            </h3>
            <p className="mb-4">{t("pausalci101.invoicing.p1")}</p>
            <p className="mb-4">
              {t("pausalci101.invoicing.p2")}
              <a
                href="https://www.paragraf.rs/propisi/zakon_o_porezu_na_dodatu_vrednost.html"
                className="text-blue-500 hover:underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                link
              </a>
              .
            </p>
            <p>{t("pausalci101.invoicing.p3")}</p>
          </CardContent>
        </Card>

        <Card className="mb-6 overflow-hidden border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-green-500 mr-2">📊</span> {t("pausalci101.limits.title")}
            </h3>
            <p className="mb-4">{t("pausalci101.limits.p1")}</p>
            <p>{t("pausalci101.limits.p2")}</p>
          </CardContent>
        </Card>

        <Card className="mb-6 overflow-hidden border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-purple-500 mr-2">💸</span> {t("pausalci101.taxes.title")}
            </h3>
            <p className="mb-4">{t("pausalci101.taxes.p1")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("pausalci101.taxes.item1")}</li>
              <li>{t("pausalci101.taxes.item2")}</li>
              <li>{t("pausalci101.taxes.item3")}</li>
              <li>{t("pausalci101.taxes.item4")}</li>
            </ul>
            <p className="mb-4">{t("pausalci101.taxes.p2")}</p>
            <p className="mb-4">{t("pausalci101.taxes.p3")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("pausalci101.taxes.item5")}</li>
              <li>{t("pausalci101.taxes.item6")}</li>
            </ul>
            <p className="font-medium text-lg">{t("pausalci101.taxes.conclusion")}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
