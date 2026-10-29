import { useState } from "react";

function HotelCard({ name, area, safety, rating, price, image }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedBooking, setSavedBooking] = useState(null);

  async function handleBooking(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");
    setSavedBooking(null);

    try {
      const response = await fetch("http://localhost:5000/api/hotel-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          hotel_name: name,
          hotel_area: area,
          check_in_date: checkIn,
          guest_count: Number(guests),
          price_per_night: Number(price),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit your hotel enquiry.");
      }

      const booking = data.booking;
      setSavedBooking(booking);
      setMessage(
        "Your hotel enquiry has been saved successfully. Its current status is PENDING until the admin confirms it."
      );
    } catch (error) {
      console.error("Hotel enquiry error:", error);
      setMessage(error.message || "Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function printReceipt() {
    if (!savedBooking) return;

    const receiptWindow = window.open("", "_blank", "width=700,height=750");
    if (!receiptWindow) {
      setMessage("Please allow pop-ups in your browser to print the receipt.");
      return;
    }

    const safe = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);

    receiptWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Hotel Enquiry Receipt - ${safe(savedBooking.booking_reference)}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #173b36; }
          .receipt { max-width: 600px; margin: auto; border: 1px solid #cbdcd6; border-radius: 14px; padding: 28px; }
          h1 { margin-top: 0; color: #117d73; }
          .row { padding: 10px 0; border-bottom: 1px solid #e4eeea; }
          strong { display: inline-block; min-width: 170px; }
          .status { margin-top: 18px; padding: 12px; background: #fff4d6; border-radius: 8px; }
          small { display: block; margin-top: 22px; color: #52645f; }
          @media print { body { padding: 0; } .receipt { border: none; } }
        </style>
      </head>
      <body>
        <main class="receipt">
          <h1>TravelSafe — Hotel Enquiry Receipt</h1>
          <div class="row"><strong>Booking Reference:</strong> ${safe(savedBooking.booking_reference)}</div>
          <div class="row"><strong>Guest Name:</strong> ${safe(savedBooking.guest_name || guestName)}</div>
          <div class="row"><strong>Email:</strong> ${safe(savedBooking.guest_email || guestEmail)}</div>
          <div class="row"><strong>Hotel:</strong> ${safe(savedBooking.hotel_name || name)}</div>
          <div class="row"><strong>Area:</strong> ${safe(savedBooking.hotel_area || area)}</div>
          <div class="row"><strong>Check-in Date:</strong> ${safe(String(savedBooking.check_in_date || checkIn).slice(0, 10))}</div>
          <div class="row"><strong>Number of Guests:</strong> ${safe(savedBooking.guest_count ?? guests)}</div>
          <div class="row"><strong>Price per Night:</strong> ₹${safe(savedBooking.price_per_night ?? price)}</div>
          <div class="status"><strong>Status:</strong> ${safe(savedBooking.enquiry_status || "PENDING")}<br/>This is an enquiry receipt, not a confirmed hotel reservation.</div>
          <small>Keep your booking reference to check the latest status on the TravelSafe website.</small>
        </main>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  }

  function openHistory() {
    setShowDetails(false);
    document.getElementById("hotel-enquiry-history")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      const input = document.getElementById("historyBookingId");
      if (input && savedBooking?.booking_reference) {
        input.value = savedBooking.booking_reference;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, 450);
  }

  return (
    <>
      <div className="hotel-card">
        <div className="hotel-image">
          <img
            src={image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
            alt={name}
          />
          <span className="hotel-rating">⭐ {rating}/5</span>
        </div>

        <div className="hotel-info">
          <h3>{name}</h3>
          <p>📍 {area}</p>
          <p>🛡️ {safety}</p>
          <div className="hotel-footer">
            <div><strong>₹{price}</strong><span> / night</span></div>
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                setShowDetails(true);
                setShowBooking(false);
                setMessage("");
                setSavedBooking(null);
              }}
            >
              View Hotel →
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          className="hotel-modal-overlay"
          onClick={() => {
            if (!isSubmitting) setShowDetails(false);
          }}
        >
          <div className="hotel-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="hotel-modal-close"
              type="button"
              onClick={() => {
                if (!isSubmitting) setShowDetails(false);
              }}
              aria-label="Close hotel details"
              disabled={isSubmitting}
            >
              ×
            </button>

            <img
              src={image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
              alt={name}
            />
            <h2>{name}</h2>
            <p>📍 {area}</p>
            <p>⭐ {rating}/5 rating</p>
            <p>🛡️ {safety}</p>
            <h3>₹{price} / night</h3>

            {savedBooking ? (
              <div className="booking-success-panel" role="status" aria-live="polite">
                <h3>✅ Enquiry Saved Successfully</h3>
                <p><strong>Booking Reference:</strong> {savedBooking.booking_reference}</p>
                <p><strong>Hotel:</strong> {savedBooking.hotel_name || name}</p>
                <p><strong>Check-in:</strong> {String(savedBooking.check_in_date || checkIn).slice(0, 10)}</p>
                <p><strong>Status:</strong> {savedBooking.enquiry_status || "PENDING"}</p>
                <p>Your request will remain pending until the admin confirms or rejects it.</p>
                <div className="booking-action-buttons">
                  <button className="primary-btn" type="button" onClick={printReceipt}>
                    🖨️ Print Receipt
                  </button>
                  <button className="primary-btn" type="button" onClick={openHistory}>
                    View Booking History
                  </button>
                  <button className="outline-btn" type="button" onClick={() => setShowDetails(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : !showBooking ? (
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  setShowBooking(true);
                  setMessage("");
                }}
              >
                Book This Hotel
              </button>
            ) : (
              <form className="hotel-booking-form" onSubmit={handleBooking}>
                <h3>Booking Enquiry</h3>
                <label>
                  Full Name
                  <input type="text" value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={100} required disabled={isSubmitting} />
                </label>
                <label>
                  Email Address
                  <input type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} maxLength={150} required disabled={isSubmitting} />
                </label>
                <label>
                  Check-in Date
                  <input type="date" value={checkIn} min={new Date().toISOString().split("T")[0]} onChange={(event) => setCheckIn(event.target.value)} required disabled={isSubmitting} />
                </label>
                <label>
                  Number of Guests
                  <select value={guests} onChange={(event) => setGuests(Number(event.target.value))} disabled={isSubmitting}>
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                </label>
                <button className="primary-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Booking Enquiry"}
                </button>
                {message && <p className="booking-success" role="status" aria-live="polite">{message}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default HotelCard;
