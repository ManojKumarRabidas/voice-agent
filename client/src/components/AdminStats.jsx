const AdminStats = ({ totalCalls, totalAppointments }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-500 p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Total Calls</h3>
        <p className="text-2xl">{totalCalls}</p>
      </div>
      <div className="bg-green-500 p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Appointments</h3>
        <p className="text-2xl">{totalAppointments}</p>
      </div>
    </div>
  );
};

export default AdminStats;
