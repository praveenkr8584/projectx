import { useState, useEffect } from 'react';
import api from '../../api.js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({});
  const [reports, setReports] = useState({
    monthlyRevenue: [],
    yearlyRevenue: [],
    occupancy: {},
    auditLogs: []
  });

  useEffect(() => {
    fetchStats();
    fetchChartData();
    fetchReports();
  }, []);

  const fetchStats = async () => {
    try {
      const statsRes = await api.get(`/admin/stats`);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const chartRes = await api.get(`/admin/chart-data`);
      setChartData(chartRes.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const [monthlyRes, yearlyRes, occupancyRes, auditRes] = await Promise.all([
        api.get(`/admin/reports/revenue/monthly`),
        api.get(`/admin/reports/revenue/yearly`),
        api.get(`/admin/reports/occupancy`),
        api.get(`/admin/audit-logs`)
      ]);

      setReports({
        monthlyRevenue: monthlyRes.data.monthlyRevenue,
        yearlyRevenue: yearlyRes.data.yearlyRevenue,
        occupancy: occupancyRes.data,
        auditLogs: auditRes.data
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };



  // Prepare chart data
  const bookingsChartData = {
    labels: chartData.bookingsOverTime?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Bookings',
        data: chartData.bookingsOverTime?.map(item => item.count) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  const revenueChartData = {
    labels: chartData.revenueOverTime?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Revenue',
        data: chartData.revenueOverTime?.map(item => item.revenue) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
    ],
  };

  return (
    <div className="admin-dashboard">
      {/* Quick Stats */}
      <div className="stats-section" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <div><strong>Total Rooms:</strong> {stats.totalRooms || 0}</div>
        <div><strong>Total Bookings:</strong> {stats.totalBookings || 0}</div>
        <div><strong>Total Services:</strong> {stats.totalServices || 0}</div>
        <div><strong>Total Users:</strong> {stats.totalUsers || 0}</div>
        <div><strong>Total Revenue:</strong> ${stats.totalRevenue || 0}</div>
      </div>

      {/* Charts */}
      <div className="charts-section" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        <div style={{ width: '45%' }}>
          <h4>Bookings Over Time (Last 30 Days)</h4>
          <Line data={bookingsChartData} />
        </div>
        <div style={{ width: '45%' }}>
          <h4>Revenue Over Time (Last 30 Days)</h4>
          <Line data={revenueChartData} />
        </div>
      </div>

      {/* Reports Section */}
      <div className="reports-section" style={{ marginBottom: '20px' }}>
        <h3>Analytics & Reports</h3>

        {/* Monthly Revenue */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Monthly Revenue Report</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Month</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Revenue</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {reports.monthlyRevenue.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item._id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.revenue}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Yearly Revenue */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Yearly Revenue Report</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Year</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Revenue</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {reports.yearlyRevenue.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item._id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.revenue}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Occupancy Analytics */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Occupancy Analytics</h4>
          <div className="occupancy-stats">
            <div><strong>Current Occupancy Rate:</strong> {reports.occupancy.currentOccupancyRate?.toFixed(2)}%</div>
            <div><strong>Average Occupancy:</strong> {reports.occupancy.averageOccupancy?.toFixed(2)}%</div>
          </div>
          <h5>Occupancy Trends (Last 30 Days)</h5>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Occupied Days</th>
              </tr>
            </thead>
            <tbody>
              {reports.occupancy.occupancyTrends?.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item._id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.occupiedDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Logs */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Audit Logs (Last 100 Entries)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Action</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Entity</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Entity ID</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Admin ID</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {reports.auditLogs.map((log, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.action}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.entity}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.entityId}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.adminId}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Services, Users and listing controls moved to their dedicated admin pages:
          - Services -> /admin/add-service
          - Users -> /admin/register
          This keeps the dashboard focused on stats, charts and reports. */}
    </div>
  );
};

export default AdminDashboard;
