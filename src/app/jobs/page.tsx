// File: app/jobs/page.tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "../../lib/api";
import Loader from "../components/Loader";

interface Job {
  _id: string;
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  totalCost: number;
  jobDate: string;
  invoiceNumber: string;
  carModel: string;
  status: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "PJPP":
      return "text-red-600";
    case "PJ":
      return "text-[#19642A]";
    case "PP":
      return "text-[#D4009F]";
    case "Completed":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PJPP":
      return "Pending Job & Payment";
    case "PP":
      return "Pending Payment";
    case "PJ":
      return "Pending Job";
    case "Completed":
      return "Completed";
    default:
      return "Unknown";
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  const filteredJobs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return jobs.filter(
      (job) =>
        job.customerName.toLowerCase().includes(term) ||
        job.customerPhone.toLowerCase().includes(term) ||
        (job.invoiceNumber ?? "").toLowerCase().includes(term) ||
        job.plateNumber.toLowerCase().includes(term) ||
        job.carModel.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  const totalPages = Math.max(Math.ceil(filteredJobs.length / pageSize), 1);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  if (loading) return <Loader />;

  return (
    <div className="max-w-[9/10] mx-auto p-6 bg-white shadow rounded">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="flex space-x-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by name, phone or invoice"
            value={searchTerm}
            onChange={handleSearch}
            className="flex-grow md:flex-auto border p-2 rounded"
          />
          <Link
            href="/jobs/new"
            className="bg-slate-800 flex justify-between items-center text-left px-4 py-2 rounded font-medium text-white text-sm"
          >
            New Invoice
          </Link>
        </div>
      </div>

      <div className="hidden md:block uppercase">
        <table className="w-full table-auto border text-center">
          <thead>
            <tr className="bg-gray-100 uppercase">
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Invoice Number</th>
              <th className="p-2 border">Customer</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Model</th>
              <th className="p-2 border">Plate</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.map((job) => (
              <tr key={job._id} className="border-b hover:bg-gray-50">
                <td className={`p-2 border font-bold`}>
                  <span className={`${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                </td>
                <td className="p-2 border uppercase">
                  <span className="text-blue-800 font-semibold">
                    {job.invoiceNumber || (
                      <span className="text-red-600 font-bold">
                        Invoice Not generated
                      </span>
                    )}
                  </span>
                </td>
                <td className="p-2 border uppercase">{job.customerName}</td>
                <td className="p-2 border uppercase">{job.customerPhone}</td>
                <td className="p-2 border uppercase">{job.carModel}</td>
                <td className="p-2 border uppercase">{job.plateNumber}</td>
                <td className="p-2 border uppercase">RM {job.totalCost}</td>
                <td className="p-2 border uppercase">
                  {new Date(job.jobDate).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <Link href={`/jobs/${job._id}`}>
                    <span className="underline text-blue-800">View</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4 uppercase">
        {paginatedJobs.map((job) => (
          <div
            key={job._id}
            className="border rounded-lg p-4 shadow-lg hover:shadow-2xl"
          >
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-blue-800 font-semibold">
                {job.invoiceNumber || (
                  <span className="text-red-600 font-bold">
                    Invoice Not generated
                  </span>
                )}
              </span>
              <Link href={`/jobs/${job._id}`}>
                <span className="text-blue-800 underline text-xs">View</span>
              </Link>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              <div className={`font-bold ${getStatusColor(job.status)}`}>
                {getStatusLabel(job.status)}
              </div>
              <span className="font-semibold uppercase">
                {job.customerName}
              </span>
              <div>
                <strong>Phone :</strong> {job.customerPhone}
              </div>
              <div>
                <strong>Model :</strong> {job.carModel}
              </div>
              <div>
                <strong>Plate :</strong> {job.plateNumber}
              </div>
              <div>
                <strong>Total :</strong> RM {job.totalCost}
              </div>
              <div>
                <strong>Date :</strong>{" "}
                {new Date(job.jobDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                page === currentPage ? "bg-slate-800 text-white" : "bg-gray-200"
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}
