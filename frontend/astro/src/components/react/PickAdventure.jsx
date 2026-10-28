// Resize Cloudinary images so the page loads faster
const opt = (url, w = 1000) =>
  url.replace(/\/upload\/(v\d+\/)/, `/upload/w_${w},q_auto,f_auto/$1`);

export default function PickAdventure({
  publicImage,
  privateImage,
  publicHref = '/sessions/',
  privateHref = '/private-premium/', // agent: use the same URL as the "Private & Premium" nav link
}) {
  return (
    <section className="pa">
      <div className="wrap">
        <div className="pa-tag">Two ways to climb with us</div>
        <h2>Pick your adventure</h2>

        <div className="pa-grid">
          <article className="pa-card">
            <div className="pa-img">
              <img src={opt(publicImage)} alt="Climb Crux group at a public rock climbing session" loading="lazy" />
              <span className="pa-chip">Open to all</span>
            </div>
            <div className="pa-body">
              <h3>Public Sessions</h3>
              <p>Join a guided rock climbing session with other climbers and meet the Climb Crux community.</p>
              <ul>
                <li>Beginner-friendly guided climbs</li>
                <li>Experienced instructors on the rock</li>
                <li>Meet climbers from across Islamabad</li>
              </ul>
              <a className="pa-btn" href={publicHref}>Join a public session →</a>
            </div>
          </article>

          <article className="pa-card dark">
            <div className="pa-img">
              <img src={opt(privateImage)} alt="Private climbing training with Climb Crux" loading="lazy" />
              <span className="pa-chip">By arrangement</span>
            </div>
            <div className="pa-body">
              <h3>Private &amp; Premium</h3>
              <p>A session planned around you or your group, with more time and attention from our guides.</p>
              <ul>
                <li>Your own group, your own pace</li>
                <li>Pick the crag and the focus</li>
                <li>Ideal for teams, families and events</li>
              </ul>
              <a className="pa-btn ghost" href={privateHref}>Plan a private session →</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
