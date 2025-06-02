"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import QuotationTable from "./QuotationTable";
import InvoiceTable from "./InvoiceTable";
import Loader from "../components/Loader";
import api from "../../lib/api"; // ✅ Ensure you have this to fetch jobs

// ✅ Define or import Job type
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
  isQuote?: boolean;
}

// ✅ Optional helper to avoid getStatusLabel errors
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
  const [activeTab, setActiveTab] = useState<"quotation" | "invoice">(
    "quotation"
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setTimeout(() => setLoading(false), 500); // 👈 enforce minimum duration
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredJobs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return jobs
      .filter((job) => (activeTab === "quotation" ? job.isQuote : !job.isQuote))
      .filter(
        (job) =>
          job.customerName.toLowerCase().includes(term) ||
          job.customerPhone.toLowerCase().includes(term) ||
          (job.invoiceNumber ?? "").toLowerCase().includes(term) ||
          job.plateNumber.toLowerCase().includes(term) ||
          job.carModel.toLowerCase().includes(term) ||
          getStatusLabel(job.status).toLowerCase().includes(term)
      );
  }, [jobs, searchTerm, activeTab]);

  const totalPages = Math.max(Math.ceil(filteredJobs.length / pageSize), 1);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage]);

  if (loading) return <Loader />;

  return (
    <div className="max-w-[9/10] mx-auto p-6 bg-white shadow rounded">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
        <h1 className="text-2xl font-bold">Job Records</h1>
        <div className="flex space-x-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearch}
            className="flex-grow md:flex-auto border p-2 rounded"
          />
          <Link
            href="/jobs/new"
            className="bg-slate-800 px-4 py-2 rounded font-medium text-white text-sm"
          >
            New Invoice
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "quotation" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("quotation")}
        >
          Quotations
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "invoice" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("invoice")}
        >
          Invoices
        </button>
      </div>

      {/* Table */}
      {activeTab === "quotation" ? (
        <QuotationTable jobs={paginatedJobs} />
      ) : (
        <InvoiceTable jobs={paginatedJobs} />
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
