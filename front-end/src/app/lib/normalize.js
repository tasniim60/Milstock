const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.warehouses)) return value.warehouses;
  if (Array.isArray(value?.suppliers)) return value.suppliers;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.movements)) return value.movements;
  if (Array.isArray(value?.orderItems)) return value.orderItems;
  if (Array.isArray(value?.notifications)) return value.notifications;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.result)) return value.result;
  return [];
};

const normalizeRecord = (value) => {
  if (!value || Array.isArray(value)) return value || null;
  return value.data || value.dashboard || value.order || value.result || value.item || value.document || value;
};

const getDocumentId = (value) => {
  if (value && typeof value === "object") return value._id;
  return value;
};

const sameId = (left, right) => String(getDocumentId(left) ?? "") === String(getDocumentId(right) ?? "");

export {
  getDocumentId,
  normalizeArray,
  normalizeRecord,
  sameId
};
