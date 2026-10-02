import api from "./api";

/* ============================================================
 * 🎧 USER SUPPORT TICKET API SERVICES
 * ============================================================ */

/** Create a new support ticket */
export const createSupportTicket = async (ticketData) => {
  const res = await api.post("/support/tickets", ticketData);
  return res.data;
};

/** Get current user's support tickets */
export const getUserTickets = async () => {
  const res = await api.get("/support/tickets");
  return res.data;
};

/** Get a single ticket's full details and conversation */
export const getTicketDetails = async (ticketId) => {
  const res = await api.get(`/support/tickets/${ticketId}`);
  return res.data;
};

/** Send a reply message to a ticket */
export const replyToTicket = async (ticketId, message) => {
  const res = await api.post(`/support/tickets/${ticketId}/reply`, { message });
  return res.data;
};

/** Close a support ticket */
export const closeTicket = async (ticketId) => {
  const res = await api.patch(`/support/tickets/${ticketId}/close`);
  return res.data;
};

/* ============================================================
 * 👑 CMS DEVELOPER / ADMIN SUPPORT MANAGEMENT API SERVICES
 * ============================================================ */

/** Get CMS Support stats */
export const getCmsSupportStats = async () => {
  const res = await api.get("/support/admin/stats");
  return res.data;
};

/** Get all tickets with filters */
export const getCmsTickets = async (params = {}) => {
  const res = await api.get("/support/admin/tickets", { params });
  return res.data;
};

/** Update ticket status / priority / resolution notes */
export const updateCmsTicket = async (ticketId, updateData) => {
  const res = await api.patch(`/support/admin/tickets/${ticketId}`, updateData);
  return res.data;
};

/** Staff reply to a ticket */
export const replyCmsTicket = async (ticketId, { message, newStatus }) => {
  const res = await api.post(`/support/admin/tickets/${ticketId}/reply`, {
    message,
    newStatus,
  });
  return res.data;
};

/** Delete a support ticket */
export const deleteCmsTicket = async (ticketId) => {
  const res = await api.delete(`/support/admin/tickets/${ticketId}`);
  return res.data;
};
