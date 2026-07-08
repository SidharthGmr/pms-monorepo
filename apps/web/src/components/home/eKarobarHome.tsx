'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Menu,
  Percent,
  Play,
  ShieldCheck,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function EKarobarHome() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Coins className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              eKarobar<span className="text-emerald-600">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="#" className="transition-colors hover:text-emerald-600">Product</Link>
            <Link href="#" className="transition-colors hover:text-emerald-600">Solutions</Link>
            <Link href="#" className="transition-colors hover:text-emerald-600">Resources</Link>
            <Link href="#" className="transition-colors hover:text-emerald-600">Pricing</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold text-slate-700 hover:text-emerald-600">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-lg shadow-emerald-600/20">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Sheet Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Coins className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">eKarobar.</span>
                  </div>
                  <div className="flex flex-col gap-4 text-lg font-medium text-slate-600">
                    <Link href="#" className="hover:text-emerald-600 transition-colors">Product</Link>
                    <Link href="#" className="hover:text-emerald-600 transition-colors">Solutions</Link>
                    <Link href="#" className="hover:text-emerald-600 transition-colors">Resources</Link>
                    <Link href="#" className="hover:text-emerald-600 transition-colors">Pricing</Link>
                  </div>
                  <div className="flex flex-col gap-4 mt-auto">
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full border-slate-200 text-slate-700">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/login" className="w-full">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-24 md:py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Trusted by 10,000+ businesses
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Manage Your Business <br />
                <span className="text-emerald-600 relative inline-block">
                  Anytime, Anywhere
                  <span className="absolute bottom-1 left-0 w-full h-[6px] bg-emerald-100 -z-10 rounded-full" />
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                The simplest way to track your invoices, payments, expenses, and taxes. Empower your teams and speed up your growth with our automated financial dashboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/login">
                  <Button className="w-full sm:w-auto h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-xl shadow-emerald-600/35 transition-all hover:scale-[1.02]">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-slate-200 text-slate-700 font-semibold hover:bg-slate-100">
                  <Play className="mr-2 h-5 w-5 text-emerald-600 fill-emerald-600" />
                  Watch Demo
                </Button>
              </div>

              {/* Quick stats banner */}
              <div className="pt-6 border-t border-slate-100 flex items-center gap-8">
                <div>
                  <div className="text-2xl font-bold text-slate-900">99.8%</div>
                  <div className="text-sm text-slate-500">Uptime SLA</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">24/7</div>
                  <div className="text-sm text-slate-500">Live Support</div>
                </div>
              </div>
            </div>

            {/* Right Graphic/Avatar Mockup */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px] aspect-square">
                {/* Background decorative green gradient circles */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-full -z-10 scale-[1.05]" />
                <div className="absolute inset-0 bg-emerald-600/10 rounded-full -z-10 scale-[1.15] blur-xl" />

                {/* Main Illustration mockup */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Visual placeholder representing the happy owner */}
                  <div className="relative w-[90%] h-[90%] rounded-full overflow-hidden border-8 border-white bg-slate-100 shadow-2xl flex items-end justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600"
                      alt="Business Owner"
                      className="object-cover w-full h-[95%] scale-[1.1] origin-bottom object-top"
                    />
                  </div>
                </div>

                {/* Floating Card 1 */}
                <div className="absolute top-[10%] -left-[5%] bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Total Income</div>
                    <div className="text-sm font-bold text-slate-900">$45,850.00</div>
                  </div>
                </div>

                {/* Floating Card 2 */}
                <div className="absolute bottom-[10%] -right-[5%] bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '5s' }}>
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Invoices Sent</div>
                    <div className="text-sm font-bold text-slate-900">12 Pending</div>
                  </div>
                </div>

                {/* Tiny Badge */}
                <div className="absolute top-[50%] -right-[10%] bg-emerald-500 text-white py-1 px-3 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20">
                  ★ Active Status
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Trust Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Over 10,000+ businesses trust us
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 opacity-55">
            <span className="text-2xl font-black text-slate-800 tracking-tight">STRIPE</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">SHOPIFY</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">FIGMA</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">VERCEL</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">SLACK</span>
          </div>
        </div>
      </section>

      {/* 4. Categories Row */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: 'Invoicing', icon: FileText, color: 'bg-emerald-500' },
              { label: 'Accounting', icon: Calculator, color: 'bg-orange-500' },
              { label: 'Tax Prep', icon: Percent, color: 'bg-indigo-500' },
              { label: 'Payroll', icon: Users, color: 'bg-blue-500' },
              { label: 'Receipts', icon: Camera, color: 'bg-pink-500' },
              { label: 'Payments', icon: CreditCard, color: 'bg-teal-500' },
              { label: 'Reports', icon: TrendingUp, color: 'bg-purple-500' },
              { label: 'Audits', icon: ShieldCheck, color: 'bg-red-500' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className={`h-12 w-12 rounded-xl ${item.color} text-white flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-md`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Ledger / Split Feature Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Efficiency</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              The simplest way to manage your business
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Wave goodbye to dusty ledger books and messy spreadsheets. eKarobar automatically tracks and connects everything on a single dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Visual Ledger + Phone mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[480px] bg-slate-100 rounded-3xl p-8 border border-slate-200/60 shadow-inner flex flex-col md:flex-row items-center gap-6">

                {/* Vintage Ledger Card */}
                <div className="w-full md:w-1/2 bg-amber-50/70 border border-amber-100 rounded-2xl p-4 shadow-md font-serif text-amber-900 text-xs">
                  <div className="border-b border-amber-200 pb-2 mb-3 font-bold text-center uppercase tracking-wider text-[10px]">
                    Ledger Account Book
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-amber-100 pb-1">
                      <span>June 12 - Supplies</span>
                      <span className="font-bold">$124.50</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-1">
                      <span>June 14 - Rent</span>
                      <span className="font-bold text-red-600">$1,200.00</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-1">
                      <span>June 15 - Cash sale</span>
                      <span className="font-bold text-emerald-700">+$840.00</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-1">
                      <span>June 18 - Web Hosting</span>
                      <span className="font-bold">$45.00</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-dashed border-amber-300 flex justify-between font-bold">
                    <span>Balance</span>
                    <span>-$529.50</span>
                  </div>
                </div>

                {/* Plus pointer / arrow */}
                <div className="hidden md:flex h-10 w-10 rounded-full bg-emerald-600 text-white items-center justify-center shadow-lg shadow-emerald-600/30 font-bold shrink-0">
                  →
                </div>

                {/* Modern Smartphone Mockup view */}
                <div className="w-full md:w-1/2 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 text-[11px] font-sans">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-xs text-slate-200">eKarobar Dashboard</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-2.5 mb-3 text-emerald-400 font-bold text-xs">
                    Net cashflow: +$14,240.00
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                      <span>Stripe Checkout</span>
                      <span className="text-emerald-400 font-semibold">+$2,450.00</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                      <span>Shopify Payout</span>
                      <span className="text-emerald-400 font-semibold">+$6,180.00</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                      <span>Office Rent</span>
                      <span className="text-slate-400 font-semibold">-$1,200.00</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right side pillars info */}
            <div className="lg:col-span-6 space-y-6">
              {[
                { title: 'Expenses & Receipts', desc: 'Auto-scan invoices and store receipts securely. No manual typing needed.', badgeColor: 'bg-emerald-100 text-emerald-800' },
                { title: 'Instant Invoicing', desc: 'Create and send customized invoices. Get paid instantly online via card or ACH.', badgeColor: 'bg-orange-100 text-orange-800' },
                { title: 'Financial Analytics', desc: 'Generate visual profit and loss statements, cashflow graphs, and tax forms.', badgeColor: 'bg-indigo-100 text-indigo-800' },
                { title: 'Tax Integration', desc: 'Keep records organized by tax category to streamline your quarterly filings.', badgeColor: 'bg-blue-100 text-blue-800' },
              ].map((pillar, idx) => (
                <div key={idx} className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex-shrink-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{pillar.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 6. All in One Business App - Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              All in One Business App
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Everything you need to automate your billing, balance your books, and grow your client base.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Invoice & Billing', desc: 'Send beautiful invoices with custom colors and logo. Get online payouts.', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
              { title: 'Expense Tracking', desc: 'Automate tracking by connecting your business cards and checking accounts.', icon: Calculator, color: 'text-orange-600 bg-orange-50' },
              { title: 'Tax Management', desc: 'Easily calculate quarterly taxes, deductions, write-offs, and file returns.', icon: Percent, color: 'text-indigo-600 bg-indigo-50' },
              { title: 'Financial Reports', desc: 'Generate customized balance sheets, cashflow reports, and visual graphs.', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
              { title: 'Cash Flow Control', desc: 'Visualize your runway and know exactly how much cash is on hand.', icon: Coins, color: 'text-teal-600 bg-teal-50' },
              { title: 'Receipt Scanner', desc: 'Take a photo of any receipt, extract invoice data, and save details.', icon: Camera, color: 'text-pink-600 bg-pink-50' },
              { title: 'Online Payments', desc: 'Collect payments through credit card, bank transfers, and apple pay.', icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
              { title: 'Team Collaboration', desc: 'Invite your co-founders, staff, or accountant to manage records together.', icon: Users, color: 'text-rose-600 bg-rose-50' },
            ].map((feature, idx) => (
              <Card key={idx} className="bg-white border-slate-100 hover:border-emerald-500/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-2`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-sm leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Hear from Our Trusted Business Owners
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              See how business leaders are using eKarobar to eliminate admin tasks and focus on their true growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'Coffee Shop Owner', text: 'eKarobar has completely transformed how I manage my daily sales. Highly recommended for any small retail storefront!', rating: 5, avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=120' },
              { name: 'John Carter', role: 'Freelance Designer', text: 'The invoicing system is super fast. I get paid 3x quicker than before! The automatic reminders do the chasing for me.', rating: 5, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120' },
              { name: 'Elena Rostova', role: 'E-commerce Founder', text: 'Tax compliance used to give me nightmares. Now it is just a click away. Exporting my profit & loss is incredibly simple.', rating: 5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120' },
              { name: 'Michael Chang', role: 'Agency Director', text: 'Best financial tool we have ever used. The dashboard layout is clean, fast, and gives me an overview of our cash flow instantly.', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
              { name: 'Sophia Martinez', role: 'Consultant', text: 'Cash flow control has helped us expand to our second office location by giving us reliable financial forecasting.', rating: 5, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
              { name: 'David Patel', role: 'Retail Owner', text: 'The receipt scanner saves me hours of manual data entry every single week. I just snap a photo on my phone and I am done.', rating: 5, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
              { name: 'Lisa Wong', role: 'Tech Startup CEO', text: 'Seamless team integration. My accountant loves this app. We spend half the time doing monthly bookkeeping updates now.', rating: 5, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120' },
              { name: 'James O\'Connor', role: 'Restaurant Manager', text: 'No more lost receipts. Everything is organized in one central place. The UI is simple enough for everyone on staff.', rating: 5, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120' },
              { name: 'Emily Taylor', role: 'Fitness Coach', text: 'User interface is incredibly simple and clean. Extremely easy to use even if you have zero accounting background.', rating: 5, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120' },
            ].map((testimonial, idx) => (
              <Card key={idx} className="bg-slate-50/50 border-slate-100 hover:border-emerald-500/20 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <CardHeader className="pb-2">
                  <div className="flex gap-1 mb-2 text-amber-500">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 stroke-none" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pb-6 flex-1">
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex items-center gap-3 border-t border-slate-100/50 mt-auto pt-4">
                  <Avatar className="h-10 w-10 border border-emerald-100">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{testimonial.name}</div>
                    <div className="text-xs text-emerald-600 font-medium">{testimonial.role}</div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQs Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Help Center</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions (FAQs)
            </h2>
            <p className="text-base text-slate-600">
              Have questions about how eKarobar works? Find quick answers right here.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-md space-y-2">
            {[
              { q: 'Is there a free trial available?', a: 'Yes! We offer a 14-day free trial with access to all standard features. No credit card is required to sign up.' },
              { q: 'How secure is my financial data?', a: 'We prioritize your security. Your connection is encrypted using SSL, and all data stored is protected with 256-bit AES database encryption. We never store credit card credentials.' },
              { q: 'Can I invite my accountant to my account?', a: 'Absolutely. You can add your accountant, business partner, or bookkeeper with custom view/edit permissions at no extra charge.' },
              { q: 'Can I export my financial reports?', a: 'Yes. All profit and loss statements, invoices, and expense sheets can be instantly exported to CSV, Excel, or PDF formats.' },
              { q: 'Does it support multiple currencies?', a: 'Yes, eKarobar supports over 100+ global currencies, allowing you to invoice clients internationally and record correct local tax equivalents.' }
            ].map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-slate-100 last:border-0 pb-2">
                <AccordionTrigger className="text-base md:text-lg font-bold text-slate-800 hover:text-emerald-600 hover:no-underline transition-colors py-4 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-sm md:text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 9. Featured Blogs */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Insights</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Featured Blog Posts
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Stay updated with our latest expert tips on finance management, taxes, and software reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'How to Manage Cashflow for Startups',
                desc: 'Learn the primary tactics startup founders use to keep cashflow positive and track monthly runway.',
                tag: 'Finance',
                date: 'June 25, 2026',
                img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
                time: '5 min read'
              },
              {
                title: 'Top Tax Write-offs for Remote Teams',
                desc: 'Find out if you are overpaying taxes. See the top 10 remote working tax deductions you can claim.',
                tag: 'Taxes',
                date: 'June 20, 2026',
                img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
                time: '7 min read'
              },
              {
                title: 'Automating Invoices with eKarobar Tools',
                desc: 'A step-by-step walkthrough on how to set up recurring billing cycles and automated reminders.',
                tag: 'Productivity',
                date: 'June 18, 2026',
                img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
                time: '4 min read'
              }
            ].map((blog, idx) => (
              <Card key={idx} className="overflow-hidden border-slate-100 hover:border-emerald-500/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={blog.img}
                    alt={blog.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-emerald-600 text-white font-semibold">
                    {blog.tag}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {blog.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {blog.time}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {blog.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <CardDescription className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                    {blog.desc}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0 border-t border-slate-100/50 mt-auto pt-4 flex justify-between items-center text-emerald-600 text-sm font-semibold group-hover:underline cursor-pointer">
                  <span>Read Article</span>
                  <ArrowUpRight className="h-4 w-4" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Call to Action (CTA) Banner */}
      <section className="py-20 bg-emerald-900 text-white overflow-hidden relative">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-800/40 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Texts */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Start Using eKarobar Today
              </h2>
              <p className="text-emerald-100 text-lg leading-relaxed max-w-xl">
                Ready to take control of your financial flow? Sign up now and join thousands of business leaders. Simple setup in 2 minutes.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/login">
                  <Button className="h-14 px-8 text-base bg-white hover:bg-slate-100 font-bold text-emerald-900 shadow-xl transition-all hover:scale-[1.02]">
                    Get Started Free
                  </Button>
                </Link>
                <Button variant="outline" className="h-14 px-8 text-base border-emerald-700/60 bg-transparent hover:bg-emerald-805 text-white font-bold">
                  Schedule Demo
                </Button>
              </div>

              {/* App store links */}
              <div className="pt-6 flex gap-4">
                <div className="cursor-pointer bg-slate-900/60 border border-slate-800 hover:bg-slate-900/80 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🍏</span>
                  <div className="text-[10px] text-left">
                    <span className="block text-slate-400">Download on the</span>
                    <span className="block text-xs font-bold font-sans">App Store</span>
                  </div>
                </div>
                <div className="cursor-pointer bg-slate-900/60 border border-slate-800 hover:bg-slate-900/80 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div className="text-[10px] text-left">
                    <span className="block text-slate-400">Get it on</span>
                    <span className="block text-xs font-bold font-sans">Google Play</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mockup Mobile App Preview */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[320px] aspect-[9/16] bg-slate-900 border-[6px] border-slate-800 rounded-[36px] shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 flex justify-center items-center">
                  <div className="h-2 w-16 bg-slate-800 rounded-full" />
                </div>
                <div className="pt-6 p-4 h-full bg-slate-950 text-white text-[10px] flex flex-col gap-3 font-sans">
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>eKarobar Mobile</span>
                    <span>10:30 AM</span>
                  </div>
                  <div className="bg-emerald-600 p-3 rounded-xl">
                    <div className="text-slate-200">Balance Forecast</div>
                    <div className="text-base font-bold">$124,500.00</div>
                    <div className="text-[8px] text-emerald-100 mt-2">↑ 12% increase this month</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-300">Quick Actions</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-slate-400">
                      <div className="bg-slate-900 p-2 rounded-lg">Invoice</div>
                      <div className="bg-slate-900 p-2 rounded-lg">Scan</div>
                      <div className="bg-slate-900 p-2 rounded-lg">Pay</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    <div className="font-bold text-slate-300">Recent Transactions</div>
                    <div className="space-y-1">
                      {[
                        { title: 'Acme Corp Payout', amount: '+$1,450.00', status: 'Completed' },
                        { title: 'Figma Subscription', amount: '-$45.00', status: 'Pending' },
                        { title: 'Shopify Store Payout', amount: '+$4,580.00', status: 'Completed' },
                        { title: 'WeWork Office Rent', amount: '-$800.00', status: 'Completed' }
                      ].map((t, i) => (
                        <div key={i} className="bg-slate-900 p-2 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-slate-300">{t.title}</div>
                            <div className="text-[8px] text-slate-500">{t.status}</div>
                          </div>
                          <div className={t.amount.startsWith('+') ? 'text-emerald-400 font-bold' : 'text-slate-400 font-semibold'}>{t.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">

            {/* Left Logo and bio */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-md">
                  <Coins className="h-4 w-4" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">eKarobar.</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                eKarobar simplifies business finances, invoices, and accounting tasks so you can focus on building what you love.
              </p>
              <div className="flex gap-4 text-slate-500 pt-2">
                {/* Mock Social Icons */}
                <span className="hover:text-emerald-500 cursor-pointer">𝕏</span>
                <span className="hover:text-emerald-500 cursor-pointer">🇫</span>
                <span className="hover:text-emerald-500 cursor-pointer">🇮</span>
                <span className="hover:text-emerald-500 cursor-pointer">🇱</span>
              </div>
            </div>

            {/* Links Columns */}
            {[
              {
                title: 'Product',
                links: ['Features', 'Invoicing', 'Expense Tracker', 'Pricing']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Partners', 'Contact']
              },
              {
                title: 'Resources',
                links: ['Blog', 'Help Center']
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Use']
              }
            ].map((col, idx) => (
              <div key={idx} className="md:col-span-2 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-sm">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <Link href="#" className="hover:text-white transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} eKarobar Inc. All rights reserved.</p>
            <p>Designed and built for small businesses worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
