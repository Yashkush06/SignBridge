"use client";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { DemoPreview } from "@/components/landing/demo-preview";
import { AccessibilitySection } from "@/components/landing/accessibility";
import { Testimonials } from "@/components/landing/testimonials";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] selection:bg-brand-500/30 font-sans">
      {/* Navigation */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Features Section */}
        <Features />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Demo Preview Section */}
        <DemoPreview />

        {/* Accessibility Section */}
        <AccessibilitySection />

        {/* Testimonials Section */}
        <Testimonials />

        {/* FAQ Section */}
        <section id="faq" className="py-24 px-4 sm:px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
              Frequently Asked Questions
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger className="text-base font-semibold text-[var(--fg)]">
                What sign languages do you support?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--fg-secondary)] leading-relaxed">
                Currently, we support American Sign Language (ASL). Our models are trained on both the ASL alphabet for fingerspelling and a growing vocabulary of common conversational signs. We plan to add BSL (British Sign Language) later this year.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger className="text-base font-semibold text-[var(--fg)]">
                Do I need a special camera?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--fg-secondary)] leading-relaxed">
                No. SignBridge works with any standard webcam built into your laptop, tablet, or smartphone. Our machine learning models are optimized to run directly in your browser without requiring depth sensors or expensive hardware.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger className="text-base font-semibold text-[var(--fg)]">
                Is my data private?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--fg-secondary)] leading-relaxed">
                Yes. All video processing happens locally on your device within your browser. Video feeds are never sent to our servers. Only the text transcripts are saved if you have history enabled, and you can delete these at any time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--bg-elevated)] border-t border-[var(--border)] pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-[var(--fg-secondary)] text-sm max-w-xs leading-relaxed">
              Making communication accessible for everyone through advanced, browser-based AI translation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[var(--fg)]">Product</h4>
            <ul className="space-y-2 text-sm text-[var(--fg-secondary)]">
              <li>
                <Link href="#features" className="hover:text-brand-500 transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[var(--fg)]">Resources</h4>
            <ul className="space-y-2 text-sm text-[var(--fg-secondary)]">
              <li><a href="#" className="hover:text-brand-500 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[var(--fg)]">Legal</h4>
            <ul className="space-y-2 text-sm text-[var(--fg-secondary)]">
              <li><a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--fg-tertiary)]">
          <p>© {new Date().getFullYear()} SignBridge AI, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
