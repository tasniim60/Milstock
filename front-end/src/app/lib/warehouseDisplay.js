const getWarehouseId = (warehouse) => warehouse?._id || warehouse || "";

const getAssignedWarehouseName = (user, allLabel = "All Warehouses", missingLabel = "Not assigned") => {
  if (user?.role === "admin" && !user?.assigned_warehouse) return allLabel;
  if (user?.assigned_warehouse?.name) return user.assigned_warehouse.name;
  if (user?.assigned_warehouse_name) return user.assigned_warehouse_name;
  return missingLabel;
};

const getStoredAssignedWarehouse = () => {
  try {
    const user = JSON.parse(localStorage.getItem("milstock_user") || "null");
    return {
      id: getWarehouseId(user?.assigned_warehouse),
      name: getAssignedWarehouseName(user, "", "")
    };
  } catch {
    return { id: "", name: "" };
  }
};

export {
  getAssignedWarehouseName,
  getStoredAssignedWarehouse,
  getWarehouseId
};
