function EmergencyCard({ icon, title, description, number }) {
  return (
    <div className="emergency-card">
      <div className="emergency-icon">{icon}</div>

      <div className="emergency-info">
        <h3>{title}</h3>
        <p>{description}</p>

        <a href={`tel:${number}`} className="emergency-number">
          📞 Call {number}
        </a>
      </div>
    </div>
  );
}

export default EmergencyCard;