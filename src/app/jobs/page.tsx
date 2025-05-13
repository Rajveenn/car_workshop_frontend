// File: app/jobs/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../lib/api";

interface Job {
  _id: string;
  customerName: string;
  plateNumber: string;
  totalCost: number;
  jobDate: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Job List</h1>
        <Link href="/jobs/new" className="bg-blue-700 text-white px-4 py-2 rounded">+ New Job</Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Customer</th>
              <th className="p-2 border">Plate</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id} className="border-b hover:bg-gray-50">
                <td className="p-2 border uppercase">{job.customerName}</td>
                <td className="p-2 border uppercase">{job.plateNumber}</td>
                <td className="p-2 border uppercase">RM {job.totalCost}</td>
                <td className="p-2 border uppercase">{new Date(job.jobDate).toLocaleDateString()}</td>
                <td className="p-2 border">
                  <Link href={`/jobs/${job._id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
