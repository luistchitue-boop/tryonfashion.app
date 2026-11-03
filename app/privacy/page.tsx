import Link from "next/link";

const sections = [
  {
    title: "1. Who we are and scope",
    paragraphs: [
      "This Privacy Policy explains how VITERBI LLC (“TryOnFashion,” “we,” “us,” or “our”) collects, uses, discloses, and safeguards information when you use our website, digital closet, product discovery service, virtual try-on feature, and browser extension (the “Service”). VITERBI LLC is the operator of TryOnFashion.",
      "This policy describes our practices, not the independent practices of merchants, affiliate networks, identity providers, payment processors, hosting providers, or AI providers. Their own privacy notices apply to their services.",
    ],
  },
  {
    title: "2. Information we collect",
    paragraphs: [
      "Account and sign-in information. When you sign in through Clerk (including a Google sign-in connection where enabled), we receive and maintain identifiers needed to authenticate you, such as your Clerk user ID, display name, email address, and profile image where available. We store an internal account record to associate your closet and credit balance with your sign-in.",
      "Closet and product information. When you save a catalog product or submit a product through our browser extension, we store the information needed to show it in your closet: product name, brand, product and image URLs, source/merchant name, and optional price and currency. This information may identify your fashion interests. The extension extracts product details only after you invoke it on a page and gives you a chance to review or edit the details before saving; it is not designed to crawl pages in the background.",
      "Try-on information. For each try-on request, you may upload one JPEG, PNG, WebP, or AVIF photo up to 4 MB and select up to four saved clothing items. The photo is processed for that request and is not saved to a TryOnFashion gallery or account database. The generated result is returned as a temporary preview and is not saved to your account by the current Service. Your photo and the selected product images are sent to our AI gateway and image-model provider to perform the generation; see “AI processing” below.",
      "Credit and payment information. We store your credit balance and ledger entries, such as credit purchases, usage, and refunds. For new paid purchases, the ledger includes the credit package, amount, currency, and date. Checkout is handled by Stripe. We do not receive or store your full payment-card number or security code; Stripe processes payment credentials and provides us with payment and checkout status and limited transaction details.",
      "Technical and preference information. Our hosting, authentication, and security providers may process connection and diagnostic data such as IP address, browser/device information, request time, and security events in their service logs. The website stores your light/dark theme preference in your browser's local storage. Clerk may use cookies or similar technologies for sign-in and session security.",
    ],
  },
  {
    title: "3. How we use information",
    paragraphs: [
      "We use information to authenticate users; provide and maintain your account, closet, and credits; retrieve and display catalog products; create requested try-on images; process credit purchases and refunds; prevent fraud, abuse, and unauthorized access; troubleshoot errors; respond to support requests; maintain financial and operational records; and comply with legal obligations.",
      "We do not use your try-on photo to create a persistent user gallery, train our own AI models, or display the photo to other TryOnFashion users. The AI gateway and model provider receive the image to fulfill the generation request and may process it under their own contractual terms and privacy practices. We cannot promise their retention or training practices; review the providers' current terms and notices before uploading sensitive images.",
    ],
  },
  {
    title: "4. Catalogs, advertisers, and affiliate links",
    paragraphs: [
      "When you search the shop, your selected department, search keywords, country filter, and pagination information are sent from our server to CJ's product-feed service to retrieve products available to our publisher account. We cache catalog search responses for approximately 15 minutes. Catalog response data includes advertiser/brand and product information; it is not the same as your private account or credit ledger.",
      "If you click an affiliate product link, the link may contain tracking information that identifies the publisher or campaign and attributes a visit or purchase. CJ, the advertiser, and the merchant may receive information about the click and activity on their sites under their own policies. We may receive aggregated or transaction-attribution reporting from an affiliate network. We do not intentionally send your TryOnFashion password, full payment-card details, or private closet contents to an advertiser as part of a catalog search.",
      "We do not sell personal information. We do not use TryOnFashion account data for cross-context behavioral advertising. Affiliate tracking is used to attribute outbound referral traffic and commissions, not to give us control over a merchant's tracking after you leave our Service.",
    ],
  },
  {
    title: "5. Service providers and disclosures",
    paragraphs: [
      "We disclose information only as reasonably necessary to operate the Service, at your direction, or as otherwise permitted or required by law. Current provider categories include:",
    ],
    bullets: [
      "Clerk — account authentication, profile information, and session security.",
      "Neon — database hosting for account, closet, and credit-ledger records.",
      "Vercel — application hosting, delivery, operational logs, and the AI gateway used to route image-generation requests.",
      "The configured image-model provider — the uploaded photo, selected product images, and prompt required to return a try-on result.",
      "Stripe — hosted payment checkout and payment status/transaction details.",
      "CJ and, after you click a product link, the relevant advertiser or merchant — catalog search, affiliate attribution, and destination-site activity.",
      "Google — only where used as an identity provider for sign-in, through Clerk's integration.",
    ],
  },
  {
    title: "6. Cookies, storage, and analytics",
    paragraphs: [
      "Clerk uses cookies or similar technologies as needed to authenticate you and maintain a secure session. TryOnFashion uses browser local storage to remember your selected color theme. We do not currently intentionally use third-party behavioral advertising pixels in the application. Hosting, authentication, payment, affiliate, and merchant providers may use their own technologies when you use their services or follow their links; consult their notices for details. If we add analytics or non-essential cookies, we will update this policy and provide any choices or consent required by law.",
    ],
  },
  {
    title: "7. Retention and deletion",
    paragraphs: [
      "We keep account information while your account is active. Saved closet items remain until you remove them or delete your account. Credit-ledger records are associated with your account to maintain balances and transaction history. Uploaded try-on photos and generated results are not stored in the TryOnFashion account database by the current Service, but the AI gateway/model provider may retain request data under its own practices. Catalog cache entries generally expire after about 15 minutes.",
      "You may delete your account from Settings. When the request succeeds, we delete the Clerk sign-in and the associated primary TryOnFashion account record; database relationships are configured to cascade-delete closet and credit-ledger records. This does not erase records that Stripe or other providers must retain for legal, financial, fraud-prevention, or security purposes, nor does it immediately remove residual copies from provider backups or operational logs that are subject to their own retention cycles. If account deletion fails or you need help with a privacy request, contact support@tryonfashion.app.",
    ],
  },
  {
    title: "8. Security",
    paragraphs: [
      "We use measures intended to protect information, including authenticated access, account-scoped database operations, server-side handling of secret credentials, HTTPS restrictions for catalog product links and try-on image fetches, and verification of payment webhooks. No website, transmission, or storage system can be guaranteed completely secure. We do not claim a particular security certification or guarantee that unauthorized access can never occur. Please use a unique sign-in credential and contact us promptly if you believe your account is compromised.",
    ],
  },
  {
    title: "9. International processing and your privacy rights",
    paragraphs: [
      "Our providers may process information in countries other than the country where you live. Where applicable law requires safeguards for international transfers, we and our providers rely on an appropriate transfer mechanism. Data-protection rights vary by location and may include rights to access, correct, delete, restrict, object to, or obtain a copy of personal data, and to withdraw consent where processing relies on consent. You may manage closet items and delete your account in the Service, or submit a privacy request using support@tryonfashion.app. We may need to verify your identity and may retain information where the law permits or requires it. You may also have the right to complain to your local data-protection authority.",
      "If you are in a U.S. state with a comprehensive privacy law, you may have additional rights, including to know/access, correct, delete, or obtain a portable copy of covered personal information and to opt out of certain sales, sharing, or targeted advertising. We do not sell personal information or use it for cross-context behavioral advertising as described above. We will not discriminate against you for exercising a privacy right. These rights and exceptions depend on the law that applies to you.",
      "The Service is intended for adults and is not directed to children under 18. We do not knowingly seek to collect personal information from children under 18. If you believe a child has provided information, contact us so we can review and take appropriate action.",
    ],
  },
  {
    title: "10. Changes and contact",
    paragraphs: [
      "We may update this Privacy Policy when our practices, providers, or legal obligations change. We will revise the effective date and provide additional notice or obtain consent where required. Continued use of the Service after an update takes effect is subject to the revised policy to the extent permitted by law.",
      "Privacy contact: VITERBI LLC at support@tryonfashion.app or 16192 Coastal Highway, Lewes, Delaware. Confirm the applicable jurisdiction, data-retention periods, and AI-provider terms against your actual production configuration. For general Service terms, see our Terms of Service.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-4xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 lg:p-14">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">TryOnFashion</Link>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-stone-500">Effective date: November 3, 2026 · Last updated: November 3, 2026</p>
        <p className="mt-6 max-w-3xl text-base leading-7 text-stone-600">We explain what information TryOnFashion handles, why we use it, which service providers help operate the app, and the choices available to you. We aim to collect only what is needed to provide the features you choose to use.</p>
        <nav aria-label="Privacy policy sections" className="mt-8 rounded-2xl bg-stone-50 p-5">
          <p className="text-sm font-semibold text-stone-900">On this page</p>
          <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {sections.map((section, index) => <li key={section.title}><a className="text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900" href={`#privacy-${index + 1}`}>{section.title}</a></li>)}
          </ol>
        </nav>
        <div className="mt-10 divide-y divide-stone-200">
          {sections.map((section, index) => (
            <section key={section.title} id={`privacy-${index + 1}`} className="scroll-mt-8 py-7 first:pt-0 last:pb-0">
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-stone-700">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              {section.bullets && <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-stone-700">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
            </section>
          ))}
        </div>
        <footer className="mt-10 border-t border-stone-200 pt-6 text-sm text-stone-500"><Link href="/terms" className="font-medium text-stone-700 underline underline-offset-4">Read our Terms of Service</Link><span className="mx-2">·</span><Link href="/" className="font-medium text-stone-700 underline underline-offset-4">Return to TryOnFashion</Link></footer>
      </article>
    </main>
  );
}
