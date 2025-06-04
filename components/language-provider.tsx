"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

// Define the translations
const translations = {
  en: {
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    languagePreference: "Language Preference",
    serbian: "Serbian",
    english: "English",
    submit: "Submit",
    dashboard: "Dashboard",
    settings: "Settings",
    logout: "Logout",
    dueNow: "Due Now",
    overdue: "Overdue",
    paid: "Paid",
    paymentType: "Payment Type",
    dueDate: "Due Date",
    amount: "Amount",
    status: "Status",
    pending: "Pending",
    markAsPaid: "Mark as Paid",
    paymentInstructions: "Payment Instructions",
    recipient: "Recipient",
    model: "Model",
    referenceNumber: "Reference Number",
    paymentPurpose: "Payment Purpose",
    pib: "PIB (Tax ID)",
    taxationType: "Taxation Method",
    pausalno: "Pausalno",
    samooporezivanje: "Samooporezivanje",
    porez: "Tax",
    pio: "PIO",
    zdravstveno: "Health Insurance",
    nezaposlenost: "Unemployment",
    save: "Save",
    cancel: "Cancel",
    notifications: "Notifications",
    language: "Language",
    setup: "Setup",
    onboarding: "Onboarding",
    welcome: "Welcome",
    completeSetup: "Complete Setup",
    paymentDetails: "Payment Details",
    back: "Back",
    paidDate: "Paid Date",
    scanQR: "Scan QR code to pay",
    "landing.title": "Manage Your Tax Obligations with Ease",
    "landing.subtitle":
      "PID27 helps Serbian sole proprietors manage and pay mandatory taxes and contributions on time.",
    "landing.getStarted": "Get Started",
    "landing.featuresTitle": "Simplify Your Tax Management",
    "landing.featuresSubtitle": "PID27 provides all the tools you need to manage your tax obligations efficiently.",
    "landing.feature1.title": "Track Payment Obligations",
    "landing.feature1.description": "Easily track all your tax and contribution payment obligations in one place.",
    "landing.feature2.title": "Never Miss a Deadline",
    "landing.feature2.description": "Get timely reminders before payment deadlines to avoid late fees.",
    "landing.feature3.title": "Simple Payment Process",
    "landing.feature3.description": "Generate payment QR codes instantly for quick and error-free payments.",
    "landing.ctaTitle": "Ready to simplify your tax management?",
    "landing.ctaDescription":
      "Join thousands of Serbian entrepreneurs who use PID27 to manage your tax obligations efficiently.",
    "footer.rights": "All rights reserved.",
    "auth.createAccount": "Create an account",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.dontHaveAccount": "Don't have an account?",
    "auth.resetPasswordInstructions": "Enter your email address and we'll send you a link to reset your password.",
    "auth.backToLogin": "Back to login",
    "auth.resetLinkSent": "Reset link sent! Check your email.",
    "setup.title": "Let's set up your account",
    "setup.subtitle": "We need some information to get you started.",
    "setup.step1": "Basic Information",
    "setup.step2": "Payment Amounts",
    "setup.step3": "Review",
    "setup.next": "Next",
    "setup.previous": "Previous",
    "setup.complete": "Complete Setup",
    "dashboard.welcome": "Welcome back!",
    "dashboard.summary": "Here's a summary of your tax obligations",
    "dashboard.dueThisMonth": "Due this month",
    "dashboard.overduePayments": "Overdue payments",
    "dashboard.paidThisYear": "Paid this year",
    "dashboard.viewAll": "View all",
    "dashboard.upcomingPayments": "Upcoming Payments",
    "dashboard.recentActivity": "Recent Activity",
    "dashboard.noActivity": "No recent activity",
    "dashboard.viewPayment": "View payment",
    pausalci101: "Sole Proprietors 101",
    "pausalci101.title": "Simplified Business Operations for Sole Proprietors with PID27",
    "pausalci101.intro":
      "One of the main advantages of sole proprietors with flat-rate taxation is simple and efficient business operations. A sole proprietor doesn't keep business books, doesn't submit annual balance sheets, and in most cases doesn't need an accountant. It's so simplified that you can handle most things yourself - provided you know what to do and when to do it. 🙂",
    "pausalci101.keyThings": "Key things every sole proprietor must know:",
    "pausalci101.invoicing.title": "Issuing Invoices",
    "pausalci101.invoicing.p1":
      "Every money inflow must have a basis - that's an invoice. Whether it's a dinar account, foreign currency, PayPal, or Payoneer, every income must have an invoice covering the service.",
    "pausalci101.invoicing.p2":
      "An invoice is created when the service is performed and sent to the client. It can be physical or digital, but must contain all elements prescribed by the VAT Law (Article 42).",
    "pausalci101.invoicing.p3":
      "If it's in physical form, it must have a signature and stamp. In electronic form - a unique identifier (invoice number) is sufficient, without signature and stamp.",
    "pausalci101.limits.title": "Tracking Limits",
    "pausalci101.limits.p1":
      "There are two key limits: 6 million and 8 million dinars annually. If you exceed them, you exit the sole proprietorship flat-rate taxation system and must switch to another regime.",
    "pausalci101.limits.p2":
      "PID27 warns you in time - you see your income throughout the year in clear graphs and receive notifications when you approach the limit.",
    "pausalci101.taxes.title": "Paying Taxes and Contributions",
    "pausalci101.taxes.p1": "Sole proprietors pay fixed monthly amounts for:",
    "pausalci101.taxes.item1": "Income tax from self-employment",
    "pausalci101.taxes.item2": "Pension insurance contribution",
    "pausalci101.taxes.item3": "Health insurance contribution",
    "pausalci101.taxes.item4": "Unemployment contribution",
    "pausalci101.taxes.p2":
      "These obligations are not tied to earned income, but are determined by the tax assessment.",
    "pausalci101.taxes.p3":
      "PID27 allows you to add your tax assessment, and then automatically receive payment slips with QR codes that you can:",
    "pausalci101.taxes.item5": "scan with a mobile banking app",
    "pausalci101.taxes.item6": "or print and pay at the bank",
    "pausalci101.taxes.conclusion": "No errors, no complications.",
  },
  sr: {
    login: "Prijava",
    register: "Registracija",
    email: "Email",
    password: "Lozinka",
    confirmPassword: "Potvrdi lozinku",
    forgotPassword: "Zaboravili ste lozinku?",
    resetPassword: "Resetuj lozinku",
    languagePreference: "Izbor jezika",
    serbian: "Srpski",
    english: "Engleski",
    submit: "Potvrdi",
    dashboard: "Kontrolna tabla",
    settings: "Podešavanja",
    logout: "Odjava",
    dueNow: "Za plaćanje",
    overdue: "Zakašnjenje",
    paid: "Plaćeno",
    paymentType: "Vrsta plaćanja",
    dueDate: "Rok plaćanja",
    amount: "Iznos",
    status: "Status",
    pending: "Na čekanju",
    markAsPaid: "Označi kao plaćeno",
    paymentInstructions: "Uputstva za plaćanje",
    recipient: "Primalac",
    model: "Model",
    referenceNumber: "Poziv na broj",
    paymentPurpose: "Svrha plaćanja",
    pib: "PIB",
    taxationType: "Način oporezivanja",
    pausalno: "Paušalno",
    samooporezivanje: "Samooporezivanje",
    porez: "Porez",
    pio: "PIO",
    zdravstveno: "Zdravstveno",
    nezaposlenost: "Nezaposlenost",
    save: "Sačuvaj",
    cancel: "Otkaži",
    notifications: "Obaveštenja",
    language: "Jezik",
    setup: "Podešavanje",
    onboarding: "Onboarding",
    welcome: "Dobrodošli",
    completeSetup: "Završi podešavanje",
    paymentDetails: "Detalji plaćanja",
    back: "Nazad",
    paidDate: "Datum plaćanja",
    scanQR: "Skenirajte QR kod za plaćanje",
    "landing.title": "Upravljajte poreskim obavezama sa lakoćom",
    "landing.subtitle":
      "PID27 pomaže srpskim preduzetnicima da upravljaju i plaćaju obavezne poreze i doprinose na vreme.",
    "landing.getStarted": "Započnite",
    "landing.featuresTitle": "Pojednostavite upravljanje porezima",
    "landing.featuresSubtitle": "PID27 pruža sve alate potrebne za efikasno upravljanje poreskim obavezama.",
    "landing.feature1.title": "Pratite obaveze plaćanja",
    "landing.feature1.description": "Lako pratite sve vaše poreske obaveze i doprinose na jednom mestu.",
    "landing.feature2.title": "Nikad ne propustite rok",
    "landing.feature2.description": "Dobijajte pravovremene podsetnike pre rokova plaćanja kako biste izbegli kamate.",
    "landing.feature3.title": "Jednostavan proces plaćanja",
    "landing.feature3.description": "Generišite QR kodove za plaćanje trenutno za brza i bezgrešna plaćanja.",
    "landing.ctaTitle": "Spremni da pojednostavite upravljanje porezima?",
    "landing.ctaDescription":
      "Pridružite se hiljadama srpskih preduzetnika koji koriste PID27 za efikasno upravljanje poreskim obavezama.",
    "footer.rights": "Sva prava zadržana.",
    "auth.createAccount": "Kreirajte nalog",
    "auth.alreadyHaveAccount": "Već imate nalog?",
    "auth.dontHaveAccount": "Nemate nalog?",
    "auth.resetPasswordInstructions": "Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke.",
    "auth.backToLogin": "Nazad na prijavu",
    "auth.resetLinkSent": "Link za resetovanje poslat! Proverite vaš email.",
    "setup.title": "Hajde da postavimo vaš nalog",
    "setup.subtitle": "Potrebne su nam neke informacije da bismo počeli.",
    "setup.step1": "Osnovne informacije",
    "setup.step2": "Iznosi plaćanja",
    "setup.step3": "Pregled",
    "setup.next": "Dalje",
    "setup.previous": "Nazad",
    "setup.complete": "Završi podešavanje",
    "dashboard.welcome": "Dobrodošli nazad!",
    "dashboard.summary": "Evo pregleda vaših poreskih obaveza",
    "dashboard.dueThisMonth": "Za plaćanje ovog meseca",
    "dashboard.overduePayments": "Zakasnela plaćanja",
    "dashboard.paidThisYear": "Plaćeno ove godine",
    "dashboard.viewAll": "Pogledaj sve",
    "dashboard.upcomingPayments": "Predstojeća plaćanja",
    "dashboard.recentActivity": "Nedavne aktivnosti",
    "dashboard.noActivity": "Nema nedavnih aktivnosti",
    "dashboard.viewPayment": "Pogledaj plaćanje",
    pausalci101: "Paušalci 101",
    "pausalci101.title": "Olakšano poslovanje za paušalce uz PID27",
    "pausalci101.intro":
      "Jedna od glavnih prednosti paušalno oporezovanih preduzetnika jeste jednostavno i efikasno poslovanje. Paušalac ne vodi poslovne knjige, ne predaje godišnje bilanse i u većini slučajeva nema potrebu za knjigovođom. Toliko je pojednostavljeno da većinu stvari možeš obaviti sam - pod uslovom da znaš šta i kada treba da uradiš. 🙂",
    "pausalci101.keyThings": "Najvažnije stvari koje svaki paušalac mora da zna:",
    "pausalci101.invoicing.title": "Izdavanje faktura",
    "pausalci101.invoicing.p1":
      "Svaki priliv novca mora imati osnov - to je faktura. Bilo da je u pitanju dinarski račun, devizni, PayPal ili Payoneer, za svaki prihod mora postojati račun koji pokriva uslugu.",
    "pausalci101.invoicing.p2":
      "Faktura se kreira kada se usluga izvrši i šalje se klijentu. Može biti fizička ili digitalna, ali mora sadržati sve elemente propisane Zakonom o PDV-u (član 42).",
    "pausalci101.invoicing.p3":
      "Ako je u fizičkom obliku, mora imati potpis i pečat. U elektronskoj formi - dovoljan je jedinstveni identifikator (broj računa), bez potpisa i pečata.",
    "pausalci101.limits.title": "Praćenje limita",
    "pausalci101.limits.p1":
      "Dva su ključna limita: 6 miliona i 8 miliona dinara godišnje. Ako ih pređeš, izlaziš iz sistema paušalnog oporezivanja i moraš preći na drugi režim.",
    "pausalci101.limits.p2":
      "PID27 te na vreme upozorava - vidiš svoj prihod kroz godinu u preglednim grafikama i dobijaš notifikacije kada se približavaš ograničenju.",
    "pausalci101.taxes.title": "Plaćanje poreza i doprinosa",
    "pausalci101.taxes.p1": "Paušalci plaćaju fiksne mesečne iznose za:",
    "pausalci101.taxes.item1": "Porez na prihod od samostalne delatnosti",
    "pausalci101.taxes.item2": "Doprinos za PIO",
    "pausalci101.taxes.item3": "Doprinos za zdravstveno osiguranje",
    "pausalci101.taxes.item4": "Doprinos za nezaposlenost",
    "pausalci101.taxes.p2": "Ove obaveze nisu vezane za ostvareni prihod, već ih određuje poresko rešenje.",
    "pausalci101.taxes.p3":
      "PID27 omogućava da dodaš svoje poresko rešenje, a zatim automatski dobiješ uplatnice sa QR kodovima koje možeš:",
    "pausalci101.taxes.item5": "skenirati m-bank aplikacijom",
    "pausalci101.taxes.item6": "ili odštampati i platiti u banci",
    "pausalci101.taxes.conclusion": "Bez grešaka, bez komplikacija.",
  },
}

