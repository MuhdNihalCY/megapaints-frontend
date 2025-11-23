import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { TrendingUp, DollarSign, Package, AlertCircle, Activity } from 'lucide-react';

const Analytics = () => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const adminServices = getAdminServices();

      const [summaryRes, trendsRes, financialRes, alertsRes] = await Promise.all([
        adminServices.inventoryManagement.getAnalyticsSummary(),
        adminServices.inventoryManagement.getMovementTrends({ period: 'monthly' }),
        adminServices.inventoryManagement.getFinancialMetrics({ period: 'monthly' }),
        adminServices.inventoryManagement.getAlerts(),
      ]);

      if (summaryRes.status === 'success') {
        setAnalytics(summaryRes.data.summary);
      }
      if (trendsRes.status === 'success') {
        setTrends(trendsRes.data.trends || []);
      }
      if (financialRes.status === 'success') {
        setFinancial(financialRes.data.metrics);
      }
      if (alertsRes.status === 'success') {
        setAlerts(alertsRes.data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Analytics</h2>

      {/* Financial Metrics */}
      {financial && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  AED {financial.total_inventory_value?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Potential Profit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  AED {financial.potential_profit?.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Turnover Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {financial.turnover_rate?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  AED {financial.total_cost_value?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Movement Trends */}
      {trends.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movement Trends</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{trend.period}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      In: {trend.in?.toFixed(3) || '0.000'}
                    </span>
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Out: {trend.out?.toFixed(3) || '0.000'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Net: {trend.net?.toFixed(3) || '0.000'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Minimum Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.map((alert, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {alert.product?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {alert.branch?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {alert.current_stock?.toFixed(3) || '0.000'} {alert.unit || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {alert.minimum_stock?.toFixed(3) || '0.000'} {alert.unit || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {alert.alerts?.out_of_stock ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;


