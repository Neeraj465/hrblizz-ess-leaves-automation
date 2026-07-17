type Id = string | number;

export const API_ROUTES = {
  loginCredential: "/login/credential",

  leaveRequests: (legalEntityId: Id, employeeId: Id) =>
    `/request/legal-entities/${legalEntityId}/employees/${employeeId}/requests/`,

  leaveRequest: (legalEntityId: Id, employeeId: Id, requestId: Id) =>
    `/request/legal-entities/${legalEntityId}/employees/${employeeId}/requests/${requestId}`,

  leaveRequestSubmissions: (legalEntityId: Id, employeeId: Id, requestId: Id) =>
    `/request/legal-entities/${legalEntityId}/employees/${employeeId}/requests/${requestId}/submissions`,

  leaveRequestCancel: (legalEntityId: Id, employeeId: Id, requestId: Id) =>
    `/request/legal-entities/${legalEntityId}/employees/${employeeId}/requests/${requestId}/cancel`,
  
  requestReviews: (reviewerId: Id, requestId: Id) =>
    `/request/reviewers/${reviewerId}/requests/${requestId}/reviews`,
};
