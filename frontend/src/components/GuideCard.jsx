function GuideCard({ name, area, service, duration, fee, rating }) {
  return (
    <div className="guide-card">
      <div className="guide-avatar">👨‍💼</div>

      <div className="guide-info">
        <h3>{name}</h3>
        <p>📍 {area}</p>
        <p>🎯 {service}</p>
        <p>⏱️ {duration}</p>
        <p>⭐ {rating} / 5</p>

        <div className="guide-footer">
          <strong>₹{fee}</strong>
          <span> / tour</span>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => alert(`You selected guide: ${name}`)}
        >
          Select Guide
        </button>
      </div>
    </div>
  );
}

export default GuideCard;