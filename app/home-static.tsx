import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, CreditCard, Bell, LayoutDashboard, FileText } from "lucide-react"

export function HomeStatic() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-bold text-2xl text-primary">PID27</div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Prijava</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-primary hover:bg-primary/90">Registracija</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 gradient-bg text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Upravljajte poreskim obavezama sa lakoćom
                </h1>
                <p className="mx-auto max-w-[700px] text-white/80 md:text-xl">
                  PID27 pomaže srpskim preduzetnicima da upravljaju i plaćaju obavezne poreze i doprinose na vreme.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Započnite <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Preview Pages</h2>
              <p className="mt-2 text-muted-foreground">Access preview pages without login</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              <Link href="/preview/dashboard">
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Dashboard Preview</h3>
                    <p className="text-muted-foreground">View the dashboard with mock data</p>
                  </div>
                </div>
              </Link>
              <Link href="/preview/invoice">
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Invoice Preview</h3>
                    <p className="text-muted-foreground">Try the invoice generator</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Pojednostavite upravljanje porezima</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                PID27 pruža sve alate potrebne za efikasno upravljanje poreskim obavezama.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white rounded-xl p-6 shadow-md card-hover border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pratite obaveze plaćanja</h3>
                <p className="text-muted-foreground">
                  Lako pratite sve vaše poreske obaveze i doprinose na jednom mestu.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md card-hover border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Nikad ne propustite rok</h3>
                <p className="text-muted-foreground">
                  Dobijajte pravovremene podsetnike pre rokova plaćanja kako biste izbegli kamate.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md card-hover border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Jednostavan proces plaćanja</h3>
                <p className="text-muted-foreground">
                  Generišite QR kodove za plaćanje trenutno za brza i bezgrešna plaćanja.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Spremni da pojednostavite upravljanje porezima?</h2>
                <p className="text-lg text-muted-foreground">
                  Pridružite se hiljadama srpskih preduzetnika koji koriste PID27 za efikasno upravljanje poreskim
                  obavezama.
                </p>
                <Link href="/auth/register">
                  <Button size="lg" className="mt-4">
                    Započnite
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
              &copy; {new Date().getFullYear()} PID27. Sva prava zadržana.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
