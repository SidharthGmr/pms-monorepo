/**
 * The catalog of editable transactional emails. Each key matches a file in
 * `apps/api/src/templetes/<key>.html` - the file is the default; an `EmailTemplate` DB row
 * overrides it. `variables` are the placeholders that template's dispatcher actually fills,
 * and `sampleData` feeds the admin editor's preview and test sends. Brand values
 * (PlatformName, WebsiteUrl, appName, siteUrl, logoUrl, year) are injected on every send,
 * so they are listed once below instead of per template.
 */

export interface EmailTemplateDef {
  key: string;
  name: string;
  description: string;
  defaultSubject: string;
  variables: string[];
  sampleData: Record<string, string>;
}

export const EMAIL_TEMPLATE_BRAND_VARIABLES = ["PlatformName", "WebsiteUrl", "appName", "siteUrl", "logoUrl", "year"];

const sampleItemsRows = [
  '<tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">Wireless Optical Mouse<br /><span style="font-weight:normal;font-size:11px;color:#64748b;">₹649.00 each</span></td><td align="center" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">2</td><td align="right" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">₹1,298.00</td></tr>',
  '<tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">Mechanical Keyboard<br /><span style="font-weight:normal;font-size:11px;color:#64748b;">₹2,499.00 each</span></td><td align="center" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">1</td><td align="right" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">₹2,499.00</td></tr>',
].join("");

