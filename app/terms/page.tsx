import Link from "next/link";

const sections = [
  {
    title: "1. About these Terms",
    paragraphs: [
      "These Terms of Service (the “Terms”) govern your access to and use of TryOnFashion, including our website, digital closet, product discovery pages, virtual try-on tools, account settings, and browser extension (together, the “Service”). By creating an account, accessing, or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
      "TryOnFashion is operated by VITERBI LLC (“TryOnFashion,” “we,” “us,” or “our”).",
    ],
  },
  {
    title: "2. Eligibility and your account",
    paragraphs: [
      "You must be at least 18 years old, or the age of legal majority where you live if higher, to use the Service. The Service is not designed for children. You represent that the information you provide is accurate and that you are authorized to use the account and payment method associated with you.",
      "Sign-in is provided through Clerk and may use a third-party identity provider such as Google. You are responsible for safeguarding your sign-in methods, using the Service through your own account, and promptly notifying us if you suspect unauthorized access. You may not sell, transfer, or share your account or attempt to access another person's account.",
    ],
  },
  {
    title: "3. The Service and product information",
    paragraphs: [
      "The Service lets you browse fashion product information, save selected products to a personal closet, and create AI-generated virtual try-on images using a photo you upload for that request. Features may change, be suspended, or be discontinued. We do not promise uninterrupted availability or that a specific feature, brand, product, or feed will always be available.",
      "Catalog content, including product names, images, prices, availability, and links, is supplied through affiliate-network and advertiser feeds. It may be incomplete, delayed, inaccurate, or changed by the advertiser without notice. The merchant controls the product, its price, inventory, shipping, returns, warranties, and purchase terms. Confirm details on the merchant's website before buying; a product's appearance in TryOnFashion is not an endorsement or guarantee.",
      "Some outbound product links are affiliate or tracked links. If you follow one and make a qualifying purchase, we may receive a commission at no additional cost to you. Purchases are made directly with the merchant and are governed by that merchant's terms and privacy practices, not these Terms.",
    ],
  },
  {
    title: "4. Your content and AI try-on",
    paragraphs: [
      "You retain your rights in photos and other material you submit. You grant us a limited, non-exclusive, worldwide license to receive, process, transmit, and temporarily handle that material only as reasonably necessary to operate, secure, troubleshoot, and provide the feature you requested. This includes sending the try-on photo and selected product images to our AI gateway and image-model provider to generate your result.",
      "Try-on uploads are not saved to a TryOnFashion gallery or account storage by the app. Generated images are returned as temporary previews and are not saved to your account by the current Service. Third-party AI providers process submitted material under their own terms and privacy practices, which may govern their handling or retention; we do not control their systems. Do not upload a photo unless you have the rights and permission needed to use it and to have it processed for the requested generation.",
      "AI-generated images are synthetic previews, may contain errors, and may not accurately represent fit, color, size, fabric, or how a garment will look in real life. They are for inspiration only, not a product guarantee or professional advice. You are responsible for reviewing results before sharing or relying on them.",
    ],
  },
  {
    title: "5. Acceptable use and intellectual property",
    paragraphs: [
      "You may use the Service for lawful, personal fashion discovery and try-on purposes. You must not: (a) violate another person's privacy, publicity, intellectual-property, or other rights; (b) upload content you are not authorized to use; (c) misuse, probe, disrupt, or attempt to gain unauthorized access to the Service, its accounts, data, or systems; (d) scrape, harvest, bulk-download, republish, or commercially exploit catalog or Service content except as permitted by the relevant rights holder and applicable network terms; (e) circumvent security, usage limits, or payment controls; or (f) use the Service for unlawful, deceptive, or harmful activity.",
      "TryOnFashion and its software, design, branding, and original materials are owned by us or our licensors and are protected by applicable laws. Advertiser and merchant names, marks, product photos, descriptions, and catalog data belong to their respective owners. You receive only a limited, revocable, non-transferable right to use the Service as intended; no other rights are transferred to you.",
    ],
  },
  {
    title: "6. Credits, payments, and billing",
    paragraphs: [
      "New accounts currently receive two complimentary credits. A successful virtual try-on image currently uses one credit. Credit amounts, package prices, and feature costs are displayed in the Service and may change prospectively. Credits are for use in TryOnFashion only; they are not money, have no cash value, and may not be transferred or resold. Credits are not currently subject to an automatic expiration date, but they may become unusable if your account is closed or the Service is discontinued, subject to any rights that cannot be limited by law.",
      "Paid credit packages are one-time purchases processed by Stripe Checkout; they are not subscriptions. Stripe collects and processes payment details under its own terms and privacy policy. We do not receive or store your full card number or security code. Your purchase is complete when Stripe confirms payment and credits are added to your account. The billing tab shows purchase details recorded by our system; Stripe is the source for receipts and formal payment records.",
      "If an image-generation request fails after a credit is charged, our current system attempts to return that credit. This is a credit adjustment, not necessarily a refund to your payment method. Refunds, cancellations, and any mandatory consumer rights are governed by applicable law. For a billing question or suspected duplicate charge, contact support@tryonfashion.app and include the transaction date and amount; do not send full card details.",
    ],
  },
  {
    title: "7. Third-party services and links",
    paragraphs: [
      "The Service depends on third parties, which currently include Clerk for authentication, Neon for the application database, Vercel for hosting and the AI gateway, Stripe for payments, CJ for affiliate catalog data and tracking links, Google where used for sign-in, and image-model providers for generation. Product merchants may receive information when you follow their links. These providers and merchants operate under their own terms and privacy policies. We are not responsible for third-party sites, products, services, outages, or practices.",
    ],
  },
  {
    title: "8. Suspension and account deletion",
    paragraphs: [
      "You can request permanent account deletion in Settings. Deletion removes your Clerk sign-in and the associated primary TryOnFashion account, closet, and credit-ledger records, subject to technical completion and the retention described in our Privacy Policy. Stripe and other providers may retain records they are legally required or independently entitled to keep. We may suspend or terminate access when reasonably necessary to protect users, comply with law, address misuse, or maintain the Service.",
    ],
  },
  {
    title: "9. Disclaimers and limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, the Service is provided “as is” and “as available,” without warranties of any kind, express or implied. We do not warrant that product data is accurate, that the Service will be uninterrupted or error-free, or that AI results will meet your expectations. Nothing in these Terms excludes a warranty or consumer right that cannot legally be excluded.",
      "To the fullest extent permitted by law, TryOnFashion and its operator will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, data, goodwill, or business, arising from or related to your use of the Service. To the fullest extent permitted by law, our aggregate liability for claims relating to the Service will not exceed the greater of the amount you paid us for the Service in the 12 months before the event giving rise to the claim or US $50. These limits do not apply where prohibited by law or to liability that cannot legally be limited.",
    ],
  },
  {
    title: "10. Changes and contact",
    paragraphs: [
      "We may update these Terms as the Service or applicable requirements change. We will update the date below when we do. Where required by law, we will provide additional notice or obtain consent. Continued use after an update takes effect means you accept the revised Terms, to the extent permitted by law.",
      "These Terms are governed by the laws of the State of Delaware, United States, without limiting mandatory consumer protections that apply where you live. Any court proceedings will be brought in a court of competent jurisdiction in Delaware, unless applicable law requires otherwise. For support, contact VITERBI LLC at support@tryonfashion.app or 16192 Coastal Highway, Lewes, Delaware.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-4xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 lg:p-14">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">TryOnFashion</Link>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-stone-500">Effective date: November 3, 2026 · Last updated: November 3, 2026</p>
        <p className="mt-6 max-w-3xl text-base leading-7 text-stone-600">Please read these Terms before using TryOnFashion. They explain the service, your responsibilities, affiliate links, AI try-on processing, payments, and important limitations.</p>
        <nav aria-label="Terms sections" className="mt-8 rounded-2xl bg-stone-50 p-5">
          <p className="text-sm font-semibold text-stone-900">On this page</p>
          <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {sections.map((section, index) => <li key={section.title}><a className="text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900" href={`#terms-${index + 1}`}>{section.title}</a></li>)}
          </ol>
        </nav>
        <div className="mt-10 divide-y divide-stone-200">
          {sections.map((section, index) => (
            <section key={section.title} id={`terms-${index + 1}`} className="scroll-mt-8 py-7 first:pt-0 last:pb-0">
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-stone-700">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            </section>
          ))}
        </div>
        <footer className="mt-10 border-t border-stone-200 pt-6 text-sm text-stone-500"><Link href="/privacy" className="font-medium text-stone-700 underline underline-offset-4">Read our Privacy Policy</Link><span className="mx-2">·</span><Link href="/" className="font-medium text-stone-700 underline underline-offset-4">Return to TryOnFashion</Link></footer>
      </article>
    </main>
  );
}
