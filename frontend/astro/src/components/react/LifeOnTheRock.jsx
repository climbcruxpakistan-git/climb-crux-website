// Resize Cloudinary images so the page loads faster
const opt = (url, w) =>
  url.replace(/\/upload\/(v\d+\/)/, `/upload/w_${w},q_auto,f_auto/$1`);

const base = 'https://res.cloudinary.com/ivvx77mg/image/upload/';

// The first item is the big main image. `pos` sets which part stays visible when cropped.
const photos = [
  { caption: 'Public Session',               src: base + 'v1784561463/climb-crux/hal92xgrqp8z5pmq6a5x.jpg' },
  { caption: 'Safety Equipment Introduction', src: base + 'v1784561382/climb-crux/gawzpjanoybklrmidxxz.jpg' },
  { caption: 'Lead Climbing',                 src: base + 'v1784561390/climb-crux/qqepgmwh7jmkkhnfhf7x.jpg' },
  { caption: 'Little Champion',               src: base + 'v1784561412/climb-crux/b0zhxpfbodgn0z7gdwrb.jpg' },
  { caption: 'First Ever Descent',            src: base + 'v1784561335/climb-crux/p9avxfn7yfnvvr7cdjli.jpg' },
  { caption: 'Climbers of Every Age',         src: base + 'v1784561363/climb-crux/k4qzrgghuthwv0vrppqt.jpg' },
  { caption: 'High Grade Lead Climbing',      src: base + 'v1784738743/climb-crux/bg6amoi7i6lkddlmnuuv.jpg' },
];

export default function LifeOnTheRock() {
  return (
    <section className="lr">
      <div className="wrap">
        <h2>Life on the rock</h2>

        <div className="lr-grid">
          {photos.map((p, i) => (
            <figure className="lr-item" key={p.src}>
              <img
                src={opt(p.src, i === 0 ? 1200 : 700)}
                alt={p.caption}
                loading="lazy"
                style={{ objectPosition: p.pos || 'center' }}
              />
              <figcaption className="lr-cap">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
