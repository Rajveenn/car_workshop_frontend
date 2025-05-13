// File: app/jobs/new/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import axios from "axios";

interface JobDetail {
  description: string;
  quantity: number;
  cost: number;
}

export default function NewJobPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [labourCost, setLabourCost] = useState(0);
  const [jobDate, setJobDate] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([
    { description: "", quantity: 1, cost: 0 }
  ]);

  const handleChange = (index: number, field: keyof JobDetail, value: string | number) => {
    const updated = jobDetails.map((item, i) =>
      i === index
        ? {
            ...item,
            [field]: field === "quantity" || field === "cost"
              ? Math.max(0, Number(value))
              : value
          }
        : item
    );
    setJobDetails(updated);
  };

  const addJobDetail = () => {
    setJobDetails([...jobDetails, { description: "", quantity: 1, cost: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post("/jobs", {
        customerName,
        customerPhone,
        carModel,
        plateNumber,
        labourCost,
        jobDate,
        jobDetails: jobDetails.map((d) => ({
          ...d,
          quantity: d.quantity || 1,
        })),
      });
      router.push("/jobs");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data?.message || "Failed to create job");
      } else {
        alert("Failed to create job");
      }
    }
  };

  const totalCost = useMemo(() => {
    const partsTotal = jobDetails.reduce((sum, d) => sum + (d.quantity * d.cost), 0);
    return partsTotal + labourCost;
  }, [jobDetails, labourCost]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-4">Create New Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-2 uppercase" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
        <input className="w-full border p-2 uppercase" placeholder="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
        <input className="w-full border p-2 uppercase" placeholder="Car Model" value={carModel} onChange={e => setCarModel(e.target.value)} required />
        <input className="w-full border p-2 uppercase" placeholder="Plate Number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} required />
        <input type="date" className="w-full border p-2" value={jobDate} onChange={e => setJobDate(e.target.value)} required />

        <h2 className="font-semibold">Job Details</h2>
        <p className="text-sm text-gray-500 uppercase">Add all parts or services performed (e.g., Engine Oil Change, Brake Pads)</p>
        <p className="text-sm text-gray-500 uppercase">Fill in quantity and cost for each item (e.g., Qty: 1, Cost: 150)</p>

        {jobDetails.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2">
            <input className="flex-1 border p-2 uppercase" placeholder="Description (e.g. Oil Change)" value={item.description} onChange={e => handleChange(index, "description", e.target.value)} required />
            <input type="number" className="sm:w-24 border p-2" placeholder="Qty" min="0" value={item.quantity} onChange={e => handleChange(index, "quantity", e.target.value)} />
            <input type="number" className="sm:w-32 border p-2" placeholder="Cost (RM)" min="0" value={item.cost} onChange={e => handleChange(index, "cost", e.target.value)} required />
          </div>
        ))}
        <button type="button" onClick={addJobDetail} className="text-blue-700 underline">+ Add More</button>

        <input type="number" className="w-full border p-2" placeholder="Labour Cost (RM)" min="0" value={labourCost} onChange={e => setLabourCost(Math.max(0, Number(e.target.value)))} required />

        <div className="bg-gray-100 p-4 rounded text-right font-semibold">
          Total Cost: RM {totalCost.toFixed(2)}
        </div>

        <button type="submit" className="w-full bg-blue-700 text-white px-4 py-2 rounded">Submit</button>
      </form>
    </div>
  );
}