export const EMAIL_TEMPLATE_DEFS: EmailTemplateDef[] = [
  {
    key: "welcome",
    name: "Welcome",
    description: "Greets a new user after their account is created.",
    defaultSubject: "Welcome to {{PlatformName}}!",
    variables: ["Name", "LoginLink", "SupportEmail"],
    sampleData: {
      Name: "Aarav Sharma",
      LoginLink: "https://example.com/login",
      SupportEmail: "support@example.com",
    },
  },
  {
    key: "verify-email",
    name: "Verify Email",
    description: "Sent on sign-up with the link that confirms the user's email address.",
    defaultSubject: "Verify your email · {{PlatformName}}",
    variables: ["name", "verifyUrl", "expiresIn"],
    sampleData: {
      name: "Aarav Sharma",
      verifyUrl: "https://example.com/verify-email?token=sample-token",
      expiresIn: "60 minutes",
    },
  },
  {
    key: "otp",
    name: "One-Time Code (Forgot Password)",
    description: "Carries the one-time verification code for sign-in and password recovery.",
    defaultSubject: "Your {{PlatformName}} verification code",
    variables: ["FirstName", "OTP_CODE", "OtpExpiryMinutes"],
    sampleData: {
      FirstName: "Aarav",
      OTP_CODE: "482913",
      OtpExpiryMinutes: "10",
    },
  },
  {
    key: "reset-password",
    name: "Reset Password",
    description: "Sent from the forgot-password flow with the secure reset link.",
    defaultSubject: "Reset your password · {{PlatformName}}",
    variables: ["name", "resetUrl", "expiresIn"],
    sampleData: {
      name: "Aarav Sharma",
      resetUrl: "https://example.com/reset-password?token=sample-token",
      expiresIn: "30 minutes",
    },
  },
  {
    key: "order-placed",
    name: "Order Bill",
    description: "The order bill mailed to the store the moment an order is placed.",
    defaultSubject: "New order {{orderNumber}} · {{grandTotal}} · {{customerName}}",
    variables: [
      "storeName",
      "orderNumber",
      "placedAt",
      "status",
      "customerName",
      "customerContact",
      "itemsRows",
      "adjustmentRows",
      "notesBlock",
      "subtotal",
      "grandTotal",
      "orderUrl",
    ],
    sampleData: {
      storeName: "Prime Mart",
      orderNumber: "ORD-2026-00148",
      placedAt: "24 Oct 2026, 11:35 am",
      status: "CONFIRMED",
      customerName: "Aarav Sharma",
      customerContact: "aarav.sharma@example.com · +91 99720 44556",
      itemsRows: sampleItemsRows,
      adjustmentRows:
        '<tr><td style="padding:3px 0;color:#e11d48;">Discount</td><td align="right" style="padding:3px 0;font-weight:bold;color:#e11d48;">-₹300.00</td></tr>',
      notesBlock: "",
      subtotal: "₹3,797.00",
      grandTotal: "₹4,125.46",
      orderUrl: "https://example.com/admin/orders/148",
    },
  },
  {
    key: "return-requested",
    name: "Return Requested",
    description: "Alerts the store when a customer raises a return or exchange request.",
    defaultSubject: "{{typeLabel}} request {{returnNumber}} · {{refundAmount}} · {{customerName}}",
    variables: [
      "storeName",
      "returnNumber",
      "orderNumber",
      "typeLabel",
      "typeLabelLower",
      "customerName",
      "customerContact",
      "reason",
      "refundAmount",
      "requestedAt",
      "itemsRows",
      "exchangeBlock",
      "adminUrl",
    ],
    sampleData: {
      storeName: "Prime Mart",
      returnNumber: "RET-2026-0021",
      orderNumber: "ORD-2026-00148",
      typeLabel: "Return",
      typeLabelLower: "return",
      customerName: "Aarav Sharma",
      customerContact: "aarav.sharma@example.com · +91 99720 44556",
      reason: "Item arrived with a damaged cable.",
      refundAmount: "₹649.00",
      requestedAt: "26 Oct 2026, 4:12 pm",
      itemsRows: sampleItemsRows,
      exchangeBlock: "",
      adminUrl: "https://example.com/admin/returns/21",
    },
  },
  {
    key: "return-status",
    name: "Return Status Update",
    description: "Tells the customer their return or exchange moved to a new status.",
    defaultSubject: "Update on your {{typeLabelLower}} · {{returnNumber}}",
    variables: [
      "storeName",
      "returnNumber",
      "orderNumber",
      "typeLabel",
      "typeLabelLower",
      "customerName",
      "headline",
      "message",
      "statusLabel",
      "statusInk",
      "statusSoft",
      "itemsRows",
      "exchangeBlock",
      "refundBlock",
      "orderUrl",
    ],
    sampleData: {
      storeName: "Prime Mart",
      returnNumber: "RET-2026-0021",
      orderNumber: "ORD-2026-00148",
      typeLabel: "Return",
      typeLabelLower: "return",
      customerName: "Aarav Sharma",
      headline: "Your return is approved",
      message: "Please pack the items with their original tags; our courier will pick them up within 2 working days.",
      statusLabel: "Approved",
      statusInk: "#047857",
      statusSoft: "#d1fae5",
      itemsRows: sampleItemsRows,
      exchangeBlock: "",
      refundBlock: "",
      orderUrl: "https://example.com/dashboard/orders/148",
    },
  },
  {
    key: "contact-message",
    name: "Contact Message",
    description: "Forwards a contact-form submission to the store admin inbox.",
    defaultSubject: "New contact message: {{subject}} - {{name}}",
    variables: ["name", "email", "phone", "subject", "messageBody", "receivedAt", "replyTo"],
    sampleData: {
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+91 99720 44556",
      subject: "Question about bulk pricing",
      messageBody: "Hi, do you offer discounts on orders of 50+ units? Thanks!",
      receivedAt: "28 Oct 2026, 10:04 am",
      replyTo: "aarav.sharma@example.com",
    },
  },
  {
    key: "user-registered",
    name: "User Registered (Admin Alert)",
    description: "Notifies the admin that a new user signed up.",
    defaultSubject: "New user registered · {{Name}}",
    variables: ["Name", "Email", "Phone", "Status", "adminUrl"],
    sampleData: {
      Name: "Aarav Sharma",
      Email: "aarav.sharma@example.com",
      Phone: "+91 99720 44556",
      Status: "PENDING",
      adminUrl: "https://example.com/admin/users",
    },
  },
  {
    key: "welcome_newsletter",
    name: "Newsletter Welcome",
    description: "Confirms a visitor's subscription to the newsletter.",
    defaultSubject: "Welcome to the {{PlatformName}} newsletter",
    variables: ["Email"],
    sampleData: {
      Email: "aarav.sharma@example.com",
    },
  },
];
