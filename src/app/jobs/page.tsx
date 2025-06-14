"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import QuotationTable from "./QuotationTable";
import InvoiceTable from "./InvoiceTable";
import Loader from "../components/Loader";
import api from "../../lib/api";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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

  // States for sorting
  const [sortKey, setSortKey] = useState<keyof Job>("jobDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchJobs(true); // Initial load
  }, []);

  const fetchJobs = async (initialLoad = false) => {
    // if (!initialLoad) setIsRefreshing(true);

    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      if (initialLoad) {
        setTimeout(() => setLoading(false), 500);
      } else {
        // setIsRefreshing(false);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredAndSortedJobs = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const filtered = jobs
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

    const sorted = [...filtered].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (
        sortKey === "jobDate" &&
        typeof valA === "string" &&
        typeof valB === "string"
      ) {
        comparison = new Date(valA).getTime() - new Date(valB).getTime();
      } else if (typeof valA === "string" && typeof valB === "string") {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [jobs, searchTerm, activeTab, sortKey, sortOrder]);

  const totalPages = Math.max(
    Math.ceil(filteredAndSortedJobs.length / pageSize),
    1
  );

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedJobs.slice(start, start + pageSize);
  }, [filteredAndSortedJobs, currentPage]);

  if (loading) return <Loader />;

  return (
    <div className="max-w-[95%] mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Job Records</h1>
        <p className="text-gray-500 mt-1">
          Search, manage, and view all quotations and invoices.
        </p>
      </header>
      <button
        className={`py-2 rounded-t-md text-sm font-semibold transition-colors`}
      >
        <Link
          href="/jobs/new"
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Invoice
        </Link>
      </button>
      {/* Redesigned Control Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Tabs */}
          <div className="flex border-b md:border-b-0 md:border-r pr-4">
            <button
              className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-colors ${
                activeTab === "quotation"
                  ? "border-b-2 border-slate-800 text-slate-800"
                  : "text-gray-500 hover:text-slate-800"
              }`}
              onClick={() => setActiveTab("quotation")}
            >
              Quotations
            </button>
            <button
              className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-colors ${
                activeTab === "invoice"
                  ? "border-b-2 border-slate-800 text-slate-800"
                  : "text-gray-500 hover:text-slate-800"
              }`}
              onClick={() => setActiveTab("invoice")}
            >
              Invoices
            </button>
          </div>

          {/* Actions & Controls */}
          <div className="flex-grow flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, plate, status..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full border border-slate-800 p-2 pl-10 rounded-md focus:ring-2 focus:ring-slate-500"
              />
            </div>
            {/* ✅ FIX: This container now stacks vertically on mobile and goes horizontal on larger screens */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                aria-label="Sort by"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as keyof Job)}
                className="border border-gray-300 p-2 rounded-md bg-white"
              >
                <option value="jobDate">Sort by Date</option>
                <option value="customerName">Sort by Name</option>
                <option value="totalCost">Sort by Total</option>
                <option value="status">Sort by Status</option>
                <option value="plateNumber">Sort by Plate</option>
              </select>
              <select
                aria-label="Sort order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="border border-gray-300 p-2 rounded-md bg-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        {activeTab === "quotation" ? (
          <QuotationTable jobs={paginatedJobs} />
        ) : (
          <InvoiceTable jobs={paginatedJobs} />
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <span className="text-gray-600">
          Page {currentPage} of {totalPages} ({filteredAndSortedJobs.length}{" "}
          results)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 font-semibold text-gray-700 bg-gray-100 rounded-md">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
