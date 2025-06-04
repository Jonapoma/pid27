"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/language-provider"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={language === "sr" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("sr")}
        className="w-10 rounded-full"
      >
        SR
      </Button>
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("en")}
        className="w-10 rounded-full"
      >
        EN
      </Button>
    </div>
  )
}
