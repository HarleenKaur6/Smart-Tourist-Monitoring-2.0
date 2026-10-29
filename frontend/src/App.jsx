import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "./App.css";

// IMPORTANT: This import matches the filename NavBar.jsx.
// If your actual file is named Navbar.jsx, rename the file to NavBar.jsx
// or update this import so the capitalization matches exactly.
import Navbar from "./components/NavBar.jsx";
import GuideCard from "./components/GuideCard.jsx";
import HotelCard from "./components/HotelCard.jsx";
import EmergencyCard from "./components/EmergencyCard.jsx";
import ComplaintForm from "./components/ComplaintForm.jsx";
import HotelEnquiryHistory from "./pages/HotelEnquiryHistory.jsx";
import AdminHotelDashboard from "./pages/AdminHotelDashboard.jsx";

const API_BASE = "http://localhost:5000";

// Images are matched to destination names returned by the backend.
// Unknown destinations use a safe travel-themed fallback image.
const DESTINATION_IMAGES = [
  {
    keywords: ["golden temple", "harmandir"],
    image: "../public/image/Goldentemple.jpg",
  },
  { keywords: ["taj mahal"], image: "../public/image/Tajmahl.jpg" },
  { keywords: ["red fort", "lal qila"], image: "../public/image/Redfort.jpg" },
  { keywords: ["lotus temple"], image: "../public/image/lowtustemple.jpg" },
  {
    keywords: ["qutub minar", "qutub", "kutub"],
    image: "../public/image/Qubminar.jpg",
  },
  { keywords: ["india gate"], image: "../public/image/Indiagate.jpg" },
  { keywords: ["humayun"], image: "../public/image/Humayuntomb.jpg" },
  {
    keywords: ["amer fort", "amber fort"],
    image: "../public/image/Amerfort.jpg",
  },
  { keywords: ["hawa mahal"], image: "../public/image/Hawmahal.jpg" },
  { keywords: ["manali"], image: "../public/image/Manali.jpg" },
  {
    keywords: ["goa beaches", "goa beach"],
    image: "../public/image/Goabeach.jpg",
  },
  { keywords: ["dal lake"], image: "../public/image/Dalalke.jpg" },
];

// const FALLBACK_DESTINATION_IMAGE =
//   "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85";

function getDestinationImage(destination) {
  const name =
    `${destination?.name || ""} ${destination?.city || ""} ${destination?.state || ""}`.toLowerCase();

  return (
    DESTINATION_IMAGES.find((item) =>
      item.keywords.some((keyword) => name.includes(keyword)),
    )?.image || "/images/manali.png"
  );
}

const TIME_OPTIONS = [
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
];

