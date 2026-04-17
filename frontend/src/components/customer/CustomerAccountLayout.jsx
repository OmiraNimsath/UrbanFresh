import Navbar from '../Navbar';
import Breadcrumbs from './Breadcrumbs';
import MobileBottomNav from './MobileBottomNav';
import CustomerAccountSidebar from './CustomerAccountSidebar';

export default function CustomerAccountLayout({
  userName,
  activeSection,
  mobileActiveKey = 'orders',
  title,
  subtitle,
  breadcrumbItems,
  rightAside,
  children,
}) {
  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 md:px-8 md:pb-8 md:pt-8">
        {Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0 && (
          <Breadcrumbs items={breadcrumbItems} />
        )}

        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-[#163a2f] md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-[#6f817b]">{subtitle}</p>}
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_260px]">
          <CustomerAccountSidebar activeKey={activeSection} userName={userName} />

          <section className="space-y-6">{children}</section>

          {rightAside ? <aside className="space-y-4 lg:col-span-2 xl:col-span-1">{rightAside}</aside> : null}
        </div>
      </main>

      <MobileBottomNav activeKey={mobileActiveKey} />
    </div>
  );
}
