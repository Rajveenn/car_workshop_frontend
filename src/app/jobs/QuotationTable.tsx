import Link from "next/link";

interface Job {
  _id: string;
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  totalCost: number;
  jobDate: string;
  invoiceNumber: string; // This property is used for the quotation number as well
  carModel: string;
  status: string;
  isQuote?: boolean;
}

// Returns Tailwind CSS classes for a badge-style background
function getStatusClasses(status: string) {
  switch (status) {
    case "Completed":
      return "bg-blue-600 text-white";
    case "PJPP":
      return "bg-red-600 text-white";
    case "PJ":
      return "bg-green-700 text-white";
    case "PP":
      return "bg-pink-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "Completed":
      return "Completed";
    case "PJPP":
      return "Pending Job & Payment";
    case "PJ":
      return "Pending Job";
    case "PP":
      return "Pending Payment";
    default:
      return "Unknown";
  }
}

export default function QuotationTable({ jobs }: { jobs: Job[] }) {
  return (
    <>
      <div className="hidden md:block uppercase">
        <table className="w-full table-auto border text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Quotation Number</th>
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
            {jobs.map((job) => (
              <tr key={job._id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">
                  {/* Updated Status Display */}
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusClasses(
                      job.status
                    )}`}
                  >
                    {getStatusLabel(job.status)}
                  </span>
                </td>
                <td className="p-2 border uppercase font-bold ">
                  {/* Simplified Quotation Number Display */}
                  {job.invoiceNumber ? (
                    job.invoiceNumber
                  ) : (
                    <span className="text-red-600 font-normal normal-case">
                      Not Generated
                    </span>
                  )}
                </td>
                <td className="p-2 border font-semibold">{job.customerName}</td>
                <td className="p-2 border font-semibold">
                  {job.customerPhone}
                </td>
                <td className="p-2 border font-semibold">{job.carModel}</td>
                <td className="p-2 border font-semibold">{job.plateNumber}</td>
                <td className="p-2 border font-semibold">RM {job.totalCost}</td>
                <td className="p-2 border font-semibold">
                  {new Date(job.jobDate).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <Link
                    href={`/jobs/${job._id}`}
                    className="underline text-blue-800 font-bold"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4 uppercase">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="border rounded-lg p-4 shadow-lg hover:shadow-2xl"
          >
            <div className="flex justify-between items-start mb-2">
              {/* Updated Status Display for Mobile */}
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusClasses(
                  job.status
                )}`}
              >
                {getStatusLabel(job.status)}
              </span>
              <div className="text-sm font-bold text-right">
                 {/* Simplified Quotation Number Display for Mobile */}
                {job.invoiceNumber ? (
                  <span className="text-blue-600">{job.invoiceNumber}</span>
                ) : (
                  <span className="text-red-600 font-normal normal-case">Not Generated</span>
                )}
              </div>
            </div>

            <div className="text-sm font-semibold mt-4">
              {job.customerName}
            </div>
            <div className="text-sm font-semibold">Model: {job.carModel}</div>
            <div className="text-sm font-semibold">
              Plate: {job.plateNumber}
            </div>
            <div className="text-sm font-semibold">
              Total: RM {job.totalCost}
            </div>
            <div className="text-sm font-semibold">
              Date: {new Date(job.jobDate).toLocaleDateString()}
            </div>
            <div className="mt-2">
              <Link
                href={`/jobs/${job._id}`}
                className="text-blue-800 underline text-xs font-bold"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}