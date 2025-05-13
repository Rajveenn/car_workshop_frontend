// File: app/jobs/[id]/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { toast } from "react-hot-toast";
import Loader from "../../components/Loader";

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
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
        if (res.data.whatsappUrl) {
          setUploadedImageUrl(res.data.pdfUrl);
        }
      } catch (error) {
        console.error("Failed to fetch jobs", error);
        router.push("/jobs");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id, router]);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      if (!receiptRef.current)
        return toast.error("❌ Receipt reference is missing");

      const canvas = await html2canvas(receiptRef.current);
      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const imgProps = pdf.getImageProperties(imageData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append("file", pdfBlob, `invoice-${invoiceNumber}.pdf`);

      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_API_PRESET1;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      if (!uploadPreset || !cloudName) {
        throw new Error("Cloudinary environment variables are not set");
      }

      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!data.secure_url) throw new Error("Cloudinary upload failed");
      setUploadedImageUrl(data.secure_url);

      const whatsappUrl =
        job?.customerPhone && data.secure_url
          ? `https://wa.me/${job.customerPhone}?text=${encodeURIComponent(
              `Hi ${job.customerName}, here’s your invoice:\n${data.secure_url}`
            )}`
          : null;

      if (job && whatsappUrl) {
        await api.put(`/jobs/${job._id}`, {
          pdfUrl: data.secure_url,
          whatsappUrl,
          invoiceNumber,
        });
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `Invoice-${invoiceNumber}.pdf`;
      link.click();

      toast.success("Success");
      router.refresh();
    } catch (err) {
      console.error("[PDF ERROR]", err);
      toast.error("❌ Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!job) return <p>Job not found</p>;

  const invoiceNumber = `${job._id.slice(-7).toUpperCase()}`;

  const whatsappLink =
    job.whatsappUrl ||
    (job.customerPhone && uploadedImageUrl
      ? `https://wa.me/${job.customerPhone}?text=${encodeURIComponent(
          `Hi ${job.customerName}, here’s your invoice:\n${uploadedImageUrl}`
        )}`
      : "");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => router.push("/jobs")}
          className="text-blue-700 underline text-xs"
        >
          ← Back
        </button>
        <div className="space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
          >
            Download PDF
          </button>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              className="text-xs bg-green-600 text-white px-2 py-1 rounded"
            >
              Share via WhatsApp
            </a>
          )}
        </div>
      </div>

      <div
        ref={receiptRef}
        className="bg-white shadow p-6 rounded space-y-4 border text-sm uppercase"
      >
        <h1 className="text-2xl font-bold text-center">Anbaa Automobile</h1>
        <p className="text-center text-lg text-blue-800">Auto Repair Invoice</p>

        <div className="flex justify-between text-xs border-t pt-2">
          <span>
            <strong>Invoice Number:</strong>{" "}
            <span className="font-bold text-red-600">{invoiceNumber}</span>
          </span>
          <span>
            <strong>Date:</strong>{" "}
            <span className="font-bold text-red-600">
              {new Date(job.jobDate).toLocaleDateString()}
            </span>
          </span>
        </div>

        <div className="border-t pt-3">
          <p>
            <strong>Customer:</strong> {job.customerName}
          </p>
          <p>
            <strong>Phone:</strong> {job.customerPhone}
          </p>
          <p>
            <strong>Car:</strong> {job.carModel} ({job.plateNumber})
          </p>
        </div>

        <div className="border-t pt-3">
          <h2 className="font-semibold mb-2">Parts / Services</h2>
          <table className="w-full text-left text-xs border">
            <thead className="bg-gray-100 text-center">
              <tr>
                <th className="border px-2 py-1 ">
                  {" "}
                  <span className="text-red-600">Item</span>
                </th>
                <th className="border px-2 py-1">
                  <span className="text-red-600">Qty</span>
                </th>
                <th className="border px-2 py-1">
                  <span className="text-red-600">Cost (RM)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {job.jobDetails.map((item, i) => (
                <tr key={i} className="text-center">
                  <td className="border px-2 py-1 font-bold">
                    <span className="text-blue-800">{item.description}</span>
                  </td>
                  <td className="border px-2 py-1 font-bold">
                    <span className="text-blue-800">{item.quantity}</span>
                  </td>
                  <td className="border px-2 py-1 font-bold">
                    <span className="text-blue-800">
                      {item.cost.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-3 text-right space-y-1">
          <p>
            <strong>Labour:</strong> RM {job.labourCost.toFixed(2)}
          </p>
          <p className="text-lg font-bold">
            Total: RM {job.totalCost.toFixed(2)}
          </p>
        </div>

        <p className="text-center text-xs text-gray-800 pt-1 font-bold">
          5, Lorong Taman Perniagaan 1/1, Senawang Business Park, 70450
          Seremban, Negeri Sembilan
        </p>
        <p className="text-center text-xs text-gray-700 pt-1 font-bold">
          Phone: 014-966 3143
        </p>
        <p className="text-center text-xs text-gray-700 pt-1 font-bold">
          Thank you for choosing Anbaa Automobile
        </p>
      </div>
    </div>
  );
}
