import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner() {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const startScanner = async () => {
    setError("");
    setResult(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      setScanning(true);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // QR milte hi scanner ko dobara trigger hone se roko
          setScanning(false);
          setLoading(true);

          try {
            await scannerRef.current.stop();

            let bookingReference = "";

            // Hamare ticket ka QR JSON data contain karta hai
            try {
              const qrData = JSON.parse(decodedText);
              bookingReference = qrData.reference || "";
            } catch {
              // Agar QR mein direct booking reference ho
              bookingReference = decodedText.trim();
            }

            if (!bookingReference) {
              throw new Error("QR code mein booking reference nahi mila.");
            }
            const response = await fetch(
              `http://localhost:5000/api/bookings/${encodeURIComponent(bookingReference)}/verify`,
            );

            const data = await response.json();

            if (!response.ok || !data.verified) {
              setResult({
                verified: false,
                message: data.message || "Booking verify nahi hui.",
              });
            } else {
              setResult({
                verified: true,
                message: data.message,
                booking: data.booking,
              });
            }
          } catch (err) {
            setError(err.message || "Booking verify nahi ho paayi.");
          } finally {
            setLoading(false);
          }
        },
        () => {
          // QR detect na hone par error dikhane ki zaroorat nahi
        },
      );
    } catch (err) {
      setScanning(false);
      setError(
        "Camera start nahi hua. Browser mein camera permission allow karo.",
      );
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner
          .stop()
          .catch((err) => console.error("Scanner cleanup error:", err));
      }
    };
  }, []);

  return (
    <div className="qr-scanner-page">
      <h2>🎫 Verify Tourist Ticket</h2>

      <p>Ticket par diya gaya QR Code scan karke booking verify karo.</p>

      <div
        id="qr-reader"
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "20px auto",
        }}
      />

      {!scanning && !loading && (
        <button onClick={startScanner}>📷 Start QR Scanner</button>
      )}

      {scanning && <p>Camera active hai. QR Code scan karo...</p>}

      {loading && <p>Booking verify ho rahi hai...</p>}

      {error && (
        <div style={{ color: "red", marginTop: "15px" }}>❌ {error}</div>
      )}

      {result && (
        <div
          style={{
            margin: "20px auto",
            padding: "20px",
            maxWidth: "450px",
            border: `2px solid ${result.verified ? "green" : "red"}`,
            borderRadius: "10px",
            textAlign: "left",
          }}
        >
          <h3 style={{ color: result.verified ? "green" : "red" }}>
            {result.verified
              ? "✅ BOOKING VERIFIED"
              : "❌ BOOKING NOT VERIFIED"}
          </h3>

          <p>{result.message}</p>

          {result.booking && (
            <>
              <p>
                <strong>Reference:</strong> {result.booking.booking_reference}
              </p>

              <p>
                <strong>Tourist:</strong> {result.booking.tourist_name}
              </p>

              <p>
                <strong>Destination:</strong> {result.booking.destination_name}
              </p>

              <p>
                <strong>City:</strong> {result.booking.city}
              </p>

              <p>
                <strong>Visit Date:</strong>{" "}
                {String(result.booking.visit_date).slice(0, 10)}
              </p>

              <p>
                <strong>Entry Time:</strong> {result.booking.entry_time}
              </p>

              <p>
                <strong>Adults:</strong> {result.booking.adult_count}
              </p>

              <p>
                <strong>Children:</strong> {result.booking.child_count}
              </p>

              <p>
                <strong>Total Amount:</strong> ₹{result.booking.total_amount}
              </p>

              <p>
                <strong>Status:</strong> {result.booking.booking_status}
              </p>
            </>
          )}

          <button
            onClick={() => {
              setResult(null);
              setError("");
            }}
            style={{ marginTop: "10px" }}
          >
            Scan Another Ticket
          </button>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
