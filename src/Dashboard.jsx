import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/flamingo-logo.png";
import dayjs from "dayjs";
import Checkin from './Checkin';
import LeaveRequest from './LeaveRequest'
import ChatForm from "./ChatForm";
import {
  fetchLastCheckIn,
  fetchAttendanceRecords,
  fetchHolidayList,
  fetchTodayBirthdays,
} from "./dashboardApi";

const Dashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [birthdayList, setBirthdayList] = useState([]);
  const [birthdayCount, setBirthdayCount] = useState(0);
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fullName = localStorage.getItem("employee_name");
    const employeeId = localStorage.getItem("employee_id");

    if (fullName && employeeId) {
      setEmployee({ employee_name: fullName, name: employeeId });
    } else {
      setEmployee(null);
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!employee?.name) return;

      try {
        const [checkIn, records, holidayList] = await Promise.all([
          fetchLastCheckIn(employee.name),
          fetchAttendanceRecords(employee.name),
          fetchHolidayList(employee.name),
        ]);

        setLastCheckIn(checkIn);
        setAttendanceRecords(records);
        setHolidays(holidayList);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadBirthdays = async () => {
      try {
        const { employees, count } = await fetchTodayBirthdays();
        setBirthdayList(employees);
        setBirthdayCount(count);
      } catch (err) {
        console.error("Error fetching birthdays:", err);
      }
    };

    loadBirthdays();
    loadDashboardData();
  }, [employee]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700 text-lg">
        Loading employee data...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Unable to load employee info. Please login again.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-gradient-to-br from-[#1C2B83] to-[#1C2B83] text-white flex flex-col justify-between py-6 px-4">
        <div>
          <img src={logo} alt="Flamingo Logo" className="h-14 mx-auto mb-8" />
          <nav className="space-y-6">
            <NavItem icon="🏠" label="Home" to="/dashboard" />
            <NavItem icon="👤" label="My Profile" to="/profile" />
            <NavItem icon="🖐️" label="Attendance" to="/attendance" />
            <NavItem icon="📅" label="Leave" to="/leave" />
            <NavItem icon="💰" label="Salary" to="/salary" />
            <NavItem icon="📊" label="IT Computation" to="/it-computation" />
            <NavItem icon="🧾" label="Expenses" to="/expenses" />
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center text-sm text-white gap-2 hover:opacity-80"
        >
          <span>⏻</span> Logout
        </button>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Employee Self Service</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{employee.name}</span>
            <button className="text-gray-500 text-xl">🔔</button>
            <div className="relative">
              <button
                className="text-gray-500 text-xl"
                onClick={() => setShowChat(!showChat)}
              >
                💬
              </button>

              {showChat && (
                <div className="absolute right-0 top-10 z-50 w-[400px]">
                  <ChatForm onClose={() => setShowChat(false)} />
                </div>
              )}
            </div>

          </div>
        </header>

        <div className="text-pink-600 text-xl font-bold mb-1">
          Welcome! {employee.employee_name}
        </div>

        {lastCheckIn && (
          <div className="mb-4 p-3 bg-yellow-100 text-sm text-gray-700 rounded shadow w-96 text-center rounded-2xl">
            <strong>
              {lastCheckIn.log_type === "IN" ? "Last Check-In:" : "Last Check-Out:"}
            </strong>{" "}
            {dayjs(lastCheckIn.time).format("DD MMM YYYY, hh:mm A")}
          </div>
        )}

        <div className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 w-48">
          <Checkin employeeId={employee.name} />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-pink-50 p-4 rounded shadow-sm col-span-2 overflow-auto">
            <h2 className="text-pink-600 font-semibold mb-2">My Attendance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Total Hrs</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {attendanceRecords.map((rec, idx) => (
                    <tr key={idx}>
                      <td>{rec.date}</td>
                      <td>{rec.in_time || "--"}</td>
                      <td>{rec.out_time || "--"}</td>
                      <td>{rec.working_hours || "--"}</td>
                      <td>
                        <span
                          className={`font-semibold px-2 py-1 rounded ${rec.status === "Present"
                            ? "text-green-700"
                            : "text-red-700"
                            }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-pink-50 p-4 rounded shadow-sm">
              <h3 className="text-pink-600 font-semibold mb-2">Holiday List</h3>
              <ul className="text-sm text-gray-800 space-y-1 max-h-40 overflow-y-auto pr-2">
                {holidays.length > 0 ? (
                  holidays.map((h, idx) => (
                    <li key={idx}>
                      {dayjs(h.holiday_date).format("DD MMM")} - {h.description}
                    </li>
                  ))
                ) : (
                  <li>No holidays found.</li>
                )}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <LeaveRequest />
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded shadow-sm">
            <h3
              className="text-pink-600 font-semibold mb-2 cursor-pointer flex justify-between"
              onClick={() => setShowBirthdays(!showBirthdays)}
            >
              <span>🎂 Today's Birthdays</span>
              <span className="bg-pink-300 text-white rounded px-2 py-0.5 text-xs font-semibold">
                {birthdayCount}
              </span>
            </h3>
            {showBirthdays && (
              <ul className="text-sm text-gray-800 space-y-1 max-h-40 overflow-y-auto pr-2">
                {birthdayList.length > 0 ? (
                  birthdayList.map((emp, idx) => (
                    <li key={idx}>
                      {emp.employee_name} ({dayjs(emp.date_of_birth).format("DD MMM")})
                    </li>
                  ))
                ) : (
                  <li>No birthdays today.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, to }) => {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-3 text-white hover:text-pink-300 cursor-pointer"
      onClick={() => navigate(to)}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );
};

const LinkCard = ({ title, count }) => (
  <div className="bg-pink-50 p-4 rounded shadow-sm text-sm text-gray-800 flex justify-between items-center">
    <span>{title}</span>
    <span className="bg-pink-300 text-white rounded px-2 py-0.5 text-xs font-semibold">
      {count}
    </span>
  </div>
);

export default Dashboard;

