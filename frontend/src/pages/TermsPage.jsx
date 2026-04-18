import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header banner */}
      <div className="bg-[#044b32] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#b9d3c5] transition-colors hover:text-white"
          >
            <FiArrowLeft size={14} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-sm text-[#b9d3c5]">Last updated: April 2026</p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12 text-gray-700">

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">1. Acceptance of Terms</h2>
        <p className="text-sm leading-7">
          By accessing or using UrbanFresh, you agree to be bound by these Terms of Service. If you
          do not agree, please do not use our platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">2. Use of the Platform</h2>
        <p className="text-sm leading-7">
          UrbanFresh is an online marketplace for fresh produce. You may use the platform only for
          lawful personal purchases. You are responsible for maintaining the confidentiality of your
          account credentials.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">3. Orders and Payments</h2>
        <p className="text-sm leading-7">
          All orders are subject to availability. Prices are displayed in Sri Lankan Rupees (LKR).
          Payment is processed securely via Stripe at checkout. Once an order is confirmed, it may
          not be cancelled unless it has not yet been processed.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">4. Product Quality</h2>
        <p className="text-sm leading-7">
          We take care to list accurate expiry dates and product descriptions. If you receive a
          product that does not match its description, please contact us within 24 hours of delivery.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">5. Limitation of Liability</h2>
        <p className="text-sm leading-7">
          UrbanFresh is not liable for any indirect, incidental, or consequential damages arising
          from the use of this platform. Our liability is limited to the value of the order in
          question.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-800">6. Contact</h2>
        <p className="text-sm leading-7">
          For any questions about these terms, contact us at{' '}
          <a href="mailto:admin@urbanfresh.com" className="text-green-700 underline">
            admin@urbanfresh.com
          </a>
          .
        </p>
      </section>

        <div className="mt-12 border-t pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#044b32] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a6042]"
          >
            <FiArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
