import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[#b9d3c5]">Last updated: April 2026</p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12 text-gray-700">

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">1. Information We Collect</h2>
        <p className="text-sm leading-7">
          We collect information you provide directly — such as your name, email address, phone number,
          and delivery address — when you register for an account or place an order. We also collect
          order history and payment status information to fulfil your purchases.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">2. How We Use Your Information</h2>
        <p className="text-sm leading-7">
          Your information is used solely to process orders, manage your account, send order status
          updates, and improve our service. We do not sell or share your personal data with third
          parties for marketing purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">3. Payment Security</h2>
        <p className="text-sm leading-7">
          All payments are processed securely via Stripe. UrbanFresh does not store your card details.
          Payment data is handled entirely by Stripe in compliance with PCI-DSS standards.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">4. Data Retention</h2>
        <p className="text-sm leading-7">
          We retain your account and order data for as long as your account is active or as needed to
          provide services. You may request deletion of your account by contacting us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">5. Cookies</h2>
        <p className="text-sm leading-7">
          We use only essential session cookies required for authentication. No tracking or advertising
          cookies are used.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-800">6. Contact</h2>
        <p className="text-sm leading-7">
          For any privacy-related questions, contact us at{' '}
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
