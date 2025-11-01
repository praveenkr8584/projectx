import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import EditForm from './EditForm';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const url='https://projectx-backend-q4wb.onrender.com';
  const [data, setData] = useState({ rooms: [], bookings: [], services: [], users: [] });
  const [editing, setEditing] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [filters, setFilters] = useState({
    rooms: { text: '', status: '' },
    bookings: { text: '', status: '', checkInStart: '', checkInEnd: '' },
    services: { text: '', priceMin: '', priceMax: '' },
    users: { text: '', role: '', status: '' }
  });
  const [selectedItems, setSelectedItems] = useState({ rooms: [], bookings: [], services: [], users: [] });
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({});
  const [reports, setReports] = useState({
    monthlyRevenue: [],
    yearlyRevenue: [],
    occupancy: {},
    auditLogs: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchStats();
    fetchChartData();
    fetchReports();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch current user profile to get user ID
      const profileRes = await axios.get(`${url}/profile`, { headers });
      setCurrentUserId(profileRes.data.id);

      const dashboardRes = await axios.get(`${url}/admin/dashboard`, { headers });

      setData({
        rooms: dashboardRes.data.rooms,
        bookings: dashboardRes.data.bookings,
        services: dashboardRes.data.services,
        users: dashboardRes.data.users
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const statsRes = await axios.get(`${url}/admin/stats`, { headers });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const chartRes = await axios.get(`${url}/admin/chart-data`, { headers });
      setChartData(chartRes.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [monthlyRes, yearlyRes, occupancyRes, auditRes] = await Promise.all([
        axios.get(`${url}/admin/reports/revenue/monthly`, { headers }),
        axios.get(`${url}/admin/reports/revenue/yearly`, { headers }),
        axios.get(`${url}/admin/reports/occupancy`, { headers }),
        axios.get(`${url}/admin/audit-logs`, { headers })
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

  const handleDelete = async (type, id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${url}/admin/dashboard/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If the deleted user is the current user, logout immediately
      if (type === 'users' && id === currentUserId) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/');
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleEdit = (item, type) => {
    setEditing({ ...item, type });
  };

  const handleSave = () => {
    setEditing(null);
    fetchData();
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const handleFilterChange = (type, key, value) => {
    setFilters(prev => ({ ...prev, [type]: { ...prev[type], [key]: value } }));
  };

  const handleSelectItem = (type, id) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter(itemId => itemId !== id)
        : [...prev[type], id]
    }));
  };

  const handleSelectAll = (type) => {
    const allIds = filteredData[type].map(item => item._id);
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type].length === allIds.length ? [] : allIds
    }));
  };

  const handleBulkDelete = async (type) => {
    if (selectedItems[type].length === 0) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all(selectedItems[type].map(id => axios.delete(`${url}/admin/dashboard/${type}/${id}`, { headers })));
      setSelectedItems(prev => ({ ...prev, [type]: [] }));
      fetchData();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const handleExport = (type, format) => {
    const data = filteredData[type];
    let content = '';
    let filename = `${type}.${format}`;
    let mimeType = '';

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      content = [headers, ...rows].join('\n');
      mimeType = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (type, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${url}/admin/dashboard/${type}/import`, formData, { headers });
      fetchData();
      alert('Import successful');
    } catch (error) {
      console.error('Error importing:', error);
      alert('Import failed');
    }
  };

  const filteredData = {
    rooms: data.rooms.filter(room =>
      room.roomNumber.toLowerCase().includes(filters.rooms.text.toLowerCase()) &&
      (filters.rooms.status === '' || room.status === filters.rooms.status)
    ),
    bookings: data.bookings.filter(booking =>
      booking.customerName.toLowerCase().includes(filters.bookings.text.toLowerCase()) &&
      (filters.bookings.status === '' || booking.status === filters.bookings.status) &&
      (!filters.bookings.checkInStart || new Date(booking.checkInDate) >= new Date(filters.bookings.checkInStart)) &&
      (!filters.bookings.checkInEnd || new Date(booking.checkInDate) <= new Date(filters.bookings.checkInEnd))
    ),
    services: data.services.filter(service =>
      service.name.toLowerCase().includes(filters.services.text.toLowerCase()) &&
      (!filters.services.priceMin || service.price >= parseFloat(filters.services.priceMin)) &&
      (!filters.services.priceMax || service.price <= parseFloat(filters.services.priceMax))
    ),
    users: data.users.filter(user =>
      (user.username.toLowerCase().includes(filters.users.text.toLowerCase()) || user.email.toLowerCase().includes(filters.users.text.toLowerCase())) &&
      (filters.users.role === '' || user.role === filters.users.role) &&
      (filters.users.status === '' || (user.status && user.status.toLowerCase() === filters.users.status.toLowerCase()))
    )
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
      {editing && (
        <EditForm
          item={editing}
          type={editing.type}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

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

      {/* Users filters removed — listings live on dedicated admin pages */}

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
