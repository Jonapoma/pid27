"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/components/language-provider"
import { LayoutDashboard, FileText, Settings, Menu, X, CreditCard, LogOut, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: t("dashboard.title"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("payments"), href: "/payments", icon: CreditCard },
    { name: t("invoices"), href: "/invoices", icon: FileText },
    { name: t("settings"), href: "/settings", icon: Settings },
    { name: t("education"), href: "/pausalci-101", icon: GraduationCap },
  ]

  const closeMenu = () => setIsMenuOpen(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-full min-h-screen flex-col bg-gray-50">
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 pr-0" onClose={closeMenu}>
                  <div className="h-full flex flex-col border-r">
                    <div className="p-4 border-b flex items-center">
                      <Link href="/" className="text-xl font-bold text-primary flex-1">
                        PID27
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeMenu}
                        className="md:hidden"
                        aria-label="Close menu"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <nav className="flex-1 overflow-auto px-2 py-4 space-y-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={closeMenu}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                            pathname === item.href ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </nav>
                    <div className="border-t p-2">
                      <Button variant="outline" onClick={handleSignOut} className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("logout")}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Link href="/" className="text-xl font-bold text-primary hidden md:block">
                PID27
              </Link>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="hidden md:flex">
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="hidden md:block w-64 shrink-0 border-r bg-white">
            <div className="h-full flex flex-col">
              <nav className="flex-1 overflow-auto px-2 py-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      pathname === item.href ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
