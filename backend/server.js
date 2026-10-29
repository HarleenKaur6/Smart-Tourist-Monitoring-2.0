const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175"
        ],
    })
);
app.use(express.json());

// Home API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart Tourist Monitoring Backend is running!",
    });
});

// Backend health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is working properly.",
    });
});

// MySQL connection test
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            success: true,
            message: "MySQL connected successfully!",
            database: rows[0].database_name,
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
        });
    }
});

// Get all tourist destinations
// Register a new user
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Validate name
        if (!cleanName || cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid name."
            });
        }

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail) || cleanEmail.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Check if email already exists
        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered. Please log in."
            });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 12);

        // Save user in MySQL
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`,
            [cleanName, cleanEmail, hashedPassword]
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful!",
            user: {
                id: result.insertId,
                name: cleanName,
                email: cleanEmail
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
});
// Login existing user
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user by email
        const [users] = await pool.execute(
            `SELECT id, name, email, password
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        // Compare entered password with hashed password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        return res.json({
            success: true,
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
});
// Get available states
app.get("/api/states", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT state
            FROM destinations
            WHERE state IS NOT NULL
              AND state <> ''
            ORDER BY state
        `);

        res.json({
            success: true,
            states: rows.map((row) => row.state),
        });
    } catch (error) {
        console.error("States API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch states.",
        });
    }
});

// Add a tourist destination
app.post("/api/destinations", async (req, res) => {
    try {
        const {
            name,
            city,
            description,
            entry_fee,
            opening_time,
            closing_time,
        } = req.body;

        if (!name || !city) {
            return res.status(400).json({
                success: false,
                message: "Destination name and city are required.",
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO destinations
            (name, city, description, entry_fee, opening_time, closing_time)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                city,
                description || null,
                entry_fee ?? 0,
                opening_time || null,
                closing_time || null,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Destination added successfully!",
            id: result.insertId,
        });
    } catch (error) {
        console.error("Add destination error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to add destination.",
        });
    }
});
// Get all tourist destinations
app.get("/api/destinations", async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT
        id,
        name,
        city,
        state,
        description,
        entry_fee,
        opening_time,
        closing_time,
        last_entry_time

      FROM destinations
      ORDER BY city, name
    `);

        res.json({
            success: true,
            count: rows.length,
            destinations: rows,
        });
    } catch (error) {
        console.error("Destinations API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch destinations.",
        });
    }
});
// Create a new ticket booking
app.post("/api/bookings", async (req, res) => {
    try {
        const {
            tourist_name,
            email,
            destination_id,
            visit_date,
            entry_time,
            adult_count,
            child_count,
        } = req.body;

        // Validate required fields
        if (
            !tourist_name ||
            !email ||
            !destination_id ||
            !visit_date ||
            !entry_time
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        const adults = Number(adult_count ?? 1);
        const children = Number(child_count ?? 0);
        const destinationId = Number(destination_id);

        if (
            !Number.isInteger(destinationId) ||
            destinationId <= 0 ||
            !Number.isInteger(adults) ||
            !Number.isInteger(children) ||
            adults < 1 ||
            children < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid ticket quantities and destination.",
            });
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        // Validate visit date format
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(visit_date) ||
            Number.isNaN(Date.parse(`${visit_date}T00:00:00Z`)) ||
            new Date(`${visit_date}T00:00:00Z`).toISOString().slice(0, 10) !== visit_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid visit date.",
            });
        }

        // Find destination and its ticket price
        const [destinations] = await pool.execute(
            `SELECT id, name, entry_fee
             FROM destinations
             WHERE id = ?`,
            [destinationId]
        );

        if (destinations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Destination not found.",
            });
        }

        const destination = destinations[0];

        // Calculate total using the database ticket price
        const adultPrice = Number(destination.entry_fee);
        const childPrice = adultPrice; // Demo pricing: same price for children

        const totalAmount =
            adults * adultPrice + children * childPrice;

        // Generate a unique booking reference
        const bookingReference =
            "STM" +
            Date.now().toString() +
            Math.floor(Math.random() * 1000).toString().padStart(3, "0");

        // Save booking in MySQL
        const [result] = await pool.execute(
            `INSERT INTO bookings
            (
                booking_reference,
                tourist_name,
                email,
                destination_id,
                visit_date,
                entry_time,
                adult_count,
                child_count,
                total_amount,
                booking_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bookingReference,
                tourist_name.trim(),
                email.trim(),
                destinationId,
                visit_date,
                entry_time,
                adults,
                children,
                totalAmount,
                "CONFIRMED",
            ]
        );

        res.status(201).json({
            success: true,
            message: "Ticket booking successful!",
            booking: {
                id: result.insertId,
                booking_reference: bookingReference,
                tourist_name: tourist_name.trim(),
                email: email.trim(),
                destination: destination.name,
                destination_id: destinationId,
                visit_date: visit_date,
                entry_time: entry_time,
                adult_count: adults,
                child_count: children,
                total_amount: totalAmount,
                booking_status: "CONFIRMED",
            },
        });
    } catch (error) {
        console.error("Ticket booking error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to complete ticket booking.",
        });
    }
});
// Verify booking using booking reference
app.get("/api/bookings/:reference/verify", async (req, res) => {
    try {
        const reference = String(req.params.reference || "").trim();

        if (!reference) {
            return res.status(400).json({
                success: false,
                verified: false,
                message: "Booking reference is required."
            });
        }

        const [rows] = await pool.execute(
            `SELECT
                b.booking_reference,
                b.tourist_name,
                b.destination_id,
                d.name AS destination_name,
                d.city,
                b.visit_date,
                b.entry_time,
                b.adult_count,
                b.child_count,
                b.total_amount,
                b.booking_status
             FROM bookings b
             INNER JOIN destinations d
                ON d.id = b.destination_id
             WHERE b.booking_reference = ?
             LIMIT 1`,
            [reference]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: true,
                verified: false,
                message: "Booking reference not found."
            });
        }

        const booking = rows[0];
        const verified =
            String(booking.booking_status).toUpperCase() === "CONFIRMED";

        return res.json({
            success: true,
            verified,
            message: verified
                ? "Booking verified successfully."
                : "Booking exists but is not confirmed.",
            booking
        });

    } catch (error) {
        console.error("Booking verification error:", error.message);

        return res.status(500).json({
            success: false,
            verified: false,
            message: "Unable to verify booking."
        });
    }
});
// Save hotel booking enquiry
app.post("/api/hotel-enquiries", async (req, res) => {
    try {
        const {
            guest_name,
            guest_email,
            hotel_name,
            hotel_area,
            check_in_date,
            guest_count,
            price_per_night,
        } = req.body;

        // Validate required fields
        if (
            !guest_name ||
            !guest_email ||
            !hotel_name ||
            !hotel_area ||
            !check_in_date ||
            guest_count === undefined ||
            price_per_night === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        const name = String(guest_name).trim();
        const email = String(guest_email).trim().toLowerCase();
        const hotelName = String(hotel_name).trim();
        const hotelArea = String(hotel_area).trim();

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        // Validate name and hotel details
        if (
            !name ||
            name.length > 100 ||
            email.length > 150 ||
            !hotelName ||
            hotelName.length > 150 ||
            !hotelArea ||
            hotelArea.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid booking details.",
            });
        }

        // Validate check-in date
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(check_in_date) ||
            Number.isNaN(Date.parse(`${check_in_date}T00:00:00Z`)) ||
            new Date(`${check_in_date}T00:00:00Z`)
                .toISOString()
                .slice(0, 10) !== check_in_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid check-in date.",
            });
        }

        const guests = Number(guest_count);
        const price = Number(price_per_night);

        if (
            !Number.isInteger(guests) ||
            guests < 1 ||
            guests > 20 ||
            !Number.isFinite(price) ||
            price < 0 ||
            price > 99999999
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid guest count and hotel price.",
            });
        }

        // Generate a unique booking reference
        const bookingReference =
            "HTL" +
            Date.now().toString() +
            Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0");

        // Save enquiry in MySQL
        const [result] = await pool.execute(
            `INSERT INTO hotel_enquiries (
                booking_reference,
                guest_name,
                guest_email,
                hotel_name,
                hotel_area,
                check_in_date,
                guest_count,
                price_per_night,
                enquiry_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bookingReference,
                name,
                email,
                hotelName,
                hotelArea,
                check_in_date,
                guests,
                price,
                "PENDING",
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Hotel enquiry submitted successfully!",
            booking: {
                id: result.insertId,
                booking_reference: bookingReference,
                guest_name: name,
                guest_email: email,
                hotel_name: hotelName,
                hotel_area: hotelArea,
                check_in_date,
                guest_count: guests,
                price_per_night: price,
                enquiry_status: "PENDING",
            },
        });
    } catch (error) {
        console.error("Hotel enquiry error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Booking reference conflict. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to save hotel enquiry. Please try again.",
        });
    }
});
// Get hotel enquiry history using booking referrnce
app.get("/api/hotel-enquiries/:reference", async (req, res) => {
    try {
        const reference = String(req.params.reference || "").trim();

        const [rows] = await pool.execute(
            `SELECT booking_reference, guest_name, guest_email,
                    hotel_name, hotel_area, check_in_date,
                    guest_count, price_per_night, enquiry_status
             FROM hotel_enquiries
             WHERE booking_reference = ?
             LIMIT 1`,
            [reference]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hotel enquiry not found."
            });
        }

        res.json({
            success: true,
            booking: rows[0]
        });
    } catch (error) {
        console.error("Hotel enquiry history error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch hotel enquiry details."
        });
    }
});
// Get all hotel enquiries for Admin Dashboard
app.get("/api/hotel-enquiries", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT booking_reference, guest_name, guest_email,
                    hotel_name, hotel_area, check_in_date,
                    guest_count, price_per_night, enquiry_status
             FROM hotel_enquiries
             ORDER BY booking_reference DESC`
        );

        res.json({
            success: true,
            bookings: rows
        });
    } catch (error) {
        console.error("Fetch hotel enquiries error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch hotel enquiries."
        });
    }
});
// Update hotel enquiry status
app.patch("/api/hotel-enquiries/:reference/status", async (req, res) => {
    try {
        const reference = String(req.params.reference || "").trim();
        const status = String(req.body.status || "").toUpperCase();

        if (!["CONFIRMED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be CONFIRMED or REJECTED."
            });
        }

        const [result] = await pool.execute(
            `UPDATE hotel_enquiries
             SET enquiry_status = ?
             WHERE booking_reference = ?`,
            [status, reference]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Hotel enquiry not found."
            });
        }

        res.json({
            success: true,
            message: `Hotel enquiry ${status.toLowerCase()} successfully.`
        });
    } catch (error) {
        console.error("Update hotel status error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to update hotel enquiry status."
        });
    }
});
// Start backend server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});