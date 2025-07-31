import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AdminStats from '../../components/AdminStats';
import GoogleCalendarEmbed from '../../components/GoogleCalendarEmbed';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const [stats, setStats] = useState({ totalCalls: 0, totalAppointments: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${VITE_API_BASE_URL}/admin`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('Failed to fetch dashboard stats');
        console.error('Dashboard stats error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clinic Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor appointments and manage doctor schedules
          </p>
        </div>

        {isLoading ? (
          <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <AdminStats {...stats} />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                Dr. Jason's Calendar
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Read-only
              </span>
            </div>
            <GoogleCalendarEmbed 
              calendarId="03d2d5cd12415b08357ec9293d7fb5f6acfd37e79c12a8a6d1071e4fcc52654d@group.calendar.google.com"
              doctorName="Dr. Jason"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                Dr. Elizabeth's Calendar
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Read-only
              </span>
            </div>
            <GoogleCalendarEmbed 
              calendarId="916fa54fc623e06e876d138ec7edb2be7861f3bc1813e57893fc905f446136f7@group.calendar.google.com"
              doctorName="Dr. Elizabeth"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;