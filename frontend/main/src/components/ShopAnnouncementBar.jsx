import './ShopAnnouncementBar.css'

 const ANNOUNCEMENT = 'SHIPPING AVAILABLE NATIONWIDE FOR ALL CLIMBING EQUIPMENT'
 const COPIES = 6

 export default function ShopAnnouncementBar() {
   return (
     <div className="sa-bar">
       <div className="sa-track" aria-hidden="true">
         {[...Array(COPIES)].map((_, i) => (
           <span className="sa-group" key={i}>
             <span className="sa-item">{ANNOUNCEMENT} <span className="sa-bullet">•</span></span>
           </span>
         ))}
       </div>
       <span className="sa-sr">{ANNOUNCEMENT}</span>
     </div>
   )
 }