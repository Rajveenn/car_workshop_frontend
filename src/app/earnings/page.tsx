// File: app/earnings/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import axios from "axios";

export default function EarningsPage() {
  const [range, setRange] = useState("daily");
  const [summary, setSummary] = useState({ totalEarnings: 0, count: 0 });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get(`/jobs/summary/earnings?range=${range}`);
      setSummary(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        console.error("API Error:", err.response.data);
      } else {
        console.error("Unknown Error:", err);
      }
    }
  }, [range]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Earnings Summary</h1>

      <select
        className="border p-2 mb-4"
        value={range}
        onChange={(e) => setRange(e.target.value)}
      >
        <option value="daily">Today</option>
        <option value="weekly">This Week</option>
        <option value="monthly">This Month</option>
        <option value="yearly">This Year</option>
      </select>

      <div className="bg-white shadow rounded p-4">
        <p className="text-lg">Total Jobs: <strong>{summary.count}</strong></p>
        <p className="text-lg">Total Earnings: <strong>RM {summary.totalEarnings}</strong></p>
      </div>
    </div>
  );
}
