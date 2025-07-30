import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AdminStats from '../../components/AdminStats';
import GoogleCalendarEmbed from '../../components/GoogleCalendarEmbed';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalCalls: 0, totalAppointments: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('http://localhost:5000/admin/stats');
      const data = await res.json();
      setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Clinic Admin Dashboard</h1>
      <AdminStats {...stats} />

      <h2 className="text-xl font-semibold mb-2">Dr. Jason's Calendar</h2>
      <GoogleCalendarEmbed calendarId="jason-calendar-id@group.calendar.google.com" />

      <h2 className="text-xl font-semibold mt-10 mb-2">Dr. Elizabeth's Calendar</h2>
      <GoogleCalendarEmbed calendarId="elizabeth-calendar-id@group.calendar.google.com" />
    </Layout>
  );
};

export default Dashboard;
