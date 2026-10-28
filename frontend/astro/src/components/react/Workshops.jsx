const workshops = [
  { title: 'Belaying Workshop', circle: ['Belaying', 'Workshop'], color: '#0E9AA7',
    text: 'Learn to manage the rope and catch a fall for your climbing partner.' },
  { title: 'Lead Climbing Workshop', circle: ['Lead', 'Workshop'], color: '#F2B705', textColor: '#1F1F21',
    text: 'Clip your own protection and climb with the rope below you.' },
  { title: 'Rappelling Workshop', circle: ['Rappelling', 'Workshop'], color: '#D63A6E',
    text: 'Descend a rope in a controlled way, with the right setup and safety checks.' },
  { title: 'Climbing Equipment & Safety Workshop', circle: ['Equipment', '& Safety'], color: '#2F6FDE',
    text: 'Know your gear, how to check it, and the safety habits that matter.' },
  { title: 'Anchor Setup Workshop', circle: ['Anchor', 'Setup'], color: '#9C6B4E',
    text: 'Build safe, solid anchors for top-rope climbing and rappelling.' },
];

export default function Workshops({ href = '/sessions/' }) {
  return (
    <section className="ws">
      <div className="wrap">
        <h2>Workshops - Learn the real world climbing skills</h2>
        <p className="ws-sub">
          Hands-on workshops that take you from first safety checks to leading and rappelling.
        </p>

        <div className="ws-grid">
          {workshops.map((w) => (
            <article className="ws-card" key={w.title}>
              <div
                className="ws-circle"
                style={{
                  background: w.color,
                  color: w.textColor || '#fff',
                  boxShadow: `0 12px 26px ${w.color}66`,
                }}
              >
                <big>★</big>
                {w.circle[0]}
                <br />
                {w.circle[1]}
              </div>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </article>
          ))}
        </div>

        <div className="ws-cta">
          <a className="pa-btn" href="https://www.climbcruxpakistan.com/private-premium/">Book a workshop →</a>
        </div>
      </div>
    </section>
  );
}
