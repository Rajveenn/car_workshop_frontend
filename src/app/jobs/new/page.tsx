// File: app/jobs/new/page.tsx
"use client";
import { useState, useMemo } from "react";
import api from "../../../lib/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface JobDetail {
  description: string;
  quantity: number;
  cost: number;
}

export default function NewJobPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [labourCost, setLabourCost] = useState(0);
  const [jobDate, setJobDate] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([
    { description: "", quantity: 1, cost: 0 },
  ]);
  const router = useRouter();

  // Update a single job detail field
  const handleChange = (
    index: number,
    field: keyof JobDetail,
    value: string | number
  ) => {
    const updated = jobDetails.map((item, i) =>
      i === index
        ? {
            ...item,
            [field]:
              field === "quantity" || field === "cost"
                ? Math.max(0, Number(value))
                : (value as string),
          }
        : item
    );
    setJobDetails(updated);
  };

  // Add a new blank detail row
  const addJobDetail = () => {
    setJobDetails([...jobDetails, { description: "", quantity: 1, cost: 0 }]);
  };

  // Remove a detail row
  const removeJobDetail = (index: number) => {
    setJobDetails(jobDetails.filter((_, i) => i !== index));
  };

  // Calculate total on the fly
  const totalCost = useMemo(() => {
    const partsTotal = jobDetails.reduce(
      (sum, d) => sum + d.quantity * d.cost,
      0
    );
    return partsTotal + labourCost;
  }, [jobDetails, labourCost]);

  // Clear all form fields
  const clearForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCarModel("");
    setPlateNumber("");
    setLabourCost(0);
    setJobDate("");
    setJobDetails([{ description: "", quantity: 1, cost: 0 }]);
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
      toast.success("Success");
      clearForm();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error("❌ Failed to add data.");
      } else {
        toast.error("❌ Failed to add data.");
      }
    }
  };

  return (
    <div className="max-w-[9/10] mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create New Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 uppercase">
          Fill in customers name (e.g., Name: Raj)
        </p>
        <input
          className="w-full border p-2 uppercase"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500 uppercase">
          Fill in customers mobile number (e.g., mobile: 0138606455)
        </p>
        <input
          className="w-full border p-2 uppercase"
          placeholder="Customer Phone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500 uppercase">
          Fill in customers car model (e.g., Model: Proton Wira)
        </p>
        <input
          className="w-full border p-2 uppercase"
          placeholder="Car Model"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500 uppercase">
          Fill in customers plate number (e.g., Number: NBL8480)
        </p>
        <input
          className="w-full border p-2 uppercase"
          placeholder="Plate Number"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500 uppercase">
          Fill in repair/service date
        </p>
        <input
          type="date"
          className="w-full border p-2"
          value={jobDate}
          onChange={(e) => setJobDate(e.target.value)}
          required
        />

        <h2 className="font-semibold">Job Details</h2>
        <p className="text-sm text-gray-500 uppercase">
          Add all parts or services performed (e.g., Engine Oil Change, Brake
          Pads)
        </p>
        <p className="text-sm text-gray-500 uppercase">
          Fill in quantity and cost for each item (e.g., Qty: 1, Cost: 150)
        </p>

        {jobDetails.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border p-2 uppercase"
              placeholder="Description (e.g. Oil Change)"
              value={item.description}
              onChange={(e) =>
                handleChange(index, "description", e.target.value)
              }
              required
            />
            <input
              type="number"
              className="sm:w-24 border p-2"
              placeholder="Qty"
              min="0"
              value={item.quantity}
              onChange={(e) => handleChange(index, "quantity", e.target.value)}
            />
            <input
              type="number"
              className="sm:w-32 border p-2"
              placeholder="Cost (RM)"
              min="0"
              value={item.cost}
              onChange={(e) => handleChange(index, "cost", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => removeJobDetail(index)}
              className="text-red-600 text-sm hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addJobDetail}
          className="text-blue-700 underline"
        >
          + Add More
        </button>
        <p className="text-sm text-gray-500 uppercase">
          Fill in labour cost or any other costs (e.g., Cost: 150)
        </p>
        <input
          type="number"
          className="w-full border p-2"
          placeholder="Labour Cost (RM)"
          min="0"
          value={labourCost}
          onChange={(e) => setLabourCost(Math.max(0, Number(e.target.value)))}
          required
        />

        <div className="bg-gray-100 p-4 rounded text-right font-semibold">
          Total Cost: RM {totalCost.toFixed(2)}
        </div>

        <div className="flex space-x-2 justify-center">
          <button
            type="submit"
            className="flex bg-blue-700 justify-between items-center text-left px-4 py-2 rounded font-medium text-white text-xs"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="flex bg-gray-400 justify-between items-center text-left px-4 py-2 rounded font-medium text-white text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => router.push("/jobs")}
            className="bg-slate-800 flex justify-between items-center text-left px-4 py-2 rounded font-medium text-white text-xs"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
