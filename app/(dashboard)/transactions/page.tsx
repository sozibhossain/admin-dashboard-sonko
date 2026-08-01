"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { CustomPagination } from "@/components/custom-pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewModal } from "@/components/view-modal";
import { getAdminTransactions, type Transaction } from "@/lib/api";

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "successful":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const resolveCustomer = (txn: Transaction) => {
  return (
    txn.user?.name ||
    txn.user?.email ||
    txn.userTo?.name ||
    txn.userTo?.email ||
    "-"
  );
};

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: () => getAdminTransactions({ limit: 100 }),
  });

  const transactions = data?.data.transactions ?? [];

  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      const dateValue = item.createdAt
        ? new Date(item.createdAt).toISOString().slice(0, 10)
        : "";
      return (
        item._id.toLowerCase().includes(searchId.toLowerCase()) &&
        resolveCustomer(item)
          .toLowerCase()
          .includes(searchName.toLowerCase()) &&
        dateValue.includes(searchDate)
      );
    });
  }, [transactions, searchId, searchName, searchDate]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const totalAmount = transactions.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  );
  const successfulCount = transactions.filter(
    (t) => ["delivered", "successful"].includes((t.status ?? "").toLowerCase()),
  ).length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm">Dashboard - Transactions</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {transactions.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {successfulCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.length > 0
                ? ((successfulCount / transactions.length) * 100).toFixed(1)
                : "0"}
              % success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {transactions[0]?.currency ?? "GMD"} {totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Trading volume</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <Input
              placeholder="Transaction ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <Input
              placeholder="Customer Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <Input
              placeholder="Date"
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchId("");
                setSearchName("");
                setSearchDate("");
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Customer
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Type
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Amount
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr
                    key={`txn-skeleton-${idx}`}
                    className="border-b border-gray-200"
                  >
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-8" />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-6 text-sm text-gray-500" colSpan={7}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      {item._id}
                    </td>
                    <td className="px-6 py-3 text-gray-900">
                      {resolveCustomer(item)}
                    </td>
                    <td className="px-6 py-3 text-gray-900">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-900">
                      {item.type ?? "-"}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      {item.currency ?? "GMD"} {Number(item.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status ?? "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Eye
                        className="h-4 w-4 text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setViewTransaction(item)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ViewModal
        open={!!viewTransaction}
        title="Transaction Details"
        description={
          viewTransaction ? `Transaction ${viewTransaction._id}` : undefined
        }
        onClose={() => setViewTransaction(null)}
        fields={[
          { label: "Transaction ID", value: viewTransaction?._id ?? "-" },
          {
            label: "Customer",
            value: viewTransaction ? resolveCustomer(viewTransaction) : "-",
          },
          {
            label: "Date & Time",
            value: viewTransaction?.createdAt
              ? new Date(viewTransaction.createdAt).toLocaleString()
              : "-",
          },
          { label: "Type", value: viewTransaction?.type ?? "-" },
          {
            label: "Amount",
            value: viewTransaction
              ? `${viewTransaction.currency ?? "GMD"} ${Number(viewTransaction.amount ?? 0).toLocaleString()}`
              : "-",
          },
          { label: "Status", value: viewTransaction?.status ?? "-" },
          { label: "From", value: viewTransaction?.from ?? "-" },
          { label: "To", value: viewTransaction?.to ?? "-" },
          { label: "Flag", value: viewTransaction?.flag ?? "-" },
        ]}
      />
    </div>
  );
}
