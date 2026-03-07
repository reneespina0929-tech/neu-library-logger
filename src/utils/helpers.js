// src/utils/helpers.js
import { format, formatDistanceToNow } from "date-fns";

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, "hh:mm a");
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, "MMM dd, yyyy");
};

export const formatDuration = (timeIn, timeOut) => {
  if (!timeIn) return "—";
  const start = timeIn.toDate ? timeIn.toDate() : new Date(timeIn);
  const end = timeOut
    ? timeOut.toDate
      ? timeOut.toDate()
      : new Date(timeOut)
    : new Date();
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
};

export const timeAgo = (timestamp) => {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
};

export const purposeOptions = [
  "Study / Review",
  "Research",
  "Borrowing / Returning Books",
  "Group Study",
  "Computer Use",
  "Thesis / Capstone Work",
  "Reading / Leisure",
  "Other",
];

export const getTodayDateString = () => new Date().toISOString().split("T")[0];
