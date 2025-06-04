"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/language-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ArrowRight, Calendar, CreditCard, Bell, FileText } from "lucide-react"

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-bold text-2xl text-primary">PID27</div>
          <div className="flex items-center gap-4">
            <Link href="/preview/invoice">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Faktura Preview
              </Button>
            </Link>
            <Link href="/dashboard?bypass=true">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dashboard Direct
              </Button>
            </Link>
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost">{t("login")}</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-primary hover:bg-primary/90">{t("register")}</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 gradient-bg text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{t("landing.title")}</h1>
                <p className="mx-auto max-w-[700px] text-white/80 md:text-xl">{t("landing.subtitle")}</p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    {t("landing.getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t("landing.featuresSubtitle")}</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white rounded-xl p-6 shadow-md card-hover border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("landing.feature1.title")}</h3>
                <p className="text-muted-foreground">{t("landing.feature1.description")}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md card-hover border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("landing.feature2.title")}</h3>
                <p className="text-muted-foreground">{t("landing.feature2.description")}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md card-hover border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("landing.feature3.title")}</h3>
                <p className="text-muted-foreground">{t("landing.feature3.description")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">{t("landing.ctaTitle")}</h2>
                <p className="text-lg text-muted-foreground">{t("landing.ctaDescription")}</p>
                <Link href="/auth/register">
                  <Button size="lg" className="mt-4">
                    {t("landing.getStarted")}
                  </Button>
                </Link>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white rounded-xl shadow-lg p-6 border">
                  <div className="space-y-4">
                    <div className="h-8 bg-primary/10 rounded-md w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded-md"></div>
                      <div className="h-4 bg-gray-100 rounded-md w-5/6"></div>
                      <div className="h-4 bg-gray-100 rounded-md w-4/6"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-primary/10 rounded-md w-1/3"></div>
                      <div className="h-8 bg-primary rounded-md w-1/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-bold text-xl text-primary">PID27</div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PID27. {t("footer.rights")}
            </p>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
