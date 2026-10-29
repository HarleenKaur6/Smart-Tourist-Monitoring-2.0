import { useEffect, useState } from "react";

function AdminHotelDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingBooking, setUpdatingBooking] = useState("");

  // Fetch all hotel enquiries
  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/hotel-enquiries"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load hotel enquiries."
        );
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  // Confirm or reject a hotel enquiry
  async function updateBookingStatus(bookingId, status) {
    const action =
      status === "CONFIRMED" ? "confirm" : "reject";

    const isApproved = window.confirm(
      `Are you sure you want to ${action} this enquiry?`
    );

    if (!isApproved) return;

    try {
      setError("");
      setUpdatingBooking(bookingId);

      const response = await fetch(
        `http://localhost:5000/api/hotel-enquiries/${encodeURIComponent(
          bookingId
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update booking status."
        );
      }

      alert(data.message || `Enquiry ${status.toLowerCase()}.`);

      // Refresh the table after updating the status
      await fetchBookings();
    } catch (err) {
      setError(
        err.message || "Unable to update booking status."
      );
    } finally {
      setUpdatingBooking("");
    }
  }

  // Load enquiries when the component opens
 useEffect(() => {
  const timer = setTimeout(() => {
    fetchBookings();
  }, 0);

  return () => clearTimeout(timer);
}, []);

  // Escape HTML in the printable receipt
  function escapeHtml(value) {
    return String(value ?? "N/A").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[char];
    });
  }

  // Format dates
  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Print hotel enquiry receipt
  function printEnquiryReceipt(booking) {
    const receiptWindow = window.open(
      "",
      "_blank",
      "width=700,height=800"
    );

    if (!receiptWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hotel Enquiry Receipt</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #222;
              background: #f8fafc;
            }

            .receipt {
              max-width: 600px;
              margin: auto;
              border: 1px solid #ccc;
              padding: 25px;
              border-radius: 10px;
              background: white;
            }

            h1,
            h2 {
              text-align: center;
            }

            h1 {
              color: #176b60;
            }

            .row {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding: 12px 0;
              border-bottom: 1px solid #eee;
            }

            .row span {
              text-align: right;
              overflow-wrap: anywhere;
            }

            .note {
              margin-top: 25px;
              font-size: 13px;
              color: #555;
              line-height: 1.6;
            }

            .print-button {
              display: block;
              margin: 25px auto 0;
              padding: 10px 22px;
              background: #176b60;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }

              .print-button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <h1>Smart Tourist Monitoring</h1>
            <h2>Hotel Enquiry Receipt</h2>

            <div class="row">
              <strong>Booking Reference:</strong>
              <span>${escapeHtml(booking.booking_reference)}</span>
            </div>

            <div class="row">
              <strong>Guest Name:</strong>
              <span>${escapeHtml(booking.guest_name)}</span>
            </div>

            <div class="row">
              <strong>Email:</strong>
              <span>${escapeHtml(booking.guest_email)}</span>
            </div>

            <div class="row">
              <strong>Hotel:</strong>
              <span>${escapeHtml(booking.hotel_name)}</span>
            </div>

            <div class="row">
              <strong>Location:</strong>
              <span>${escapeHtml(booking.hotel_area)}</span>
            </div>

            <div class="row">
              <strong>Check-in Date:</strong>
              <span>${escapeHtml(formatDate(booking.check_in_date))}</span>
            </div>

            <div class="row">
              <strong>Number of Guests:</strong>
              <span>${escapeHtml(booking.guest_count)}</span>
            </div>

            <div class="row">
              <strong>Price per Night:</strong>
              <span>₹${escapeHtml(booking.price_per_night)}</span>
            </div>

            <div class="row">
              <strong>Enquiry Status:</strong>
              <span>${escapeHtml(booking.enquiry_status)}</span>
            </div>

            <p class="note">
              This receipt records the hotel enquiry details.
              It is not proof of a confirmed hotel reservation
              or payment.
            </p>

            <button
              class="print-button"
              onclick="window.print()"
            >
              Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();
  }

  return (
    <section className="admin-hotel-dashboard">
      <h2>Admin Hotel Dashboard</h2>

      <p>
        View hotel enquiries, manage their status, and print receipts.
      </p>

      <button
        onClick={fetchBookings}
        disabled={loading}
      >
        {loading ? "Loading..." : "Refresh Enquiries"}
      </button>

      {loading && <p>Loading hotel enquiries...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p>No hotel enquiries found.</p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Booking Reference</th>
                <th>Guest Name</th>
                <th>Email</th>
                <th>Hotel</th>
                <th>Location</th>
                <th>Check-in</th>
                <th>Guests</th>
                <th>Price/Night</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.booking_reference}>
                  <td>{booking.booking_reference}</td>

                  <td>{booking.guest_name}</td>

                  <td>{booking.guest_email || "N/A"}</td>

                  <td>{booking.hotel_name}</td>

                  <td>{booking.hotel_area}</td>

                  <td>{formatDate(booking.check_in_date)}</td>

                  <td>{booking.guest_count}</td>

                  <td>₹{booking.price_per_night}</td>

                  <td>
                    <strong>
                      {booking.enquiry_status}
                    </strong>
                  </td>

                  <td>
                    <button
                      onClick={() => printEnquiryReceipt(booking)}
                    >
                      View / Print
                    </button>
                  </td>

                  <td>
                    {booking.enquiry_status === "PENDING" ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          minWidth: "140px",
                        }}
                      >
                        <button
                          onClick={() =>
                            updateBookingStatus(
                              booking.booking_reference,
                              "CONFIRMED"
                            )
                          }
                          disabled={
                            updatingBooking ===
                            booking.booking_reference
                          }
                        >
                          {updatingBooking ===
                          booking.booking_reference
                            ? "Updating..."
                            : "Confirm Booking"}
                        </button>

                        <button
                          onClick={() =>
                            updateBookingStatus(
                              booking.booking_reference,
                              "REJECTED"
                            )
                          }
                          disabled={
                            updatingBooking ===
                            booking.booking_reference
                          }
                        >
                          {updatingBooking ===
                          booking.booking_reference
                            ? "Updating..."
                            : "Reject Booking"}
                        </button>
                      </div>
                    ) : (
                      <span>No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminHotelDashboard;