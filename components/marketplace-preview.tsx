import { ArrowUpRight, BedDouble, Check, MapPin, Search, SlidersHorizontal } from "lucide-react";

/**
 * Editorial marketing preview. The example prices, properties and free-license
 * photos are illustrative only. This component does not query live inventory
 * and contains no fake links to book a property.
 */
export function MarketplacePreview() {
  return (
    <aside className="market-preview-wrap" aria-label="Illustrative HomeTayo marketplace preview">
      <div className="market-preview">
        <div className="market-preview-toolbar">
          <span className="market-preview-brand"><span className="market-preview-mark" aria-hidden="true" /> Home<span className="brand-accent">Tayo</span></span>
          <span className="market-preview-mode">INTERFACE PREVIEW</span>
        </div>
        <div className="market-preview-content">
          <div className="market-preview-heading">
            <div>
              <span className="market-preview-kicker">FIND A PLACE THAT FITS</span>
              <h2>Explore homes</h2>
            </div>
            <span className="market-preview-circle" aria-hidden="true"><SlidersHorizontal size={18} /></span>
          </div>
          <div className="market-preview-search">
            <MapPin size={16} aria-hidden="true" />
            <span>Koronadal City</span>
            <Search size={16} className="market-preview-search-icon" aria-hidden="true" />
          </div>
          <div className="market-preview-categories" aria-hidden="true">
            <span className="active">Houses</span><span>Apartments</span><span>Rooms</span>
          </div>
          <div className="market-preview-results">
            <div className="market-preview-card">
              <div className="market-preview-image market-preview-image-house" role="img" aria-label="Illustrative exterior photograph, not an available rental">
                <span className="market-photo-label">SAMPLE</span>
              </div>
              <div className="market-preview-card-body">
                <span className="market-preview-card-type">WHOLE HOUSE</span>
                <strong>Sample family home</strong>
                <p><MapPin size={12} aria-hidden="true"/> Example listing only</p>
                <span className="market-preview-separator" />
                <div className="market-preview-card-bottom">
                  <b>₱12,000<small>/mo</small></b>
                  <span><BedDouble size={14} aria-hidden="true"/> 4 beds</span>
                </div>
              </div>
            </div>
            <div className="market-preview-card">
              <div className="market-preview-image market-preview-image-room" role="img" aria-label="Illustrative bedroom photograph, not an available rental">
                <span className="market-photo-label">SAMPLE</span>
              </div>
              <div className="market-preview-card-body">
                <span className="market-preview-card-type">PRIVATE ROOM</span>
                <strong>Sample cozy room</strong>
                <p><MapPin size={12} aria-hidden="true"/> Example listing only</p>
                <span className="market-preview-separator" />
                <div className="market-preview-card-bottom">
                  <b>₱3,500<small>/mo</small></b>
                  <span className="market-preview-card-check"><Check size={13} aria-hidden="true"/> Demo</span>
                </div>
              </div>
            </div>
          </div>
          <div className="market-preview-bottom">
            <span>Made for everyday renting</span>
            <span>Preview only <ArrowUpRight size={15} aria-hidden="true"/></span>
          </div>
        </div>
      </div>
      <p className="market-preview-disclaimer">Illustrative interface, photos and prices — no sample property is available for rent.</p>
      <p className="market-preview-credits">Demo photography: <a href="https://unsplash.com/photos/a-modern-house-with-a-stylish-exterior-coqmBSuXOE4" target="_blank" rel="noopener noreferrer">Eli Chamoun</a> and <a href="https://unsplash.com/photos/a-modern-bedroom-shows-a-cozy-bed-YktL-k8ErB8" target="_blank" rel="noopener noreferrer">Caroline Badran</a> / Unsplash.</p>
    </aside>
  );
}
