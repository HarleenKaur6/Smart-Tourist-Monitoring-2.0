import { useState } from "react";

function HotelEnquiryHistory() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchBooking(event) {
    event.preventDefault();

    const reference = bookingId.trim();

    if (!reference) {
      setError("Please enter your Booking ID.");
      return;
    }

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/hotel-enquiries/${encodeURIComponent(reference)}`,
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Booking not found.");
      }

      setBooking(data.booking);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function printReceipt() {
    if (!booking) return;

    const receiptWindow = window.open("", "_blank", "width=700,height=750");

    if (!receiptWindow) {
      setError("Please allow pop-ups in your browser to print the receipt.");
      return;
    }

    const escapeHTML = (value) =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[char],
      );

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hotel Enquiry Receipt</title>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #28352f;
            }
            .receipt {
              max-width: 600px;
              margin: auto;
              padding: 25px;
              border: 1px solid #dce5d9;
              border-radius: 12px;
            }
            h1 { color: #456b52; }
            p {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
              overflow-wrap: anywhere;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>TravelSafe Hotel Enquiry Receipt</h1>
            <p><strong>Booking Reference:</strong> ${escapeHTML(booking.booking_reference)}</p>
            <p><strong>Guest Name:</strong> ${escapeHTML(booking.guest_name)}</p>
            <p><strong>Hotel:</strong> ${escapeHTML(booking.hotel_name)}</p>
            <p><strong>Area:</strong> ${escapeHTML(booking.hotel_area)}</p>
            <p><strong>Check-in Date:</strong> ${escapeHTML(String(booking.check_in_date).slice(0, 10))}</p>
            <p><strong>Guests:</strong> ${escapeHTML(booking.guest_count)}</p>
            <p><strong>Price per Night:</strong> ₹${escapeHTML(booking.price_per_night)}</p>
            <p><strong>Current Status:</strong> ${escapeHTML(booking.enquiry_status)}</p>
            <small>This receipt records your hotel enquiry. It is not proof of a confirmed reservation.</small>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);

    receiptWindow.document.close();
  }

  return (
    <section className="hotel-enquiry-history" id="hotel-enquiry-history">
      <h2>Hotel Enquiry History</h2>
      <p>Enter your booking reference to check your latest booking status.</p>

      <form onSubmit={searchBooking}>
        <label htmlFor="historyBookingId">Booking Reference</label>

        <input
          id="historyBookingId"
          type="text"
          placeholder="Enter booking reference"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          autoComplete="off"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Enquiry"}
        </button>
      </form>

      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}

      {booking && (
        <div className="booking-history-result">
          <h3>Enquiry Details</h3>

          <p>
            <strong>Booking Reference:</strong> {booking.booking_reference}
          </p>
          <p>
            <strong>Guest Name:</strong> {booking.guest_name}
          </p>
          <p>
            <strong>Hotel:</strong> {booking.hotel_name}
          </p>
          <p>
            <strong>Area:</strong> {booking.hotel_area}
          </p>
          <p>
            <strong>Check-in Date:</strong>{" "}
            {String(booking.check_in_date).slice(0, 10)}
          </p>
          <p>
            <strong>Guests:</strong> {booking.guest_count}
          </p>
          <p>
            <strong>Price per Night:</strong> ₹{booking.price_per_night}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`booking-status ${String(booking.enquiry_status).toLowerCase()}`}
            >
              {booking.enquiry_status}
            </span>
          </p>

          <button type="button" onClick={printReceipt}>
            🖨️ Print Receipt
          </button>
        </div>
      )}
    </section>
  );
}

export default HotelEnquiryHistory;
