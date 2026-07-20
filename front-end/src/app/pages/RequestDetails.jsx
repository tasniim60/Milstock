import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ArrowLeft, Calendar, CheckCircle, Clock, Package, Truck, User, XCircle } from "lucide-react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { getDocumentId, normalizeArray, normalizeRecord, sameId } from "../lib/normalize";
import { getLocalizedValue } from "../lib/localization";

const statusVariants = {
  pending: "pending",
  approved: "success",
  accepted: "success",
  rejected: "danger",
  in_transfer: "info",
  in_delivery: "info",
  delivered: "success",
  completed: "info",
  cancelled: "danger"
};

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  accepted: "Accepted",
  rejected: "Rejected",
  in_transfer: "In Transfer",
  in_delivery: "In Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled"
};

const money = (value) => {
  const number = Number(value || 0);
  return number ? `${number.toLocaleString()} EGP` : "N/A";
};

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isSupplier = location.pathname.startsWith("/supplier");
  const backPath = isAdmin ? "/admin/requests" : isSupplier ? "/supplier/orders" : "/user/requests";
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!id) {
      setOrder(null);
      setItems([]);
      setError("Request id is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [orderData, orderItems] = await Promise.all([
        api.orders.get(id),
        api.orderItems.list()
      ]);
      const normalizedOrder = normalizeRecord(orderData);
      const orderItemsArray = normalizeArray(orderItems);
      const relatedItems = orderItemsArray.filter((item) => sameId(item.order_id, id));
      setOrder(normalizedOrder || null);
      setItems(relatedItems);
    } catch (requestError) {
      setError(requestError.message || "Failed to load request details.");
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const updateStatus = async (status) => {
    if (!id || !order) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = isSupplier
        ? await api.supplierUsers.updateStatus(id, status, `Supplier changed status to ${status}`)
        : await api.orders.updateStatus(id, status, `Status changed to ${status} from request details`);
      const updatedOrder = normalizeRecord(response);
      setOrder(updatedOrder || { ...order, status });
      setMessage(`Request status updated to ${statusLabels[status] || status}.`);
      await loadRequest();
    } catch (requestError) {
      setError(requestError.message || "Failed to update request status.");
    } finally {
      setSaving(false);
    }
  };

  const decideWarehouseRequest = async (decision) => {
    if (!id || !order) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.orders.adminDecision(id, decision, `${decision} from request details`);
      const updatedOrder = normalizeRecord(response);
      setOrder(updatedOrder || { ...order, status: decision === "approve" ? "approved" : "rejected" });
      setMessage(decision === "approve" ? "Request approved. Complete the stock movement from Movement Logs." : "Request rejected.");
      await loadRequest();
    } catch (requestError) {
      setError(requestError.message || "Failed to update request decision.");
    } finally {
      setSaving(false);
    }
  };

  const requestId = useMemo(() => {
    const rawId = order?._id || id || "";
    return rawId ? rawId.slice(-8).toUpperCase() : "N/A";
  }, [id, order?._id]);

  const notes = order?.notes || order?.note || order?.description || order?.justification || "";
  const requester = order?.requested_by || order?.user_id || {};
  const requesterName = requester?.name || "Unknown requester";
  const requesterCode = requester?.military_number || requester?.email || "N/A";
  const supplierNameForRequest = order?.supplier_id?.name || order?.provider_id?.name || "No supplier";
  const requestType = order?.request_type === "warehouse_transfer" ? "warehouse_request" : order?.request_type || "warehouse_request";
  const currentStatus = order?.status || "pending";
  const isWarehouseRequest = ["warehouse_request", "warehouse_transfer"].includes(requestType);
  const isSupplierRequest = ["supplier_request", "provider"].includes(requestType);
  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("milstock_user") || "null");
    } catch {
      return null;
    }
  }, []);
  const canManageRequest = isAdmin && (!adminUser?.role || adminUser.role === "admin") && isWarehouseRequest;
  const canSupplierManage = isSupplier && ["supplier_request", "provider"].includes(requestType);
  const createdDate = formatDate(order?.date || order?.createdAt);
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const timeline = isWarehouseRequest ? [
    {
      title: "Request Created",
      description: `Created by ${requesterName}`,
      complete: Boolean(order),
      active: currentStatus === "pending",
      icon: Package
    },
    {
      title: currentStatus === "rejected" ? "Rejected" : "Admin Decision",
      description: currentStatus === "rejected" ? "Admin rejected this request" : currentStatus === "pending" ? "Waiting for admin approval" : "Request approved and waiting for movement completion",
      complete: ["approved", "in_transfer", "completed", "rejected"].includes(currentStatus),
      active: ["pending", "approved", "in_transfer"].includes(currentStatus),
      icon: currentStatus === "rejected" ? XCircle : CheckCircle
    },
    {
      title: currentStatus === "completed" ? "Transfer Completed" : "Movement Logs",
      description: currentStatus === "completed" ? "Stock movement was completed from Movement Logs" : "Complete stock movement from Movement Logs",
      complete: currentStatus === "completed",
      active: ["approved", "in_transfer"].includes(currentStatus),
      icon: Truck
    }
  ] : [
    {
      title: "Request Created",
      description: `Created by ${requesterName}`,
      complete: Boolean(order),
      active: currentStatus === "pending",
      icon: Package
    },
    {
      title: currentStatus === "rejected" ? "Rejected" : "Accepted",
      description: currentStatus === "rejected" ? "Supplier rejected this request" : "Supplier accepted the request",
      complete: ["accepted", "in_delivery", "delivered", "rejected"].includes(currentStatus),
      active: currentStatus === "accepted",
      icon: currentStatus === "rejected" ? XCircle : CheckCircle
    },
    {
      title: currentStatus === "delivered" ? "Delivered" : "Delivery",
      description: currentStatus === "delivered" ? "Supplier marked the request as delivered" : "Waiting for supplier delivery update",
      complete: currentStatus === "delivered",
      active: currentStatus === "in_delivery",
      icon: Truck
    }
  ];

  if (loading) {
    return <div className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Requests
      </button>
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading request details...</CardContent>
      </Card>
    </div>;
  }

  if (error && !order) {
    return <div className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Requests
      </button>
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold text-[#D4183D] mb-2">Unable to load this request.</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    </div>;
  }

  if (!order) {
    return <div className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Requests
      </button>
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Request not found.</CardContent>
      </Card>
    </div>;
  }

  return <div className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm">
      <ArrowLeft className="w-4 h-4" />
      Back to Requests
    </button>

    <PageHeader
      title={`Request ${requestId}`}
      subtitle={isSupplierRequest
        ? `${supplierNameForRequest} - ${createdDate}`
        : `${order.source_warehouse?.name || "Source warehouse"} to ${order.destination_warehouse?.name || "Destination warehouse"} - ${createdDate}`}
    />

    {error && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{error}</div>}
    {message && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e]">{message}</div>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
            <Badge variant={statusVariants[currentStatus] || "neutral"}>{statusLabels[currentStatus] || currentStatus}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timeline.map((step, index) => {
                const Icon = step.icon;
                const isDone = step.complete;
                return <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-3 rounded-full ${isDone ? "bg-[#6A7B4D] text-white" : step.active ? "bg-[#4B5B3A] text-white" : "bg-[#E0E1B7] text-muted-foreground"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index !== timeline.length - 1 && <div className={`w-0.5 h-14 mt-2 ${isDone ? "bg-[#6A7B4D]" : "bg-border"}`} />}
                  </div>
                  <div className="flex-1 pb-5">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">{createdDate}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>;
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requested Items</CardTitle>
            <span className="text-sm text-muted-foreground">{items.length} items</span>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? <p className="text-sm text-muted-foreground">No order items were found for this request.</p> : <div className="space-y-4">
              {items.map((item) => {
                const product = item.product_id || item.product || {};
                const productId = getDocumentId(product);
                const productName = getLocalizedValue(product, "name", "en") || item.product_name || item.name || "Unknown item";
                return <div key={item._id || `${productId || productName}-${item.quantity}`} className="p-4 bg-background rounded-xl border border-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{productName}</p>
                      <p className="text-sm text-muted-foreground">{String(productId || "").slice(-8).toUpperCase() || "N/A"}</p>
                    </div>
                    <Badge variant="info">{product?.category || item.category || "Food supply"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium text-foreground">{item.quantity || 0} {product?.unit || item.unit || ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit Price</p>
                      <p className="font-medium text-foreground">{money(item.unit_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium text-foreground">{money(item.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available Stock</p>
                      <p className="font-medium text-foreground">{product?.quantity ?? item.available ?? "N/A"} {product?.unit || item.unit || ""}</p>
                    </div>
                  </div>
                </div>;
              })}
            </div>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Request ID", value: requestId, icon: Package },
                { label: "Requested By", value: requesterName, icon: User },
                { label: "Employee Code", value: requesterCode, icon: User },
                ...(isSupplierRequest
                  ? [{ label: "Supplier", value: supplierNameForRequest, icon: Truck }]
                  : [
                    { label: "Source Warehouse", value: order.source_warehouse?.name || "N/A", icon: Truck },
                    { label: "Destination Warehouse", value: order.destination_warehouse?.name || "N/A", icon: Truck },
                  ]),
                { label: "Request Type", value: isSupplierRequest ? "Supplier Request" : "Warehouse Request", icon: Package },
                { label: "Request Date", value: createdDate, icon: Calendar },
                { label: "Total Quantity", value: totalQuantity || "N/A", icon: Package },
                { label: "Total Price", value: money(order.total_price), icon: Package }
              ].map((field) => {
                const Icon = field.icon;
                return <div key={field.label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-[#5A6B50] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{field.label}</p>
                    <p className="font-semibold text-foreground">{field.value}</p>
                  </div>
                </div>;
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {notes || "No additional notes were saved for this request."}
            </p>
          </CardContent>
        </Card>

        {canManageRequest && <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStatus === "approved" && <div className="space-y-3">
              <p className="text-sm text-[#5A6B50]">This request is approved. Complete the stock movement from Movement Logs.</p>
              <Button className="w-full" variant="outline" onClick={() => navigate("/admin/inventory/logs")}>
                Go to Movement Logs
              </Button>
            </div>}
            {currentStatus === "in_transfer" && <div className="space-y-3">
              <p className="text-sm text-[#5A6B50]">This request is currently in transfer. Finish it from Movement Logs.</p>
              <Button className="w-full" variant="outline" onClick={() => navigate("/admin/inventory/logs")}>
                Go to Movement Logs
              </Button>
            </div>}
            {currentStatus === "pending" && <div className="space-y-3">
              <Button className="w-full" onClick={() => decideWarehouseRequest("approve")} disabled={saving}>
                <CheckCircle className="w-4 h-4" />
                Approve Request
              </Button>
              <Button variant="danger" className="w-full" onClick={() => decideWarehouseRequest("reject")} disabled={saving}>
                <XCircle className="w-4 h-4" />
                Reject Request
              </Button>
            </div>}
            {currentStatus === "rejected" && <p className="text-sm text-[#5A6B50]">This request has already been rejected.</p>}
            {currentStatus === "completed" && <p className="text-sm text-[#5A6B50]">This warehouse transfer has already been completed.</p>}
            {currentStatus === "cancelled" && <p className="text-sm text-[#5A6B50]">No admin movement action is available for this request status.</p>}
          </CardContent>
        </Card>}

        {canSupplierManage && <Card>
          <CardHeader>
            <CardTitle>Supplier Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentStatus === "pending" && <>
                <Button className="w-full" onClick={() => updateStatus("accepted")} disabled={saving}>
                  <CheckCircle className="w-4 h-4" />
                  Accept Order
                </Button>
                <Button variant="danger" className="w-full" onClick={() => updateStatus("rejected")} disabled={saving}>
                  <XCircle className="w-4 h-4" />
                  Reject Order
                </Button>
              </>}
              {currentStatus === "accepted" && <Button className="w-full" onClick={() => updateStatus("in_delivery")} disabled={saving}>
                <Truck className="w-4 h-4" />
                Mark In Delivery
              </Button>}
              {currentStatus === "in_delivery" && <Button className="w-full" onClick={() => updateStatus("delivered")} disabled={saving}>
                <Truck className="w-4 h-4" />
                Mark Delivered
              </Button>}
              {["rejected", "delivered"].includes(currentStatus) && <p className="text-sm text-[#5A6B50]">No further supplier actions are available.</p>}
            </div>
          </CardContent>
        </Card>}
      </div>
    </div>
  </div>;
};

export {
  RequestDetails
};
