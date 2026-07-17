/** Leave-type options in the "Add new leave" dropdown */
export enum LeaveType {
  ANNUAL = "Annual leave",
  SICK = "Sick leave",
}

/** Request status labels shown on request cards */
export enum LeaveStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  WITHDRAWN = "Withdrawn",
  ONGOING = "Ongoing / Upcoming",
}

/**
 * Left-nav items under "Leaves"
 */
export enum NavItem {
  LEAVES = "Leaves",
  MY_LEAVES = "My leaves",
  CALENDAR = "Calendar",
  APPROVALS = "Approvals",
}

export enum PlaceholderText {
  leaveNote = "Write your note",
}
