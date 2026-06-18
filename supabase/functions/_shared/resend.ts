const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Dezora Luxe <noreply@notifications.dezoraluxe.com>";

const fmt = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  color?: string | null;
  size?: string | null;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  discountCode?: string | null;
  discountAmount?: number;
  deliveryMethod?: string | null;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
}

function wrapEmail(preheader: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dezora Luxe</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#F5F4F0;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4F0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <tr>
            <td style="background-color:#3D0B1C;padding:32px 40px;text-align:center;border-radius:4px 4px 0 0;">
              <img src="https://www.dezoraluxe.com/images/DLX.png" alt="Dezora Luxe" width="200" style="display:block;margin:0 auto;height:auto;max-width:200px;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;padding:48px 40px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background-color:#3D0B1C;padding:28px 40px;text-align:center;border-radius:0 0 4px 4px;">
              <p style="color:#6B7280;font-size:11px;margin:0;">Questions? <a href="mailto:support@dezoraluxe.com" style="color:#FFD24D;text-decoration:none;">support@dezoraluxe.com</a></p>
              <p style="color:#4B5563;font-size:10px;margin:10px 0 0;">© ${new Date().getFullYear()} Dezora Luxe. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items
    .map((item) => {
      const variant = [item.color, item.size].filter(Boolean).join(", ");
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;vertical-align:top;">
            <div style="font-size:14px;color:#141414;font-weight:500;">${item.name}</div>
            ${variant ? `<div style="font-size:12px;color:#6B7280;margin-top:2px;">${variant}</div>` : ""}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;text-align:center;width:36px;vertical-align:top;">
            <div style="font-size:13px;color:#6B7280;">&times;${item.quantity}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;text-align:right;white-space:nowrap;vertical-align:top;">
            <div style="font-size:14px;color:#141414;">${fmt(item.price * item.quantity)}</div>
          </td>
        </tr>`;
    })
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function orderTotal(data: OrderEmailData): string {
  const hasDiscount = data.discountAmount && data.discountAmount > 0;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;border-top:1px solid #E5E7EB;padding-top:4px;">
      ${
        hasDiscount
          ? `<tr>
              <td style="padding:5px 0;font-size:13px;color:#16A34A;">Discount${data.discountCode ? ` (${data.discountCode})` : ""}</td>
              <td style="padding:5px 0;font-size:13px;color:#16A34A;text-align:right;">&minus;${fmt(data.discountAmount!)}</td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#141414;border-top:2px solid #FFD24D;">Total Paid</td>
        <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#141414;text-align:right;border-top:2px solid #FFD24D;">${fmt(data.total)}</td>
      </tr>
    </table>`;
}

function shippingBlock(addr: OrderEmailData["shippingAddress"]): string {
  return `
    <div style="background-color:#F9FAFB;border-radius:4px;padding:16px 20px;margin-top:8px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:8px;">Shipping To</div>
      <div style="font-size:13px;color:#141414;line-height:1.7;">
        ${addr.name}<br>${addr.address}<br>${addr.city}, ${addr.state}<br>${addr.country}
      </div>
    </div>`;
}

export function orderConfirmedTemplate(data: OrderEmailData): string {
  const firstName = data.customerName.split(" ")[0] || data.customerName;
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:54px;height:54px;background-color:#FFD24D;border-radius:50%;margin:0 auto 14px;line-height:54px;font-size:22px;text-align:center;">&#10003;</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;letter-spacing:-0.5px;">Order Confirmed</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;">Thank you, ${firstName}! We've received your order.</p>
    </div>

    <div style="background-color:#F9FAFB;border-radius:4px;padding:14px 20px;margin-bottom:28px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;">Order Number</div>
      <div style="font-size:18px;font-weight:700;color:#141414;letter-spacing:1px;margin-top:3px;">${data.orderNumber}</div>
    </div>

    <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;">Order Summary</div>
    ${itemsTable(data.items)}
    ${orderTotal(data)}

    <div style="margin-top:28px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:8px;">Delivery</div>
      <p style="font-size:13px;color:#141414;margin:0;">${data.deliveryMethod ?? "Standard Delivery"}</p>
      ${shippingBlock(data.shippingAddress)}
    </div>

    <p style="font-size:13px;color:#6B7280;margin:28px 0 0;text-align:center;">We'll send you another update when your order is on its way.</p>`;

  return wrapEmail(`Order ${data.orderNumber} confirmed`, content);
}

export function orderShippedTemplate(data: OrderEmailData): string {
  const firstName = data.customerName.split(" ")[0] || data.customerName;
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:42px;margin-bottom:12px;">&#128666;</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;letter-spacing:-0.5px;">Your Order is On Its Way</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;">Great news, ${firstName}! Your Dezora Luxe order has been shipped.</p>
    </div>

    <div style="background-color:#F9FAFB;border-radius:4px;padding:14px 20px;margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;">Order Number</div>
      <div style="font-size:18px;font-weight:700;color:#141414;letter-spacing:1px;margin-top:3px;">${data.orderNumber}</div>
    </div>

    ${shippingBlock(data.shippingAddress)}

    <div style="margin-top:20px;background-color:#FFFBEB;border-left:3px solid #FFD24D;padding:14px 20px;border-radius:0 4px 4px 0;">
      <p style="font-size:13px;color:#92400E;margin:0;">Delivering via <strong>${data.deliveryMethod ?? "courier"}</strong>. Your items will arrive within the estimated window.</p>
    </div>

    <div style="margin-top:28px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;">Items Shipped</div>
      ${itemsTable(data.items)}
    </div>`;

  return wrapEmail(`Your order ${data.orderNumber} has shipped`, content);
}

export function orderDeliveredTemplate(data: OrderEmailData): string {
  const firstName = data.customerName.split(" ")[0] || data.customerName;
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:42px;margin-bottom:12px;">&#127881;</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;letter-spacing:-0.5px;">Order Delivered</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;">Hi ${firstName}, your Dezora Luxe order has been delivered.</p>
    </div>

    <div style="background-color:#F9FAFB;border-radius:4px;padding:14px 20px;margin-bottom:28px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;">Order Number</div>
      <div style="font-size:18px;font-weight:700;color:#141414;letter-spacing:1px;margin-top:3px;">${data.orderNumber}</div>
    </div>

    <div style="margin-bottom:28px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;">What You Received</div>
      ${itemsTable(data.items)}
    </div>

    <div style="text-align:center;padding:24px;background-color:#F9FAFB;border-radius:4px;">
      <p style="font-size:14px;color:#6B7280;margin:0 0 6px;">We hope you love your pieces.</p>
      <p style="font-size:13px;color:#9CA3AF;margin:0;">Any concerns? Reach us at <a href="mailto:support@dezoraluxe.com" style="color:#141414;font-weight:500;text-decoration:none;">support@dezoraluxe.com</a></p>
    </div>`;

  return wrapEmail(`Your order ${data.orderNumber} has been delivered`, content);
}

export function orderCancelledTemplate(data: OrderEmailData): string {
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;letter-spacing:-0.5px;">Order Cancelled</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;">Your order has been cancelled.</p>
    </div>

    <div style="background-color:#F9FAFB;border-radius:4px;padding:14px 20px;margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;">Order Number</div>
      <div style="font-size:18px;font-weight:700;color:#141414;letter-spacing:1px;margin-top:3px;">${data.orderNumber}</div>
    </div>

    <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 20px;">Any payment for this order will be refunded according to your payment provider's timeline. Please allow a few business days.</p>

    <div style="padding:14px 20px;background-color:#FEF2F2;border-radius:4px;border-left:3px solid #EF4444;">
      <p style="font-size:13px;color:#991B1B;margin:0;">If you did not request this cancellation, please contact us at <a href="mailto:support@dezoraluxe.com" style="color:#991B1B;font-weight:600;text-decoration:none;">support@dezoraluxe.com</a> immediately.</p>
    </div>

    <div style="margin-top:28px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;">Cancelled Items</div>
      ${itemsTable(data.items)}
    </div>`;

  return wrapEmail(`Order ${data.orderNumber} cancelled`, content);
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}
