"use client";
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function EarningsPage() {
  const [range, setRange] = useState("daily");
  const [customRange, setCustomRange] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [groupBy, setGroupBy] = useState("carModel");
  const [summary, setSummary] = useState({ totalEarnings: 0, count: 0 });
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("all");

  const fetchSummary = async () => {
    try {
      const res = await api.get("/jobs/summary/earnings", {
        params: {
          range: customRange ? undefined : range,
          start: customRange ? start : undefined,
          end: customRange ? end : undefined,
          status: status !== "all" ? status : undefined,
        },
      });
      setSummary(res.data);
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [range, start, end, customRange, status]);

  const groupedData = useMemo(() => {
    const result = {};

    jobs.forEach((job) => {
      if (groupBy === "partsChanged") {
        if (Array.isArray(job.jobDetails)) {
          job.jobDetails.forEach((detail) => {
            const part = detail.description || "Unknown Part";
            result[part] = (result[part] || 0) + detail.cost;
          });
        }
      } else {
        const key = job[groupBy] || "Unknown";
        result[key] = (result[key] || 0) + job.totalCost;
      }
    });

    return result;
  }, [jobs, groupBy]);

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [
      {
        label: `Earnings by ${groupBy}`,
        data: Object.values(groupedData),
        backgroundColor: [
          "#1D4ED8", // blue-700
          "#10B981", // emerald-500
          "#F59E0B", // amber-500
          "#EF4444", // red-500
          "#8B5CF6", // violet-500
          "#F43F5E", // rose-500
          "#3B82F6", // blue-500
          "#22C55E", // green-500
          "#EAB308", // yellow-500
          "#F87171", // red-400
          "#A855F7", // purple-500
          "#EC4899", // pink-500
          "#0EA5E9", // sky-500
          "#14B8A6", // teal-500
          "#D946EF", // fuchsia-500
          "#FB923C", // orange-400
          "#4ADE80", // green-400
          "#60A5FA", // blue-400
          "#FCD34D", // yellow-300
          "#FCA5A5", // red-300
        ],
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Earnings Summary</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 items-end">
        <select
          className="border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          value={range}
          onChange={(e) => {
            const value = e.target.value;
            setRange(value);
            setCustomRange(value === "custom");
          }}
        >
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="yearly">This Year</option>
          <option value="custom">Custom Range</option>
        </select>

        {customRange && (
          <>
            <label className="flex flex-col">
              <span className="text-sm mb-1">Start Date</span>
              <input
                type="date"
                className="border p-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm mb-1">End Date</span>
              <input
                type="date"
                className="border p-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </>
        )}

        <select
          className="border p-2"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
        >
          <option value="carModel">Earnings by Car Model</option>
          <option value="customerName">Earnings by Customer</option>
          <option value="partsChanged">Earnings by Parts Changed</option>
          <option value="plateNumber">Earnings by Plate Number</option>
        </select>

        <select
          className="border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="PJPP">New Jobs</option>
          <option value="PJ">Pending Jobs</option>
          <option value="PP">Pending Payments</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="bg-white shadow rounded p-4 mb-6">
        <p className="text-lg">
          Total Jobs: <strong>{summary.count}</strong>
        </p>
        <p className="text-lg">
          Total Earnings: <strong>RM {summary.totalEarnings}</strong>
        </p>
      </div>

      {jobs.length > 0 ? (
        <>
          <div className="mb-8 overflow-x-auto">
            <div className="lg:min-w-[800px]">
              <Bar
                data={chartData}
                options={{ maintainAspectRatio: false, responsive: true }}
              />
            </div>
          </div>
          <div className="mb-8 overflow-x-auto">
            <div className="lg:min-w-[800px]">
              <Pie
                data={chartData}
                options={{ maintainAspectRatio: false, responsive: true }}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">No data found.</p>
      )}
    </div>
  );
}