// Create the context
type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("sr") // Default to Serbian
  const [isLoading, setIsLoading] = useState(true)

  // With this Supabase implementation:
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase.from("profiles").select("language").eq("id", user.id).single()

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching language preference:", error)
            return
          }

          // Set language to Serbian (sr) if no preference is found or if there's an error
          if (data && data.language) {
            setLanguage(data.language)
          } else {
            // Default to Serbian if no language preference is found
            setLanguage("sr")

            try {
              // Save the default language preference to Supabase
              const { error: updateError } = await supabase.from("profiles").upsert({
                id: user.id,
                language: "sr",
                // Use undefined for other fields to avoid overwriting existing values
                pib: data?.pib,
                taxation_type: data?.taxation_type,
                porez_amount: data?.porez_amount,
                pio_amount: data?.pio_amount,
                zdravstveno_amount: data?.zdravstveno_amount,
                nezaposlenost_amount: data?.nezaposlenost_amount,
                yearly_revenue_limit: data?.yearly_revenue_limit,
              })

              if (updateError) {
                console.error("Error setting default language preference:", updateError)
              }
            } catch (err) {
              console.error("Error updating profile with language preference:", err)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching language preference:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLanguagePreference()
  }, [])

  useEffect(() => {
    const updateLanguagePreference = async () => {
      if (isLoading) return // Skip update during initial loading

      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { error } = await supabase.from("profiles").upsert({ id: user.id, language })

          if (error) {
            console.error("Error updating language preference:", error)
          }
        }
      } catch (error) {
        console.error("Error updating language preference:", error)
      }
    }

    updateLanguagePreference()
  }, [language, isLoading])

  // Translation function
  const t = (key: string) => {
    return translations[language as keyof typeof translations]?.[key as keyof (typeof translations)["en"]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

// Custom hook to use the language context
export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}
