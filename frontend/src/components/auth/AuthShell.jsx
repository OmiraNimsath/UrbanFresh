import { Link } from 'react-router-dom';
import { FiFeather, FiShoppingBag } from 'react-icons/fi';
import Footer from '../Footer';

/**
 * Presentation Layer – Shared auth page shell.
 * Provides consistent background, centered card space, and footer layout
 * for login/register screens without affecting auth behavior.
 */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#e2e5e3] text-[#123e2f]">
      <div className="pointer-events-none absolute inset-0 md:hidden" aria-hidden="true">
        <div className="absolute -left-20 top-32 h-72 w-72 rounded-full bg-[#9ff3ca]/45 blur-3xl" />
        <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-[#abf7d1]/40 blur-3xl" />
        <div className="absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-[#bbffd9]/35 blur-3xl" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative mx-auto w-full px-4 py-10 sm:px-6 md:py-12">
        <p className="mb-8 text-center text-[34px] font-bold leading-none tracking-tight text-[#0f3c2e] md:mb-7 md:text-[34px]">
          UrbanFresh
        </p>

        <section className="mx-auto w-full max-w-110 rounded-3xl bg-[#eef1ef] px-6 py-8 shadow-[0_18px_35px_rgba(18,62,47,0.08)] md:px-8 md:py-9">
          <header className="mb-7 text-center">
            <h1 className="text-[42px] font-bold leading-[1.05] text-[#0f3b2d]">{title}</h1>
            <p className="mt-2 text-[15px] text-[#566760]">{subtitle}</p>
          </header>
          {children}
        </section>
      </main>

      <Footer />
    </div>
  );
}
