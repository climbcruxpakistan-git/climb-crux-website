import './ShopAnnouncementBar.css'

const COPIES = 6

export default function ShopAnnouncementBar() {
  return (
    <div className="sa-bar">
      <div className="sa-track" aria-hidden="true">
        {[...Array(COPIES)].map((_, i) => (
          <span className="sa-group" key={i}>
            <span className="sa-item">
              FREE SHIPPING on orders above PKR 10,000 <span className="sa-bullet">•</span>{' '}
              Shipping charges up to PKR 1,000{' '}
              <span className="sa-bullet">•</span> Shipping available nationwide
            </span>
          </span>
        ))}
      </div>
      <span className="sa-sr">FREE SHIPPING on orders above PKR 10,000 • Shipping charges up to PKR 1,000 • Shipping available nationwide</span>
    </div>
  )
}