import { useState } from "react";

function CheckBookingStatus() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    if (!bookingId.trim()) {
      setError("Please enter your Booking ID.");
      return;
    }

    setLoading(true);
    setBooking(null);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/hotel-enquiries/${encodeURIComponent(
          bookingId.trim(),
        )}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking not found.");
      }

      setBooking(data.booking);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="check-hotel-booking-status">
      <h2>Check Hotel Booking Status</h2>
      <p>Enter your Booking ID to check your hotel enquiry.</p>

      <form onSubmit={handleSearch}>
        <label htmlFor="bookingId">Booking ID</label>

        <input
          id="bookingId"
          type="text"
          placeholder="Enter your Booking ID"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check Status"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {booking && (
        <div className="booking-status-result">
          <h3>Booking Details</h3>

          <p>
            <strong>Booking ID:</strong> {booking.booking_reference}
          </p>

          <p>
            <strong>Hotel:</strong> {booking.hotel_name}
          </p>

          <p>
            <strong>Location:</strong> {booking.hotel_area}
          </p>

          <p>
            <strong>Check-in Date:</strong>{" "}
            {String(booking.check_in_date).slice(0, 10)}
          </p>

          <p>
            <strong>Guests:</strong> {booking.guest_count}
          </p>

          <p>
            <strong>Price per night:</strong> ₹{booking.price_per_night}
          </p>

          <p>
            <strong>Status:</strong> {booking.enquiry_status}
          </p>
        </div>
      )}
    </section>
  );
}

export default CheckBookingStatus;
