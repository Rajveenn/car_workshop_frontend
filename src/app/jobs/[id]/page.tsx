// FULLY EDITABLE VERSION WITH MODAL FORM STYLE
"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { toast } from "react-hot-toast";
import Loader from "../../components/Loader";
import html2pdf from "html2pdf.js";
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
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [jobForm, setJobForm] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const receiptRef = useRef(null);
  const [editCount, setEditCount] = useState(0);

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
      toast.success("Changes saved.");
    } catch {
      toast.error("❌ Failed to save.");
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      if (!receiptRef.current || !jobForm) return toast.error("Missing data");
      const baseInvoice = `${jobForm._id.slice(-7).toUpperCase()}`;
      const invoiceNumber =
        editCount > 0 ? `${baseInvoice}-${editCount}` : baseInvoice;
      const element = receiptRef.current as HTMLElement;
      const opt = {
        margin: 0,
        filename: `${jobForm.customerName}_${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      const pdfBlob: Blob = await html2pdf()
        .set(opt)
        .from(element)
        .output("blob");

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
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");

      const phoneNumber = jobForm.customerPhone
        .replace(/[^\d]/g, "")
        .replace(/^0/, "");
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=Here%20is%20your%20invoice%20link%20:%20${data.secure_url}`;

      await api.put(`/jobs/${jobForm._id}`, {
        ...jobForm,
        totalCost: updateTotal,
        pdfUrl: data.secure_url,
        whatsappUrl,
        invoiceNumber,
      });
      // const link = document.createElement("a");
      // link.href = whatsappUrl;
      // link.target = "_blank";
      // link.rel = "noopener noreferrer";
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);

      window.open(
        `https://api.whatsapp.com/send?phone=${phoneNumber}&text=Here%20is%20your%20invoice%20link%20:%20${data.secure_url}`,
        "_blank",
        "noopener, noreferrer"
      );

      fetchJob();

      toast.success("PDF uploaded");
    } catch (err) {
      console.error("[PDF ERROR]", err);
      toast.error("❌ Failed to upload PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!jobForm) return;
    try {
      await api.put(`/jobs/${jobForm._id}`, { status: newStatus });
      toast.success("Status updated");
      fetchJob();
    } catch {
      toast.error("❌ Failed to update status");
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
        return "#D4009F"
      case "PJ":
        return "#19642A"; // Red
      case "Completed":
        return "#2563eb"; // Blue
      default:
        return "#000000"; // Default black
    }
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
          {/* {showPdfButton && ( */}
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
          {/* )} */}
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
                    handleChange("labourCost", parseFloat(e.target.value))
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
                        parseInt(e.target.value)
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
                      handleDetailChange(i, "cost", parseFloat(e.target.value))
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
          Auto Repair Invoice
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
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 12,
            fontSize: 18,
            textAlign: "center",
          }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
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
                  <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                    {part.description}
                  </p>
                </td>
                <td
                  style={{
                    border: "3px solid #ccc",
                    padding: "8px",
                  }}
                >
                  <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                    {part.quantity}
                  </p>
                </td>
                <td
                  style={{
                    border: "3px solid #ccc",
                    padding: "8px",
                  }}
                >
                  <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                    {part.cost.toFixed(2)}
                  </p>
                </td>
                <td
                  style={{
                    border: "3px solid #ccc",
                    padding: "8px",
                  }}
                >
                  <p style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                    {(part.quantity * part.cost).toFixed(2)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          Total Cost: RM {jobForm.totalCost.toFixed(2)}
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
          style={{ padding: "8px", borderRadius: 6, border: "3px solid #ccc" }}
        >
          <option value="PJPP">Pending Job & Pending Payment</option>
          <option value="PP">Pending Payment</option>
          <option value="PJ">Pending Job</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
    </div>
  );
}
