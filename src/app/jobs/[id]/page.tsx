// FULLY EDITABLE VERSION WITH MODAL FORM STYLE
"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { toast } from "react-hot-toast";
import Loader from "../../components/Loader";
// const html2pdfPromise = import("html2pdf.js");
import { AnimatePresence, motion } from "framer-motion";
import {
  Pencil,
  Download,
  MessageCircle,
  CircleArrowLeft,
  FileUp,
  Delete,
} from "lucide-react";

interface JobDetail {
  description: string;
  quantity: number;
  cost: number;
}

interface Job {
  _id: string;
  customerName: string;
  customerPhone: string;
  carModel: string;
  plateNumber: string;
  jobDate: string;
  totalCost: number;
  labourCost: number;
  jobDetails: JobDetail[];
  createdAt?: string;
  whatsappUrl?: string;
  pdfUrl?: string;
  invoiceNumber?: string;
  status: string;
  isQuote: boolean;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [jobForm, setJobForm] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [editCount, setEditCount] = useState(0);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showGeneratePdfModal, setShowGeneratePdfModal] = useState(false);
  const [showPostEditModal, setShowPostEditModal] = useState(false); // New state for post-edit popup
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJobForm(res.data);
      const hasPdf = !!res.data.pdfUrl;
      if (hasPdf) {
        const match = res.data.pdfUrl.match(/_(\w+)-(\d+)/);
        // console.log(match)
        if (match) setEditCount(parseInt(match[2], 10));
        else setEditCount(1);
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showConvertModal || showGeneratePdfModal || showPostEditModal) {
      const openSound = new Audio("/sounds/prompt.mp3");
      openSound.play();
    }
  }, [showConvertModal, showGeneratePdfModal, showPostEditModal]);

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const updateTotal = useMemo(() => {
    if (!jobForm) return 0;
    const partsTotal = jobForm.jobDetails.reduce(
      (acc, item) =>
        acc + (Number(item.quantity) || 0) * (Number(item.cost) || 0),
      0
    );
    return Number(partsTotal) + Number(jobForm.labourCost);
  }, [jobForm]);

  const handleChange = <K extends keyof Job>(field: K, value: Job[K]) => {
    if (!jobForm) return;
    setJobForm((prev) => prev && { ...prev, [field]: value });
  };

  const handleDetailChange = <K extends keyof JobDetail>(
    index: number,
    field: K,
    value: JobDetail[K]
  ) => {
    if (!jobForm) return;
    const updatedDetails = [...jobForm.jobDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setJobForm((prev) => prev && { ...prev, jobDetails: updatedDetails });
  };

  const addPart = () => {
    if (!jobForm) return;
    setJobForm(
      (prev) =>
        prev && {
          ...prev,
          jobDetails: [
            ...prev.jobDetails,
            { description: "", quantity: 1, cost: 0 },
          ],
        }
    );
  };

  const removePart = (index: number) => {
    if (!jobForm) return;
    const updatedDetails = jobForm.jobDetails.filter((_, i) => i !== index);
    setJobForm((prev) => prev && { ...prev, jobDetails: updatedDetails });
  };

  const saveChanges = async () => {
    if (!jobForm) return;
    try {
      const updatedJob = { ...jobForm, totalCost: updateTotal };
      setEditCount((prev) => prev + 1);
      await api.put(`/jobs/${jobForm._id}`, updatedJob);
      setJobForm(updatedJob);
      setEditing(false);
      fetchJob();
      const successSound = new Audio("/sounds/success.mp3");
      successSound.play();
      toast.success("Changes saved.");
      // New: Show the post-edit modal
      setShowPostEditModal(true);
    } catch {
      const successSound = new Audio("/sounds/alert.mp3");
      successSound.play();
      toast.error("❌ Failed to save.");
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      if (!receiptRef.current || !jobForm) {
        toast.error("Missing receipt or job data");
        return;
      }

      const element = receiptRef.current;
      const html2pdf = (await import("html2pdf.js")).default;

      const baseInvoice = `${jobForm._id.slice(-7).toUpperCase()}`;
      const newEditCount = editCount + 1;
      const isQuote = jobForm.isQuote;
      const invoiceNumber = `${
        !isQuote ? "INV-" : ""
      }${baseInvoice}-${newEditCount}`;

      const opt = {
        margin: 0,
        filename: `${jobForm.customerName}_${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      const worker = html2pdf().set(opt).from(element);
      const pdfBlob: Blob = await worker.outputPdf("blob");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_API_PRESET1;

      const formData = new FormData();
      formData.append(
        "file",
        pdfBlob,
        `${jobForm.customerName}_${invoiceNumber}.pdf`
      );
      formData.append("upload_preset", uploadPreset!);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");

      const phoneNumber = jobForm.customerPhone
        .replace(/[^\d]/g, "")
        .replace(/^0/, "");
      const whatsappUrl = `https://api.whatsapp.com/send?phone=60${phoneNumber}&text=Here%20is%20your%20invoice%20link%20:%20${data.secure_url}`;
      const finalStatus = pendingStatus ?? jobForm.status;
      const finalQuoteStatus = finalStatus === "Completed" ? false : isQuote;

      const updatedJob = {
        ...jobForm, // Use the current state of jobForm
        totalCost: updateTotal, // Make sure total is updated
        pdfUrl: data.secure_url,
        whatsappUrl,
        invoiceNumber,
        isQuote: finalQuoteStatus,
        status: finalStatus,
      };

      await api.put(`/jobs/${jobForm._id}`, updatedJob);

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      fetchJob();
      const successSound = new Audio("/sounds/success.mp3");
      successSound.play();

      toast.success("PDF uploaded and job updated");
    } catch (err) {
      console.error("[PDF ERROR]", err);
      const errorSound = new Audio("/sounds/alert.mp3");
      errorSound.play();
      toast.error("❌ Failed to generate/upload PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!jobForm) return;
    if (newStatus === "Completed" && jobForm.isQuote) {
      setPendingStatus("Completed");
      setShowConvertModal(true);
    } else {
      await api.put(`/jobs/${jobForm._id}`, { status: newStatus });

      const successSound = new Audio("/sounds/prompt.mp3");
      successSound.play();
      toast.success("Status updated");
      fetchJob();
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case "PJPP":
        return "Pending Job & Pending Payment";
      case "PP":
        return "Pending Payment";
      case "PJ":
        return "Pending Job";
      case "Completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "PJPP":
        return "#dc2626"; // Red
      case "PP":
        return "#D4009F";
      case "PJ":
        return "#19642A"; // Red
      case "Completed":
        return "#2563eb"; // Blue
      default:
        return "#000000"; // Default black
    }
  };

  const handleConvertToInvoice = async () => {
    if (!jobForm || !pendingStatus) return;

    try {
      await api.put(`/jobs/${jobForm._id}`, {
        status: pendingStatus,
        isQuote: false,
      });

      toast.success("Converted to Invoice");
      
      setJobForm((prev) =>
        prev
          ? {
              ...prev,
              status: pendingStatus,
              isQuote: false,
            }
          : prev
      );
      
      setShowConvertModal(false);
      setPendingStatus(null);
      setShowGeneratePdfModal(true);
    } catch (err) {
      toast.error("Failed to convert to invoice.");
      const errorSound = new Audio("/sounds/alert.mp3");
      errorSound.play();
      console.error(err);
    }
  };
  
  const handleConfirmGeneratePdf = () => {
    setShowGeneratePdfModal(false);
    setTimeout(() => {
        handleDownloadPDF();
    }, 50);
  };

  // New: Handler for the post-edit popup
  const handleConfirmPostEditGenerate = () => {
    setShowPostEditModal(false);
    setTimeout(() => {
        handleDownloadPDF();
    }, 50);
  };

  if (loading) return <Loader />;
  if (!jobForm) return <p>Not found</p>;

  return (
    <div
      style={{
        maxWidth: "95%",
        margin: "0 auto",
        padding: 10,
        background: "#fff",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          title="Back to Jobs"
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "transform 0.2s ease-in-out",
            backgroundColor: "#1E293B",
            color: "white",
          }}
          onClick={() => router.push("/jobs")}
        >
          <CircleArrowLeft size={16} />
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            title="Generate PDF"
            style={{
              backgroundColor: "#F59E0B",
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
            }}
            onClick={handleDownloadPDF}
          >
            <FileUp size={16} />
          </button>
          {!editing && (
            <button
              title="Edit"
              style={{
                backgroundColor: "#2563EB",
                color: "white",
                padding: "8px 16px",
                borderRadius: 6,
              }}
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
            </button>
          )}
          {jobForm.whatsappUrl && (
            <a
              title="Share via WhatsApp"
              href={jobForm.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#25D366",
                color: "white",
                padding: "8px 16px",
                borderRadius: 6,
              }}
            >
              <MessageCircle size={16} />
            </a>
          )}
          {jobForm.pdfUrl && (
            <a
              title="Download PDF"
              href={jobForm.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#4B5563",
                color: "white",
                padding: "8px 16px",
                borderRadius: 6,
              }}
            >
              <Download size={16} />
            </a>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 18 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              zIndex: 9999,
              overflowY: "auto",
              padding: "40px 18px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "white",
                padding: 24,
                borderRadius: 8,
                width: "600px",
                marginTop: "18px",
              }}
            >
              <h4>Edit Job</h4>
              <label>
                Name:
                <input
                  value={jobForm.customerName}
                  onChange={(e) => handleChange("customerName", e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: 8,
                    border: "4px solid #ccc",
                    borderRadius: 4,
                    padding: 8,
                    textTransform: "uppercase",
                  }}
                />
              </label>
              <label>
                Phone:
                <input
                  value={jobForm.customerPhone}
                  onChange={(e) =>
                    handleChange("customerPhone", e.target.value)
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: 8,
                    border: "4px solid #ccc",
                    borderRadius: 4,
                    padding: 8,
                    textTransform: "uppercase",
                  }}
                />
              </label>
              <label>
                Plate:
                <input
                  value={jobForm.plateNumber}
                  onChange={(e) => handleChange("plateNumber", e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: 8,
                    border: "4px solid #ccc",
                    borderRadius: 4,
                    padding: 8,
                    textTransform: "uppercase",
                  }}
                />
              </label>
              <label>
                Date:
                <input
                  type="date"
                  value={jobForm.jobDate.split("T")[0]}
                  onChange={(e) => handleChange("jobDate", e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: 8,
                    border: "4px solid #ccc",
                    borderRadius: 4,
                    padding: 8,
                    textTransform: "uppercase",
                  }}
                />
              </label>
              <label>
                Labour Cost:
                <input
                  type="number"
                  value={jobForm.labourCost}
                  onChange={(e) =>
                    handleChange("labourCost", parseFloat(e.target.value) || 0)
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: 8,
                    border: "4px solid #ccc",
                    borderRadius: 4,
                    padding: 8,
                    textTransform: "uppercase",
                  }}
                />
              </label>
              <h4>Parts</h4>
              {jobForm.jobDetails.map((part, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 8, marginBottom: 8 }}
                >
                  <input
                    placeholder="Description"
                    value={part.description}
                    onChange={(e) =>
                      handleDetailChange(i, "description", e.target.value)
                    }
                    style={{
                      flex: 2,
                      width: 60,
                      display: "block",
                      marginBottom: 8,
                      border: "4px solid #ccc",
                      borderRadius: 4,
                      padding: 8,
                      textTransform: "uppercase",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={part.quantity}
                    onChange={(e) =>
                      handleDetailChange(
                        i,
                        "quantity",
                        parseInt(e.target.value) || 1
                      )
                    }
                    style={{
                      width: 60,
                      display: "block",
                      marginBottom: 8,
                      border: "4px solid #ccc",
                      borderRadius: 4,
                      padding: 8,
                      textTransform: "uppercase",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Cost"
                    value={part.cost}
                    onChange={(e) =>
                      handleDetailChange(i, "cost", parseFloat(e.target.value) || 0)
                    }
                    style={{
                      width: 80,
                      display: "block",
                      marginBottom: 8,
                      border: "4px solid #ccc",
                      borderRadius: 4,
                      padding: 8,
                      textTransform: "uppercase",
                    }}
                  />
                  {jobForm.jobDetails.length > 1 && (
                    <button
                      onClick={() => removePart(i)}
                      style={{
                        color: "red",
                        display: "block",
                        marginBottom: 12,
                        backgroundColor: "#FFF",
                        padding: "8px 16px",
                        borderRadius: 6,
                      }}
                    >
                      <Delete size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPart}
                style={{
                  marginBottom: 12,
                  backgroundColor: "#1E293B",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 6,
                }}
              >
                + Add Parts
              </button>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
              >
                <button
                  style={{
                    marginBottom: 12,
                    backgroundColor: "#1E293B",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 6,
                  }}
                  onClick={() => setEditing(false)}
                >
                  Cancel Editting
                </button>
                <button
                  style={{
                    marginBottom: 12,
                    backgroundColor: "#1E293B",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 6,
                  }}
                  onClick={saveChanges}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={receiptRef}
        style={{
          backgroundColor: "#fff",
          padding: 24,
          border: "3px solid #ccc",
          borderRadius: 6,
          boxShadow: "0 0 6px rgba(0,0,0,0.1)",
          textTransform: "uppercase",
        }}
      >
        <h2 style={{ textAlign: "center", fontSize: 30, fontWeight: "bold" }}>
          Anbaa Automobile
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#1E3A8A",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          {jobForm.isQuote ? "Auto Repair Quotation" : "Auto Repair Invoice"}
        </p>
        <hr style={{ margin: "18px 0", borderTopWidth: "2PX" }} />
        <p style={{ color: "black", fontSize: 18 }}>
          <strong>Invoice Number</strong>:{" "}
          <span style={{ color: "#FF0505", fontSize: 18, fontWeight: "bold" }}>
            {jobForm._id.slice(-7).toUpperCase()}
          </span>
        </p>
        <p style={{ color: "black", fontSize: 18 }}>
          <strong>Name</strong>: {jobForm.customerName}
        </p>
        <p style={{ color: "black", fontSize: 18 }}>
          <strong>Phone</strong>: {jobForm.customerPhone}
        </p>
        <p style={{ color: "black", fontSize: 18 }}>
          <strong>Car</strong>: {jobForm.carModel} ({jobForm.plateNumber})
        </p>
        <p style={{ color: "black", fontSize: 18 }}>
          <strong>Date</strong>:{" "}
          {new Date(jobForm.jobDate).toLocaleDateString()}
        </p>
        <div className="responsive-table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ border: "3px solid #ccc", padding: "8px" }}>
                  <p style={{ color: "red" }}>Item</p>
                </th>
                <th style={{ border: "3px solid #ccc", padding: "8px" }}>
                  <p style={{ color: "red" }}>Qty</p>
                </th>
                <th style={{ border: "3px solid #ccc", padding: "8px" }}>
                  <p style={{ color: "red" }}>Cost Per Unit (RM)</p>
                </th>
                <th style={{ border: "3px solid #ccc", padding: "8px" }}>
                  <p style={{ color: "red" }}>Amount (RM)</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {jobForm.jobDetails.map((part, i) => (
                <tr key={i}>
                  <td style={{ border: "3px solid #ccc", padding: "8px" }}>
                    {" "}
                    <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                      {part.description}
                    </p>
                  </td>
                  <td style={{ border: "3px solid #ccc", padding: "8px" }}>
                    {" "}
                    <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                      {part.quantity}
                    </p>
                  </td>
                  <td style={{ border: "3px solid #ccc", padding: "8px" }}>
                    {" "}
                    <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                      {part.cost.toFixed(2)}
                    </p>
                  </td>
                  <td style={{ border: "3px solid #ccc", padding: "8px" }}>
                    {" "}
                    <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                      {(part.quantity * part.cost).toFixed(2)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr style={{ margin: "18px 0", borderTopWidth: "2PX" }} />
        <p
          style={{
            color: "black",
            fontSize: 18,
            marginTop: 10,
            textAlign: "right",
          }}
        >
          <strong>Labour Cost</strong>: RM {jobForm.labourCost.toFixed(2)}
        </p>
        <p style={{ fontWeight: "bold", fontSize: 18, textAlign: "right" }}>
          Total Cost: RM {updateTotal.toFixed(2)}
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "#1E3A8A",
            fontWeight: "bold",
            marginTop: 20,
          }}
        >
          5, Lorong Taman Perniagaan 1/1, Senawang Business Park, 70450
          Seremban, Negeri Sembilan
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "#1E3A8A",
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          Phone: 014-966 3143
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "#1E3A8A",
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          Thank you for choosing Anbaa Automobile
        </p>
      </div>
      {jobForm.isQuote && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#F8FAFC",
            borderRadius: 8,
          }}
        >
          <h4
            style={{
              marginBottom: 8,
              fontSize: 18,
              color: "#1E3A8A",
              fontWeight: "bold",
            }}
          >
            Job Status
          </h4>
          <p
            style={{
              marginBottom: 8,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Current Status:{" "}
            <span
              style={{
                fontSize: 16,
                color: getStatusColor(jobForm.status),
                fontWeight: "bold",
              }}
            >
              {getStatusLabel(jobForm.status)}
            </span>
          </p>
          <select
            value={jobForm.status || "PJPP"}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: 6,
              border: "3px solid #ccc",
            }}
          >
            <option value="PJPP">Pending Job & Pending Payment</option>
            <option value="PP">Pending Payment</option>
            <option value="PJ">Pending Job</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}

      {/* MODAL 1: CONVERT TO INVOICE */}
      <AnimatePresence>
        {showConvertModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-md shadow-lg max-w-md w-full text-center"
            >
              <h2 className="text-xl font-bold text-blue-800 mb-4">
                Convert to Invoice?
              </h2>
              <p className="mb-6">
                You’re about to mark this job as <strong>Completed</strong> and
                convert the quotation into an invoice. Do you want to proceed?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setShowConvertModal(false);
                    setPendingStatus(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleConvertToInvoice}
                >
                  Convert & Complete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: GENERATE PDF AFTER CONVERSION */}
      <AnimatePresence>
        {showGeneratePdfModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-md shadow-lg max-w-md w-full text-center"
            >
              <h2 className="text-xl font-bold text-green-700 mb-4">
                Generate PDF?
              </h2>
              <p className="mb-6">
                The job has been converted. Would you like to generate and send the PDF invoice now?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => setShowGeneratePdfModal(false)}
                >
                  No, Later
                </button>
                <button
                  className="bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleConfirmGeneratePdf}
                >
                  Yes, Generate PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW MODAL 3: GENERATE PDF AFTER EDIT */}
      <AnimatePresence>
        {showPostEditModal && jobForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-md shadow-lg max-w-md w-full text-center"
            >
              <h2 className="text-xl font-bold text-blue-800 mb-4">
                {jobForm.isQuote ? 'Generate New Quotation?' : 'Generate New Invoice?'}
              </h2>
              <p className="mb-6">
                Changes have been saved. Would you like to generate an updated PDF document?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => setShowPostEditModal(false)}
                >
                  No, Later
                </button>
                <button
                  className="bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleConfirmPostEditGenerate}
                >
                  Yes, Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}