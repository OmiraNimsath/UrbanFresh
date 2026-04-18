import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import { getLoyaltyPoints, getMyOrders } from '../../services/orderService';

export default function LoyaltyHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loyalty, setLoyalty] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    Promise.allSettled([getLoyaltyPoints(), getMyOrders()])
      .then(([loyaltyResult, ordersResult]) => {
        if (loyaltyResult.status === 'fulfilled') {
          setLoyalty(loyaltyResult.value);
        } else {
          toast.error('Failed to load loyalty summary.');
        }

        if (ordersResult.status === 'fulfilled') {
          setOrders(Array.isArray(ordersResult.value) ? ordersResult.value : []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const activityRows = useMemo(() => {
    const rows = [];

    orders.forEach((order) => {
      const redeemed = Number(order?.pointsRedeemed || 0);
      if (redeemed > 0) {
        rows.push({
          id: `redeem-${order.orderId}`,
          date: order.createdAt,
          action: `Redeemed on order UF-${order.orderId}`,
          points: -redeemed,
        });
      }
    });

    return rows
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [orders]);

  const rightAside = (
    <>
      <div className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-[#7e8d87]">Points earned (lifetime)</p>
        <p className="mt-1 text-3xl font-semibold text-[#163a2f]">{Number(loyalty?.earnedPoints || 0)}</p>
        <p className="mt-2 text-xs text-[#6f817b]">Value shown directly from your loyalty summary.</p>
      </div>

      <div className="rounded-2xl bg-[#0d4a38] p-4 text-white shadow-sm">
        <p className="text-sm font-semibold">Redeem Points</p>
        <p className="mt-1 text-xs text-[#d5e7de]">Apply loyalty points at checkout to get instant discounts on your order.</p>
        <Link to="/cart" className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0d4a38]">
          Go to Cart
        </Link>
      </div>
    </>
  );

  return (
    <CustomerAccountLayout
      userName={user?.name}
      activeSection="loyalty"
      mobileActiveKey="orders"
      title="Loyalty Points History"
      subtitle="Track your journey toward sustainable savings."
      breadcrumbItems={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Loyalty' }]}
      rightAside={rightAside}
    >
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#cae3d6] bg-[#eaf5ef] p-5">
          <p className="text-xs uppercase tracking-wide text-[#5f7f72]">Total Points</p>
          <p className="mt-2 text-4xl font-semibold text-[#163a2f]">{loading ? '-' : Number(loyalty?.totalPoints || 0)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/products" className="rounded-lg bg-[#0d4a38] px-3 py-1.5 text-xs font-semibold text-white">
              Earn More
            </Link>
            <Link to="/cart" className="rounded-lg border border-[#9dc4b2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1d3a2f]">
              Redeem Now
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#7e8d87]">Summary</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#6f817b]">Earned</dt>
              <dd className="font-semibold text-[#163a2f]">+{Number(loyalty?.earnedPoints || 0)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#6f817b]">Redeemed</dt>
              <dd className="font-semibold text-[#b63a3a]">-{Number(loyalty?.redeemedPoints || 0)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#6f817b]">Current Balance</dt>
              <dd className="font-semibold text-[#163a2f]">{Number(loyalty?.totalPoints || 0)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#163a2f]">Recent Activity</h2>
          <span className="text-xs text-[#7c8b85]">Last {activityRows.length} records</span>
        </div>

        {loading ? (
          <p className="text-sm text-[#6f817b]">Loading loyalty history...</p>
        ) : activityRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8e3de] bg-[#f8fbf9] p-8 text-center text-sm text-[#6f817b]">
            Activity will appear here after you earn or redeem points.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-130 text-sm">
              <thead>
                <tr className="border-b border-[#edf2ef] text-left text-xs uppercase tracking-wide text-[#8b9993]">
                  <th className="py-2">Date</th>
                  <th className="py-2">Action</th>
                  <th className="py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f1f5f3] text-[#3b5f53]">
                    <td className="py-3 text-xs text-[#7c8b85]">
                      {new Date(row.date).toLocaleDateString('en-LK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3">{row.action}</td>
                    <td className={`py-3 text-right font-semibold ${row.points < 0 ? 'text-[#b63a3a]' : 'text-[#2f7a58]'}`}>
                      {row.points > 0 ? `+${row.points}` : row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loyalty?.conversionRule && (
          <p className="mt-4 rounded-lg bg-[#f8fbf9] px-3 py-2 text-xs text-[#6f817b]">{loyalty.conversionRule}</p>
        )}
      </section>
    </CustomerAccountLayout>
  );
}
