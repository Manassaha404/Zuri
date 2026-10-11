"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

const sections = [
  {
    title: "1. About this policy",
    paragraphs: [
      "This Privacy Policy explains how Friday handles information when you visit or use our student workspace. It should be read together with our Terms of Service.",
      "This is a starting-point policy. Before publishing it, update it to reflect the data Friday actually collects, the services you use, your retention practices, and the laws that apply to your operation.",
    ],
  },
  {
    title: "2. Information you provide",
    paragraphs: [
      "Depending on the features you use, we may collect information such as your name, email address, account credentials, profile preferences, notes, plans, tasks, habits, and other content you choose to save.",
      "Please avoid submitting sensitive personal information unless a feature specifically requires it and you understand how it will be handled.",
    ],
  },
  {
    title: "3. Information collected automatically",
    paragraphs: [
      "When you use Friday, our hosting or security infrastructure may process technical information such as your IP address, browser type, device information, access times, and diagnostic logs. Whether analytics or cookies are used depends on the tools enabled in the deployed app.",
      "Update this section to identify any analytics, advertising, session replay, or tracking tools you actually use, and explain the choices available to users.",
    ],
  },
  {
    title: "4. How we use information",
    paragraphs: [
      "We may use information to create and maintain your account, provide workspace features, save your content, respond to support requests, protect the service, troubleshoot errors, prevent abuse, and comply with legal obligations.",
      "If you enable AI features, relevant text or files may be sent to the AI provider configured for that feature to generate a response. Describe the provider, the information shared, and its retention or training practices accurately before launch.",
    ],
  },
  {
    title: "5. Cookies and similar technologies",
    paragraphs: [
      "Friday or its service providers may use essential cookies or similar technologies to keep you signed in, protect accounts, and remember necessary settings. Optional analytics or other non-essential technologies should be disclosed and used according to applicable consent requirements.",
      "You can manage cookies through your browser settings, though blocking essential cookies may prevent some features from working.",
    ],
  },
  {
    title: "6. When information is shared",
    paragraphs: [
      "We do not describe your workspace content as public unless you choose to share it through a feature that makes it public. We may share information with service providers that help us host, secure, operate, or support Friday, subject to appropriate arrangements.",
      "We may also disclose information when required by law, to address security or fraud concerns, to protect rights and safety, or in connection with a business transfer where legally permitted. We do not sell personal information as part of the intended service model; confirm this statement matches your actual practices before publishing.",
    ],
  },
  {
    title: "7. Storage and security",
    paragraphs: [
      "We use reasonable technical and organizational measures intended to protect information. No online service or method of transmission can be guaranteed to be completely secure.",
      "Your information may be processed or stored in countries where we or our providers operate. Document your actual hosting region, providers, and cross-border transfer safeguards where required by law.",
    ],
  },
  {
    title: "8. Retention and deletion",
    paragraphs: [
      "We keep information for as long as needed to provide Friday, maintain your account, resolve disputes, enforce our agreements, and meet legal or security requirements. Actual retention periods vary by data type and purpose.",
      "If you want to request access, correction, export, or deletion of your information, use the account controls if available or contact the service using its published support details. Some information may need to be retained where the law permits or requires it.",
    ],
  },
  {
    title: "9. Your choices and rights",
    paragraphs: [
      "Depending on where you live, you may have rights to request access to, correction of, deletion of, or a copy of your personal information, to object to certain processing, or to withdraw consent where processing relies on consent.",
      "Contact us to make a privacy request. We may need to verify your identity and will respond in accordance with applicable law. If you are in India, review the obligations that apply under the Digital Personal Data Protection Act, 2023 and rules or notifications in force at the time of launch.",
    ],
  },
  {
    title: "10. Children’s privacy",
    paragraphs: [
      "Friday is designed as a student workspace, but it is not intended to bypass age-related consent requirements. If your service is available to children, implement the safeguards and parental-consent processes required by applicable law.",
      "If you believe a child has provided personal information inappropriately, contact us so we can review the situation.",
    ],
  },
  {
    title: "11. Third-party links and services",
    paragraphs: [
      "Friday may link to third-party websites or use third-party integrations. Their privacy practices are governed by their own policies, and we encourage you to review those policies before providing information to them.",
    ],
  },
  {
    title: "12. Changes and contact",
    paragraphs: [
      "We may update this policy as the service changes. We will update the date below and provide notice of material changes where required.",
      "For privacy questions or requests, contact the Friday team using the support email or contact details published on the official website. Add a monitored contact address before launch.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F4EC] text-[#111] selection:bg-[#FFE500]">
      <div className="pointer-events-none absolute -left-16 top-40 h-56 w-56 rotate-12 border-[3px] border-black bg-[#DCE8D5] opacity-60" />
      <div className="pointer-events-none absolute -right-20 top-[34rem] h-64 w-64 -rotate-12 border-[3px] border-black bg-[#DED8F5] opacity-60" />

      <header className="relative z-10 border-b-2 border-black">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center border-2 border-black bg-[#FFE500] text-xl font-black shadow-[3px_3px_0_#111]">F</span>
            <span className="text-xl font-black tracking-tight">FRIDAY<span className="text-[#B69D00]">.</span></span>
          </Link>
          <Link href="/signup" className="inline-flex items-center gap-2 text-xs font-black transition-transform hover:-translate-x-1 sm:text-sm">
            <ArrowLeft size={16} /> Back to sign up
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_#111]">
          <Sparkles size={15} />
          <span className="text-[10px] font-black tracking-[0.12em] sm:text-xs">YOUR DATA. YOUR TRUST.</span>
        </div>

        <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.065em] sm:text-7xl">
          PRIVACY<br /><span className="bg-[#FFE500] px-2">POLICY.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
          Here’s what information Friday may handle, why it’s used, and the choices you have.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2"><ShieldCheck size={15} /> Privacy and data</span>
          <span className="border-2 border-black bg-[#FFF0A8] px-3 py-2">Last updated: October 11, 2026</span>
        </div>

        <div className="mt-10 border-[3px] border-black bg-white p-5 shadow-[7px_7px_0_#111] sm:p-9 sm:shadow-[10px_10px_0_#111]">
          <div className="mb-8 flex gap-3 border-2 border-black bg-[#DCE8D5] p-4">
            <LockKeyhole size={21} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6">
              We aim to treat your information carefully and use it to provide the workspace. The details below must be checked against the actual app configuration before this policy is published.
            </p>
          </div>

          <div className="space-y-9">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-zinc-600">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 border-t-2 border-black pt-6">
            <p className="text-sm font-bold">Questions about your privacy?</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Add your official support email or contact page here before making Friday available to users.
            </p>
            <Link href="/signup" className="mt-4 inline-flex items-center gap-2 border-2 border-black bg-[#FFE500] px-5 py-3 text-sm font-black shadow-[4px_4px_0_#111] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
              Back to sign up <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        <footer className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-bold text-zinc-600">
          <Link href="/legal/terms" className="underline underline-offset-4">Terms of Service</Link>
          <Link href="/legal/privacy" className="underline underline-offset-4">Privacy Policy</Link>
          <Link href="/" className="underline underline-offset-4">Home</Link>
        </footer>
      </section>
    </main>
  );
}
