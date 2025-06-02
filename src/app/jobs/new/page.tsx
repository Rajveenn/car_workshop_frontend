// File: app/jobs/new/page.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
import api from "../../../lib/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CircleArrowLeft } from "lucide-react";
import Loader from "@/app/components/Loader";

interface JobDetail {
  description: string;
  quantity: number;
  cost: number;
}

export default function NewJobPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [carData, setCarData] = useState<{ make: string; models: string[] }[]>(
    []
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [labourCost, setLabourCost] = useState(0);
  const [jobDate, setJobDate] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([
    { description: "", quantity: 1, cost: 0 },
  ]);
  const [formType, setFormType] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .get("/car/carData")
      .then((res) => {
        setCarData(res.data.carData || []);
        setTimeout(() => setLoading(false), 500);
      })
      .catch((err) => console.error(err));
  }, []);

  const formTypes = ["Quotation", "Invoice"];
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

  const models = useMemo(
    () => carData.find((c) => c.make === make)?.models || [],
    [carData, make]
  );

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
    setMake("");
    setModel("");
    setYear("");
    setPlateNumber("");
    setLabourCost(0);
    setJobDate("");
    setJobDetails([{ description: "", quantity: 1, cost: 0 }]);
  };

  const changeForm = () => {
    setFormType("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();
    const finalQuoteStatus = formType === "Invoice" ? false : true;
    const status = formType === "Invoice" ? "Completed" : "PJPP";
    try {
      await api.post("/jobs", {
        customerName,
        customerPhone,
        carModel: make + " " + model,
        year,
        plateNumber,
        labourCost,
        jobDate,
        jobDetails: jobDetails.map((d) => ({
          ...d,
          quantity: d.quantity || 1,
        })),
        isQuote: finalQuoteStatus,
        status
      });
      const successSound = new Audio("/sounds/success.mp3");
      successSound.play();
      toast.success("Success");
      setLoading(false);
      router.push("/jobs");
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err) && err.response) {
        setLoading(false);
        const successSound = new Audio("/sounds/alert.mp3");
        successSound.play();
        toast.error("❌ Backend Error.");
      } else {
        setLoading(false);
        const successSound = new Audio("/sounds/alert.mp3");
        successSound.play();
        toast.error("❌ Failed to add data.");
      }
    }
  };
  if (loading) return <Loader />;
  return (
    <div className="max-w-[9/10] mx-auto p-6 bg-white shadow rounded">
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
      </div>
      <h1 className="text-2xl font-bold mb-4">Create New Job</h1>
      {!formType && (
        <select
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
          required
          className="w-full border p-2 uppercase text-gray-500"
        >
          <option value="Quotation">Select Form Type</option>
          {formTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      )}
      {formType && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold mt-4 mb-2">{formType} Form</h2>
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
          <select
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
            required
            className="w-full border p-2 uppercase text-gray-500"
          >
            <option value="" disabled>
              Select Make
            </option>
            {carData.map((c) => (
              <option key={c.make} value={c.make}>
                {c.make}
              </option>
            ))}
          </select>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make}
            required
            className="w-full border p-2 uppercase text-gray-500"
          >
            <option value="" disabled>
              {make ? "Select Model" : "Choose Make First"}
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 uppercase">
            Fill in cars year manufactured (e.g., Year: 2005)
          </p>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            placeholder="Year (e.g. 2025)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full border p-2 uppercase text-gray-500"
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
                onChange={(e) =>
                  handleChange(index, "quantity", e.target.value)
                }
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
              Submit Data
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="flex bg-gray-400 justify-between items-center text-left px-4 py-2 rounded font-medium text-white text-xs"
            >
              Clear Form
            </button>
            <button
              type="button"
              onClick={changeForm}
              className="flex bg-[#25D366] justify-between items-center text-left px-4 py-2 rounded font-medium text-white text-xs"
            >
              Change Form
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
