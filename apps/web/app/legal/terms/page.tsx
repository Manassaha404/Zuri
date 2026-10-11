"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, Sparkles } from "lucide-react";

const sections = [
  {
    title: "1. About Friday",
    paragraphs: [
      "Friday is a workspace designed to help students organize notes, plans, habits, goals, and related study activities. These Terms of Service govern your access to and use of the Friday website and its features.",
      "In these terms, “Friday,” “we,” “our,” and “us” refer to the team operating this service. “You” means anyone who accesses or uses Friday.",
    ],
  },
  {
    title: "2. Eligibility and your account",
    paragraphs: [
      "You must be legally able to agree to these terms in your location. If you are under the age at which you can consent to online services, use Friday only with the involvement and permission of a parent or legal guardian where required.",
      "Provide accurate information when creating an account, keep your sign-in credentials secure, and tell us promptly if you believe someone has accessed your account without permission. You are responsible for activity carried out through your account, except where applicable law says otherwise.",
    ],
  },
  {
    title: "3. Acceptable use",
    paragraphs: [
      "Use Friday lawfully and respectfully. Do not attempt to disrupt or compromise the service, access another person’s account or data without permission, upload malicious code, abuse other users, or use the service to violate another person’s rights.",
      "Do not use Friday to store or share content that is unlawful, fraudulent, threatening, or otherwise prohibited by applicable law. We may investigate suspected misuse and take reasonable action where appropriate.",
    ],
  },
  {
    title: "4. Your content",
    paragraphs: [
      "You retain rights you already have in the notes, plans, files, and other content you submit to Friday. You give us permission to host, process, reproduce, and display that content only as reasonably necessary to operate, maintain, secure, and provide the service to you.",
      "You are responsible for ensuring that you have the rights needed to submit your content. Keep your own backup of anything important; do not treat Friday as your only copy of important work.",
    ],
  },
  {
    title: "5. Features and availability",
    paragraphs: [
      "We may add, change, suspend, or discontinue features as the product develops. We will make reasonable efforts to keep Friday available, but we cannot promise uninterrupted or error-free access. Maintenance, technical failures, or circumstances outside our control may affect availability.",
      "If Friday includes AI-generated suggestions or summaries, those outputs may be incomplete or inaccurate. Review them before relying on them, especially for important academic, financial, health, or other consequential decisions.",
    ],
  },
  {
    title: "6. Third-party services",
    paragraphs: [
      "Some features may rely on third-party providers, such as hosting, authentication, analytics, or AI services. Those providers may have their own terms and privacy practices. We will describe relevant practices in our Privacy Policy where applicable.",
    ],
  },
  {
    title: "7. Suspension and account deletion",
    paragraphs: [
      "You may stop using Friday at any time. If account deletion is available, you can use the controls provided in the product or contact us using the contact details published by the service.",
      "We may restrict or suspend access where reasonably necessary to protect the service or users, address a security issue, comply with law, or respond to a material breach of these terms. We will handle such actions in accordance with applicable law.",
    ],
  },
  {
    title: "8. Disclaimers and liability",
    paragraphs: [
      "To the extent permitted by law, Friday is provided on an “as is” and “as available” basis, without guarantees that it will meet every requirement or always be available. Nothing in these terms excludes rights or remedies that cannot legally be excluded.",
      "To the extent permitted by applicable law, we are not responsible for indirect or consequential losses arising from use of the service. Any liability that cannot be excluded by law remains unaffected.",
    ],
  },
  {
    title: "9. Changes to these terms",
    paragraphs: [
      "We may update these terms as Friday changes or for legal, security, or operational reasons. We will update the date below when we revise them. If a change is material, we will take reasonable steps to notify users where required.",
      "Continuing to use Friday after revised terms take effect means you accept the revised terms, to the extent permitted by applicable law. If you do not agree, stop using the service.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      "Questions about these terms? Contact the Friday team using the support or contact details published on the official Friday website. Add a monitored support email before publishing this page.",
    ],
  },
];

export default function TermsPage() {
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
          <span className="text-[10px] font-black tracking-[0.12em] sm:text-xs">THE GROUND RULES</span>
        </div>

        <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.065em] sm:text-7xl">
          TERMS OF<br /><span className="bg-[#FFE500] px-2">SERVICE.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
          A few ground rules to help keep Friday useful, safe, and fair for everyone.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2"><FileText size={15} /> Terms and conditions</span>
          <span className="border-2 border-black bg-[#FFF0A8] px-3 py-2">Last updated: October 11, 2026</span>
        </div>

        <div className="mt-10 border-[3px] border-black bg-white p-5 shadow-[7px_7px_0_#111] sm:p-9 sm:shadow-[10px_10px_0_#111]">
          <p className="mb-8 border-l-4 border-[#FFE500] pl-4 text-sm leading-7 text-zinc-700">
            Please read these Terms of Service before using Friday. They are a general product template and should be reviewed and adapted to your actual features, business, and applicable laws before launch.
          </p>

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
            <p className="text-sm font-bold">Ready to build your workspace?</p>
            <Link href="/signup" className="mt-4 inline-flex items-center gap-2 border-2 border-black bg-[#FFE500] px-5 py-3 text-sm font-black shadow-[4px_4px_0_#111] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
              Create your account <ArrowUpRight size={17} />
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