function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  if (value.toLowerCase().includes("open all day")) return null;

  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function getTodayDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function App() {
  const [destinations, setDestinations] = useState([]);
  const [destinationsError, setDestinationsError] = useState("");
  const [selectedDestinationId, setSelectedDestinationId] = useState("");
  const [searchText, setSearchText] = useState("");

  const [touristName, setTouristName] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

  const [bookingLoading, setBookingLoading] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [ticket, setTicket] = useState(null);
  useEffect(() => {
    let cancelled = false;

    async function loadDestinations() {
      try {
        const response = await axios.get(`${API_BASE}/api/destinations`);
        const data = response.data;

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.destinations)
            ? data.destinations
            : [];

        if (!cancelled) {
          setDestinations(rows);
        }
      } catch (error) {
        console.error("Error loading destinations:", error);

        if (!cancelled) {
          setDestinations([]);
          setDestinationsError(
            "Unable to load destinations. Please try again later.",
          );
        }
      }
    }

    loadDestinations();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDestination = destinations.find(
    (destination) => String(destination.id) === String(selectedDestinationId),
  );

  const availableTimes = useMemo(() => {
    if (!selectedDestination) return [];

    const opening = timeToMinutes(selectedDestination.opening_time);
    const closing = timeToMinutes(selectedDestination.closing_time);
    const lastEntry = timeToMinutes(selectedDestination.last_entry_time);

    return TIME_OPTIONS.filter((time) => {
      const minutes = timeToMinutes(time);
      if (opening !== null && minutes < opening) return false;
      if (closing !== null && minutes > closing) return false;
      if (lastEntry !== null && minutes > lastEntry) return false;
      return true;
    });
  }, [selectedDestination]);

  // Compute a valid time instead of calling setState inside useEffect.
  const effectiveEntryTime = availableTimes.includes(entryTime)
    ? entryTime
    : availableTimes[0] || "";

  const filteredDestinations = destinations.filter((destination) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;

    return [
      destination.name,
      destination.city,
      destination.state,
      destination.description,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const totalAmount =
    (Number(selectedDestination?.entry_fee) || 0) *
    (Math.max(1, Number(adultCount) || 1) +
      Math.max(0, Number(childCount) || 0));

  function selectDestination(destination) {
    setSelectedDestinationId(String(destination.id));
    document
      .getElementById("booking-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    setBookingError("");
    setTicket(null);

    if (!selectedDestination) {
      setBookingError("Please select a destination.");
      return;
    }

    if (
      !touristName.trim() ||
      !email.trim() ||
      !visitDate ||
      !effectiveEntryTime
    ) {
      setBookingError("Please fill in all required booking details.");
      return;
    }

    if (Number(adultCount) < 1 || Number(childCount) < 0) {
      setBookingError("At least one adult is required.");
      return;
    }

    const selectedMinutes = timeToMinutes(effectiveEntryTime);
    const opening = timeToMinutes(selectedDestination.opening_time);
    const closing = timeToMinutes(selectedDestination.closing_time);
    const lastEntry = timeToMinutes(selectedDestination.last_entry_time);

    if (opening !== null && selectedMinutes < opening) {
      setBookingError(
        `Entry starts at ${selectedDestination.opening_time}. Please choose a later time.`,
      );
      return;
    }
    if (closing !== null && selectedMinutes > closing) {
      setBookingError(
        `This destination closes at ${selectedDestination.closing_time}.`,
      );
      return;
    }
    if (lastEntry !== null && selectedMinutes > lastEntry) {
      setBookingError(
        `Last entry is ${selectedDestination.last_entry_time}. Please choose an earlier time.`,
      );
      return;
    }

    setBookingLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/bookings`, {
        tourist_name: touristName.trim(),
        email: email.trim(),
        destination_id: Number(selectedDestination.id),
        visit_date: visitDate,
        entry_time: effectiveEntryTime,
        adult_count: Number(adultCount),
        child_count: Number(childCount),
        total_amount: totalAmount,
      });

      const booking = response.data?.booking || response.data || {};
      setTicket({
        ...booking,
        booking_reference:
          booking.booking_reference || `TSM-${Date.now().toString().slice(-8)}`,
        tourist_name: booking.tourist_name || touristName.trim(),
        email: booking.email || email.trim(),
        destination_name: selectedDestination.name,
        city: selectedDestination.city,
        visit_date: booking.visit_date || visitDate,
        entry_time: booking.entry_time || effectiveEntryTime,
        adult_count: booking.adult_count ?? Number(adultCount),
        child_count: booking.child_count ?? Number(childCount),
        total_amount: booking.total_amount ?? totalAmount,
      });
    } catch (error) {
      setBookingError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Booking nahi ho paayi. Backend/API check karke dobara try karein.",
      );
    } finally {
      setBookingLoading(false);
    }
  }

  function printTicket() {
    window.print();
  }

  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">🛡️ Safer travel starts here</div>
            <h1>
              Travel Smart.
              <br />
              <span>Travel Safe.</span>
            </h1>
            <p>
              Discover verified tourist guides, transparent entry fees and safer
              stays — all in one place.
            </p>

            <div className="hero-buttons">
              <a className="primary-btn" href="#book-tickets">
                Explore Destinations →
              </a>
              <a className="outline-btn" href="#guides">
                Find a Verified Guide
              </a>
            </div>

            <form
              className="search-box"
              onSubmit={(event) => {
                event.preventDefault();
                document
                  .getElementById("book-tickets")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <label className="search-input" htmlFor="destination-search">
                <span>📍</span>
                <span className="search-copy">
                  <small>Where do you want to go?</small>
                  <span>Search a city or destination</span>
                </span>
              </label>
              <input
                id="destination-search"
                type="search"
                placeholder="e.g. Delhi, Jaipur..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <button className="search-btn" type="submit">
                Search
              </button>
            </form>
          </div>

          <div className="hero-visual" aria-label="TravelSafe highlights">
            <div className="visual-card main-card">
              <div className="place-icon">🏛️</div>
              <div>
                <span>Popular Destination</span>
                <h3>Explore India</h3>
                <p>Discover places and plan your visit</p>
              </div>
            </div>
            <div className="floating-card guide-card">
              <span className="check">✓</span>
              <div>
                <strong>Safer Travel</strong>
                <small>Plan with confidence</small>
              </div>
            </div>
            <div className="floating-card fee-card">
              <span>₹</span>
              <div>
                <strong>Transparent Fees</strong>
                <small>See entry fees before booking</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-section" aria-label="TravelSafe benefits">
          <div className="trust-card">
            <div className="trust-icon">✓</div>
            <div>
              <h3>Verified Guides</h3>
              <p>Find trusted tourist guides.</p>
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-icon">₹</div>
            <div>
              <h3>Transparent Fees</h3>
              <p>Know fees before booking.</p>
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-icon">🛡️</div>
            <div>
              <h3>Safer Hotels</h3>
              <p>Check hotel safety details.</p>
            </div>
          </div>
        </section>

        <section className="ticket-verification">
          <h2>🎫 Verify Your Ticket</h2>

          <p>
            Enter your booking reference to check whether your booking is
            confirmed.
          </p>

          <form
            onSubmit={async (event) => {
              event.preventDefault();

              const reference =
                event.currentTarget.bookingReference.value.trim();

              if (!reference) {
                alert("Please enter your booking reference.");
                return;
              }

              try {
                const response = await fetch(
                  `http://localhost:5000/api/bookings/${encodeURIComponent(reference)}/verify`,
                );

                const data = await response.json();

                if (!response.ok || !data.verified) {
                  alert(data.message || "Booking not found or not confirmed.");
                  return;
                }

                const booking = data.booking;

                alert(
                  `BOOKING VERIFIED!\n\n` +
                    `Reference: ${booking.booking_reference}\n` +
                    `Name: ${booking.tourist_name}\n` +
                    `Destination: ${booking.destination_name}\n` +
                    `Visit Date: ${booking.visit_date}\n` +
                    `Status: ${booking.booking_status}`,
                );
              } catch (error) {
                console.error("Verification error:", error);
                alert(
                  "Cannot connect to the server. Please check your backend.",
                );
              }
            }}
          >
            <input
              type="text"
              name="bookingReference"
              placeholder="Enter booking reference"
              required
            />

            <button className="primary-btn" type="submit">
              Verify Booking
            </button>
          </form>
        </section>

        <section className="destinations" id="book-tickets">
          <div className="section-heading">
            <div>
              <span>EXPLORE &amp; BOOK</span>
              <h2>Popular Destinations</h2>
              <p>Check opening hours, last-entry time and ticket price.</p>
            </div>
          </div>

          <div className="destination-search-bar">
            <label htmlFor="destination-filter">Find a destination</label>
            <input
              id="destination-filter"
              type="search"
              placeholder="Search by place, city or state..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          {destinationsError && (
            <p className="form-message error" role="alert">
              {destinationsError}
            </p>
          )}
          {!destinationsError && destinations.length === 0 && (
            <p className="empty-state">
              Loading destinations from the server...
            </p>
          )}

          <div className="destination-grid">
            {filteredDestinations.map((destination) => (
              <article className="destination-card" key={destination.id}>
                <img
                  className="destination-photo"
                  src={getDestinationImage(destination)}
                  alt={`${destination.name} tourist attraction`}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "../public/image/Manali.jpg";
                  }}
                />
                <div className="destination-card-content">
                  <h3>{destination.name}</h3>
                  <p>
                    📍 {destination.city}
                    {destination.state ? `, ${destination.state}` : ""}
                  </p>
                  <p>
                    {destination.description ||
                      "Explore this popular tourist destination."}
                  </p>
                  <div className="destination-details">
                    <p>
                      <strong>Entry Fee:</strong> ₹{destination.entry_fee ?? 0}{" "}
                      per person
                    </p>
                    <p>
                      <strong>Opening:</strong>{" "}
                      {destination.opening_time || "Not available"}
                    </p>
                    <p>
                      <strong>Closing:</strong>{" "}
                      {destination.closing_time || "Not available"}
                    </p>
                    <p>
                      <strong>Last Entry:</strong>{" "}
                      {destination.last_entry_time || "Not specified"}
                    </p>
                  </div>
                  <button
                    className="primary-btn"
                    onClick={() => selectDestination(destination)}
                  >
                    Book Tickets →
                  </button>
                </div>
              </article>
            ))}
            {destinations.length > 0 && filteredDestinations.length === 0 && (
              <p className="empty-state">No destinations match your search.</p>
            )}
          </div>
        </section>

        <section className="booking-section" id="booking-form">
          <div className="section-heading">
            <div>
              <span>ONLINE BOOKING DEMO</span>
              <h2>Book Your Visit</h2>
              <p>Select your destination, date and available entry time.</p>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleBookingSubmit}>
            <label>
              Destination
              <select
                value={selectedDestinationId}
                onChange={(event) => {
                  setSelectedDestinationId(event.target.value);
                  setEntryTime("");
                  setBookingError("");
                }}
                required
              >
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name} — {destination.city}
                  </option>
                ))}
              </select>
            </label>

            {selectedDestination && (
              <div className="booking-timing-info">
                <p>
                  <strong>Opening:</strong>{" "}
                  {selectedDestination.opening_time || "Not available"}
                </p>
                <p>
                  <strong>Closing:</strong>{" "}
                  {selectedDestination.closing_time || "Not available"}
                </p>
                <p>
                  <strong>Last entry:</strong>{" "}
                  {selectedDestination.last_entry_time || "Not specified"}
                </p>
              </div>
            )}

            <label>
              Tourist Name
              <input
                type="text"
                autoComplete="name"
                value={touristName}
                onChange={(event) => setTouristName(event.target.value)}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Visit Date
              <input
                type="date"
                min={getTodayDate()}
                value={visitDate}
                onChange={(event) => setVisitDate(event.target.value)}
                required
              />
            </label>

            <label>
              Entry Time
              <select
                value={effectiveEntryTime}
                onChange={(event) => setEntryTime(event.target.value)}
                required
                disabled={availableTimes.length === 0}
              >
                {availableTimes.length === 0 && (
                  <option value="">No available times</option>
                )}
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Adults
              <input
                type="number"
                min="1"
                max="20"
                value={adultCount}
                onChange={(event) => setAdultCount(event.target.value)}
                required
              />
            </label>

            <label>
              Children
              <input
                type="number"
                min="0"
                max="20"
                value={childCount}
                onChange={(event) => setChildCount(event.target.value)}
                required
              />
            </label>

            <div className="booking-total">
              <strong>Estimated Total: ₹{totalAmount}</strong>
              <small>
                Demo calculation uses the listed entry fee for each visitor.
                Child pricing may need separate configuration.
              </small>
            </div>

            {bookingError && (
              <p className="form-message error" role="alert">
                {bookingError}
              </p>
            )}

            <button
              className="primary-btn"
              type="submit"
              disabled={
                bookingLoading ||
                destinations.length === 0 ||
                availableTimes.length === 0
              }
            >
              {bookingLoading ? "Booking..." : "Confirm Booking →"}
            </button>
          </form>

          {ticket && (
            <div className="ticket-card" id="ticket">
              <div className="ticket-details">
                <span className="ticket-status">BOOKING CONFIRMED</span>
                <h2>Your TravelSafe Ticket</h2>
                <p>
                  <strong>Booking Reference:</strong> {ticket.booking_reference}
                </p>
                <p>
                  <strong>Name:</strong> {ticket.tourist_name}
                </p>
                <p>
                  <strong>Destination:</strong> {ticket.destination_name} —{" "}
                  {ticket.city}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {String(ticket.visit_date).slice(0, 10)}
                </p>
                <p>
                  <strong>Entry Time:</strong> {ticket.entry_time}
                </p>
                <p>
                  <strong>Adults:</strong> {ticket.adult_count} |{" "}
                  <strong>Children:</strong> {ticket.child_count}
                </p>
                <p>
                  <strong>Total:</strong>{" "}
                  {Number(ticket.total_amount) === 0
                    ? "Free Entry"
                    : `₹${ticket.total_amount}`}
                </p>
                <p className="ticket-note">
                  This is a project demo ticket, not an official entry pass or
                  proof of payment.
                </p>
              </div>
              <div className="ticket-qr">
                <QRCodeCanvas
                  value={JSON.stringify({
                    type: "TravelSafeBooking",
                    reference: ticket.booking_reference,
                    name: ticket.tourist_name,
                    destination: ticket.destination_name,
                    date: String(ticket.visit_date).slice(0, 10),
                    time: ticket.entry_time,
                    adults: ticket.adult_count,
                    children: ticket.child_count,
                    total: ticket.total_amount,
                  })}
                  size={180}
                  includeMargin
                />
                <p>Scan booking QR</p>
              </div>
              <button
                className="primary-btn no-print"
                type="button"
                onClick={printTicket}
              >
                Print Ticket
              </button>
            </div>
          )}
        </section>

        <section className="guides-section" id="guides">
          <div className="section-heading">
            <div>
              <span>VERIFIED GUIDES</span>
              <h2>Find a Guide You Can Trust</h2>
              <p>Compare services, duration and guide fees before booking.</p>
            </div>
            <a className="outline-btn" href="#guides">
              View All Guides →
            </a>
          </div>
          <div className="guide-grid">
            <div className="guide-showcase">
              <img
                className="guide-profile-photo"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85"
                alt="Guide profile"
                loading="lazy"
              />
              <div className="guide-trust-badge">✓ Local guide</div>
              <GuideCard
                name="Aman Sharma"
                area="Old Delhi"
                service="Heritage Walk"
                duration="3 Hours"
                fee="800"
                rating="4.8"
              />
            </div>
            <div className="guide-showcase">
              <img
                className="guide-profile-photo"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=85"
                alt="Guide profile"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=85";
                }}
              />
              <div className="guide-trust-badge">✓ Local guide</div>
              <GuideCard
                name="Riya Mehta"
                area="Mehrauli"
                service="Historical Tour"
                duration="2 Hours"
                fee="600"
                rating="4.7"
              />
            </div>
            <div className="guide-showcase">
              <img
                className="guide-profile-photo"
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85"
                alt="Guide profile"
                loading="lazy"
              />
              <div className="guide-trust-badge">✓ Local guide</div>
              <GuideCard
                name="Arjun Singh"
                area="Connaught Place"
                service="City Tour"
                duration="2 Hours"
                fee="500"
                rating="4.9"
              />
            </div>
            <div className="guide-showcase">
              <img
                className="guide-profile-photo"
                src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=700&q=85"
                alt="Guide profile"
                loading="lazy"
              />
              <div className="guide-trust-badge">✓ Local guide</div>
              <GuideCard
                name="Simran Kaur"
                area="Amritsar"
                service="Golden Temple & Heritage Tour"
                duration="3 Hours"
                fee="700"
                rating="4.9"
              />
            </div>
            <div className="guide-showcase">
              <img
                className="guide-profile-photo"
                src="https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=700&q=85"
                alt="Guide profile"
                loading="lazy"
              />
              <div className="guide-trust-badge">✓ Local guide</div>
              <GuideCard
                name="Kabir Verma"
                area="Agra"
                service="Taj Mahal Guided Visit"
                duration="2 Hours"
                fee="900"
                rating="4.8"
              />
            </div>
            <div className="guide-showcase">
              <img
                className="guide-profile-photo"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85"
                alt="Guide profile"
                loading="lazy"
              />
              <div className="guide-trust-badge">✓ Local guide</div>
              <GuideCard
                name="Dev Malhotra"
                area="Jaipur"
                service="Fort & City Tour"
                duration="4 Hours"
                fee="1000"
                rating="4.8"
              />
            </div>
          </div>
        </section>

        <section className="hotels-section" id="hotels">
          <div id="hotel-enquiry-history">
            <HotelEnquiryHistory />
          </div>
          <div className="section-heading">
            <div>
              <span>HOTEL SAFETY</span>
              <h2>Stay Somewhere Safer</h2>
              <p>
                Check important safety information before booking your hotel.
              </p>
            </div>
            <a className="outline-btn" href="#hotel-enquiry-history">
              Check Booking History →
            </a>
          </div>
          <div className="hotel-grid">
            <HotelCard
              name="Heritage Inn"
              area="Old Delhi"
              safety="24/7 Security"
              rating="4.6"
              price="2200"
              image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
            />
            <HotelCard
              name="City Comfort Hotel"
              area="Connaught Place"
              safety="CCTV & Reception"
              rating="4.7"
              price="2800"
              image="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"
            />

            <HotelCard
              name="Royal Stay"
              area="Mehrauli"
              safety="Verified Property"
              rating="4.8"
              price="2500"
              image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"
            />
          </div>
        </section>

        <section className="emergency-section" id="emergency">
          <div className="emergency-heading">
            <span>EMERGENCY SUPPORT</span>
            <h2>Need Help? We’re Here.</h2>
            <p>
              Quick access to important emergency services while travelling.
            </p>
          </div>
          <div className="emergency-grid">
            <EmergencyCard
              icon="🚓"
              title="Police"
              description="For immediate safety and security assistance."
              number="112"
            />
            <EmergencyCard
              icon="🚑"
              title="Ambulance"
              description="For medical emergencies and urgent assistance."
              number="108"
            />
            <EmergencyCard
              icon="🆘"
              title="Tourist Helpline"
              description="Get assistance with tourist-related problems."
              number="1363"
            />
          </div>
          <div className="sos-box">
            <div className="sos-icon">🆘</div>
            <div>
              <h3>Emergency SOS</h3>
              <p>
                In a serious emergency, contact the appropriate emergency
                service immediately.
              </p>
            </div>
            <a className="sos-btn" href="tel:112">
              Call 112
            </a>
          </div>
        </section>

        <section className="complaints-section" id="complaints">
          <div className="complaint-heading">
            <span>REPORT A PROBLEM</span>
            <h2>Help Us Keep Tourism Safer</h2>
            <p>
              Report fraud, hidden charges, misleading information or safety
              issues.
            </p>
          </div>
          <ComplaintForm />
        </section>
        <section id="admin-dashboard">
          <AdminHotelDashboard />
        </section>
      </main>

      <footer className="footer">
        <a className="footer-logo" href="#top">
          🛡️ TravelSafe
        </a>
        <p>Travel smarter. Explore safer.</p>
        <div className="footer-links">
          <a href="#book-tickets">Destinations</a>
          <a href="#guides">Guides</a>
          <a href="#hotels">Hotels</a>
          <a href="#emergency">Emergency</a>
          <a href="#complaints">Report a problem</a>
        </div>
        <p className="copyright">
          © {new Date().getFullYear()} TravelSafe · Student project demo
        </p>
      </footer>
    </div>
  );
}

export default App;
