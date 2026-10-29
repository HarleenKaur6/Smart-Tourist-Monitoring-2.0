import { useState } from "react";

function ComplaintForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Safety Issue");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !description.trim()) {
      setMessage("Please fill in all required fields.");
      setMessageType("error");
      return;
    }

    setMessage(
      "Your complaint has been submitted successfully! (Demo only)"
    );
    setMessageType("success");

    setName("");
    setEmail("");
    setCategory("Safety Issue");
    setDescription("");
  }

  return (
    <form className="complaint-form" onSubmit={handleSubmit}>
      {/* Full Name */}
      <label htmlFor="complaint-name">
        Full Name
        <input
          id="complaint-name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      {/* Email */}
      <label htmlFor="complaint-email">
        Email Address
        <input
          id="complaint-email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      {/* Complaint Category */}
      <label htmlFor="complaint-category">
        Complaint Category
        <select
          id="complaint-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="Safety Issue">Safety Issue</option>
          <option value="Fraud">Fraud</option>
          <option value="Hidden Charges">Hidden Charges</option>
          <option value="Hotel Complaint">Hotel Complaint</option>
          <option value="Guide Complaint">Guide Complaint</option>
          <option value="Other">Other</option>
        </select>
      </label>

      {/* Complaint Details */}
      <label htmlFor="complaint-description">
        Complaint Details
        <textarea
          id="complaint-description"
          placeholder="Describe your complaint here..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          required
        />
      </label>

      {/* Submit Button */}
      <button type="submit" className="primary-btn">
        Submit Complaint →
      </button>

      {/* Success/Error Message */}
      {message && (
        <p
          className={`complaint-message ${messageType}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </form>
  );
}

export default ComplaintForm;