import Link from "next/link";

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

function getStatusColor(status: string) {
  switch (status) {
    case "Completed":
      return "text-blue-600"; // Invoice status
    case "PJPP":
      return "text-red-600";
    case "PJ":
      return "text-[#19642A]";
    case "PP":
      return "text-[#D4009F]";
    default:
      return "text-gray-600";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "Completed":
      return "Completed"; // Invoice label
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

export default function InvoiceTable({ jobs }: { jobs: Job[] }) {
  return (
    <>
      <div className="hidden md:block uppercase">
        <table className="w-full table-auto border text-center">
          <thead>
            <tr className="bg-gray-100">
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
            {jobs.map((job) => (
              <tr key={job._id} className="border-b hover:bg-gray-50">
                <td
                  className={`p-2 border font-bold
                  `}
                >
                  <span className={getStatusColor(job.status)}>
                    {getStatusLabel(job.status)}
                  </span>
                </td>

                <td className="p-2 border uppercase font-bold">
                  {job.invoiceNumber || (
                    <span className="text-blue-600">
                    {job.invoiceNumber || (
                      <span className="text-red-600">
                        Invoice Not Generated
                      </span>
                    )}
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

      {/* Mobile */}
      <div className="md:hidden space-y-4 uppercase">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="border rounded-lg p-4 shadow-lg hover:shadow-2xl"
          >
            <div className={`font-bold ${getStatusColor(job.status)}`}>
              {getStatusLabel(job.status)}
            </div>
            <div className="text-sm font-bold">
              <span className="text-blue-600">
                {job.invoiceNumber || (
                  <span className="text-red-600">Invoice Not Generated</span>
                )}
              </span>
            </div>
            <div className="text-sm font-semibold">
              Name: {job.customerName}
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
