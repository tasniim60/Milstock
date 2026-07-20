import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { CheckCircle, Search } from "lucide-react";
import { useLocation } from "react-router";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";
import { MAX_DATE_INPUT, MIN_DATE_INPUT } from "../lib/dateValidation";
const MovementLogs = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [message, setMessage] = useState("");
  const { data: movements, loading, error, refresh: refreshMovements } = useApiResource(() => api.movements.list(), []);
  const { data: productWarehouses, refresh: refreshProductWarehouses } = useApiResource(() => api.productWarehouses.list(), []);
  const query = new URLSearchParams(location.search);
  const warehouseFilter = query.get("warehouse_id");
  const statusQueryFilter = query.get("status");
  const matchesWarehouseFilter = (movement) => {
    if (!warehouseFilter) return true;
    return [
      movement.from_warehouse?._id || movement.from_warehouse,
      movement.to_warehouse?._id || movement.to_warehouse,
      movement.reference_id?._id || movement.reference_id
    ].some((warehouseId) => String(warehouseId || "") === String(warehouseFilter));
  };
  const pendingTransfers = useMemo(() => {
    const pendingRows = movements.filter((movement) => matchesWarehouseFilter(movement) && movement.movement_type === "warehouse_transfer" && movement.status === "pending" && movement.order_id);
    const byOrder = new Map();
    pendingRows.forEach((movement) => {
      const orderId = movement.order_id?._id || movement.order_id;
      if (!byOrder.has(orderId)) {
        byOrder.set(orderId, {
          orderId,
          requestId: String(orderId).slice(-8).toUpperCase(),
          requester: movement.requested_by?.name || movement.user_id?.name || "Unknown requester",
          approvedAt: movement.approved_at || movement.createdAt,
          source: movement.from_warehouse?.name || movement.reference_id?.name || "Source warehouse",
          destination: movement.to_warehouse?.name || "Destination warehouse",
          rows: []
        });
      }
      const productId = String(movement.product_id?._id || movement.product_id || "");
      const sourceWarehouseId = String(movement.from_warehouse?._id || movement.from_warehouse || "");
      const destinationWarehouseId = String(movement.to_warehouse?._id || movement.to_warehouse || "");
      const sourceStock = productWarehouses.find((row) => String(row.product_id?._id || row.product_id || "") === productId && String(row.warehouse_id?._id || row.warehouse_id || "") === sourceWarehouseId);
      const destinationStock = productWarehouses.find((row) => String(row.product_id?._id || row.product_id || "") === productId && String(row.warehouse_id?._id || row.warehouse_id || "") === destinationWarehouseId);
      const requestedQuantity = Number(movement.requested_quantity || movement.stock || 0);
      const sourceQuantity = Number(sourceStock?.quantity || 0);
      byOrder.get(orderId).rows.push({
        movementId: movement._id,
        productName: movement.product_id?.name || "Unknown product",
        quantity: requestedQuantity,
        sourceStock: sourceQuantity,
        destinationStock: destinationStock?.quantity ?? 0,
        insufficient: sourceQuantity < requestedQuantity
      });
    });
    return Array.from(byOrder.values()).map((transfer) => ({
      ...transfer,
      hasInsufficientStock: transfer.rows.some((row) => row.insufficient)
    }));
  }, [movements, productWarehouses, warehouseFilter]);
  const movementData = movements.filter((movement) => matchesWarehouseFilter(movement) && movement.status !== "pending").map((movement) => ({
    id: movement._id.slice(-8).toUpperCase(),
    date: formatDate(movement.createdAt),
    itemId: movement.product_id?._id?.slice(-8).toUpperCase() || "N/A",
    itemName: movement.product_id?.name || "Unknown product",
    action: movement.movement_type === "consumption" || movement.movement_type === "consumption_cancelled" ? movement.movement_type : movement.change_type,
    status: movement.status,
    quantity: `${movement.change_type === "in" ? "+" : movement.change_type === "out" ? "-" : ""}${movement.stock}`,
    location: movement.from_warehouse?.name || movement.to_warehouse?.name || movement.reference_id?.name || "No warehouse",
    user: movement.performed_by?.name || movement.user_id?.name || "Unknown user",
    reason: movement.reference_type || "Inventory movement"
  }));
  const filteredData = movementData.filter((movement) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchesSearch = String(movement.id ?? "").toLowerCase().includes(search) || String(movement.itemName ?? "").toLowerCase().includes(search) || String(movement.itemId ?? "").toLowerCase().includes(search);
    const matchesAction = actionFilter === "all" || movement.action === actionFilter;
    const matchesStatus = !statusQueryFilter || movement.status === statusQueryFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });
  const columns = [
    { key: "id", header: "Movement ID" },
    { key: "date", header: "Date" },
    {
      key: "item",
      header: "Item",
      render: (row) => <div>
          <p className="font-medium text-foreground">{row.itemName}</p>
          <p className="text-sm text-muted-foreground">{row.itemId}</p>
        </div>
    },
    {
      key: "action",
      header: "Action",
      render: (row) => <Badge variant={row.action === "in" ? "success" : row.action === "out" ? "warning" : "info"}>
          {row.action === "consumption" ? "Consumption" : row.action === "consumption_cancelled" ? "Consumption Cancelled" : row.action === "in" ? "Stock In" : row.action === "out" ? "Stock Out" : "Transfer"}
        </Badge>
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (row) => <span className={`font-semibold ${row.action === "in" ? "text-[#6A7B4D]" : row.action === "out" ? "text-[#B85C50]" : "text-[#4B5B3A]"}`}>
          {row.quantity}
        </span>
    },
    { key: "location", header: "Warehouse" },
    { key: "user", header: "Performed By" },
    { key: "reason", header: "Reference" }
  ];
  const completeMovement = async (orderId) => {
    setBusyOrderId(orderId);
    setMessage("");
    try {
      await api.movements.completeTransfer(orderId, "Completed from Movement Logs");
      setMessage("Movement completed successfully.");
      refreshMovements();
      refreshProductWarehouses();
    } catch (requestError) {
      setMessage(requestError.message || "Unable to complete movement.");
    } finally {
      setBusyOrderId("");
    }
  };
  const cancelTransfer = async (orderId) => {
    setBusyOrderId(orderId);
    setMessage("");
    try {
      await api.orders.updateStatus(orderId, "cancelled", "Cancelled from Movement Logs because source stock is insufficient");
      setMessage("Transfer cancelled. Pending movement records were cancelled.");
      refreshMovements();
      refreshProductWarehouses();
    } catch (requestError) {
      setMessage(requestError.message || "Unable to cancel transfer.");
    } finally {
      setBusyOrderId("");
    }
  };
  const exportColumns = [
    { key: "id", header: "Movement ID" },
    { key: "date", header: "Date" },
    { key: "itemId", header: "Item ID" },
    { key: "itemName", header: "Item Name" },
    { key: "action", header: "Action" },
    { key: "quantity", header: "Quantity" },
    { key: "location", header: "Warehouse" },
    { key: "user", header: "Performed By" },
    { key: "reason", header: "Reference" }
  ];
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Inventory Movement Logs" subtitle="Complete history of all inventory transactions" />
      {message && <div className="rounded-xl border border-[#4E4631]/10 bg-white px-4 py-3 text-sm text-[#2E3A24]">{message}</div>}

      <div className="flex gap-2">
        <Button type="button" variant={activeTab === "pending" ? "primary" : "outline"} onClick={() => setActiveTab("pending")}>Pending Transfers</Button>
        <Button type="button" variant={activeTab === "history" ? "primary" : "outline"} onClick={() => setActiveTab("history")}>Movement History</Button>
      </div>

      {activeTab === "pending" && <div className="space-y-4">
        {loading && <p className="text-sm text-[#5A6B50]">Loading pending transfers...</p>}
        {!loading && pendingTransfers.length === 0 && <div className="rounded-xl border border-[#4E4631]/10 bg-white p-6 text-sm text-[#5A6B50]">No pending transfers are waiting for completion.</div>}
        {pendingTransfers.map((transfer) => <div key={transfer.orderId} className="rounded-2xl border border-[#4E4631]/10 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-xs text-[#5A6B50]">Request ID</p>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[#2E3A24]">{transfer.requestId}</h3>
                {transfer.hasInsufficientStock && <Badge variant="danger">Insufficient Stock</Badge>}
              </div>
              <p className="text-sm text-[#5A6B50]">{transfer.source} &rarr; {transfer.destination}</p>
              <p className="text-xs text-[#5A6B50]">Requester: {transfer.requester} | Approved: {formatDate(transfer.approvedAt)}</p>
              {transfer.hasInsufficientStock && <p className="mt-2 text-sm text-[#D4183D]">Source warehouse does not have enough stock. Restock the source warehouse or cancel this transfer.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {transfer.hasInsufficientStock && <Button type="button" variant="danger" onClick={() => cancelTransfer(transfer.orderId)} disabled={busyOrderId === transfer.orderId}>
                {busyOrderId === transfer.orderId ? "Cancelling..." : "Cancel Transfer"}
              </Button>}
              <Button type="button" onClick={() => completeMovement(transfer.orderId)} disabled={busyOrderId === transfer.orderId || transfer.hasInsufficientStock}>
                <CheckCircle className="w-4 h-4" />
                {busyOrderId === transfer.orderId ? "Completing..." : "Complete Movement"}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#4E4631]/10 text-left text-[#5A6B50]">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Requested Quantity</th>
                  <th className="py-2 pr-3">Current Source Stock</th>
                  <th className="py-2 pr-3">Current Destination Stock</th>
                </tr>
              </thead>
              <tbody>
                {transfer.rows.map((row) => <tr key={row.movementId} className="border-b border-[#4E4631]/5">
                  <td className="py-2 pr-3 font-medium text-[#2E3A24]">{row.productName}</td>
                  <td className="py-2 pr-3">{row.quantity}</td>
                  <td className={`py-2 pr-3 ${row.insufficient ? "font-semibold text-[#D4183D]" : ""}`}>
                    {row.sourceStock}
                    {row.insufficient && <span className="ml-2 text-xs">(needs {row.quantity})</span>}
                  </td>
                  <td className="py-2 pr-3">{row.destinationStock}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>)}
      </div>}

      {activeTab === "history" && <>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
    placeholder="Search by movement ID, item name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-12"
  />
          </div>
        </div>
        <Select
    options={[
      { value: "all", label: "All Actions" },
      { value: "in", label: "Stock In" },
      { value: "out", label: "Stock Out" },
      { value: "transfer", label: "Transfer" },
      { value: "consumption", label: "Consumption" },
      { value: "consumption_cancelled", label: "Consumption Cancelled" }
    ]}
    value={actionFilter}
    onChange={(e) => setActionFilter(e.target.value)}
  />
        <Input type="date" min={MIN_DATE_INPUT} max={MAX_DATE_INPUT} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground">
          {loading ? "Loading movement logs..." : error || `Showing ${filteredData.length} of ${movementData.length} movements`}
        </p>
        <ExportCsvButton filenamePrefix="movement-logs-export" columns={exportColumns} rows={loading ? [] : filteredData}>
          Export Logs
        </ExportCsvButton>
      </div>

      <Table
    columns={columns}
    data={loading ? [] : filteredData}
    emptyMessage={error || "No inventory movements found. Add movements or run the backend seed."}
  />
      </>}
    </div>;
};
export {
  MovementLogs
};
