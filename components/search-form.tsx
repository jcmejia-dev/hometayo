"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";

const types = [
  { value: "all", label: "All property types" },
  { value: "house", label: "Whole house" },
  { value: "apartment", label: "Apartment" },
  { value: "boarding_house", label: "Boarding house" },
  { value: "bedspace", label: "Bedspace / dorm" },
];

interface SearchFormProps {
  initialCity?: string;
  initialType?: string;
  initialBudget?: string;
  initialBedrooms?: string;
  compact?: boolean;
}

export function SearchForm({
  initialCity = "Koronadal City",
  initialType = "all",
  initialBudget = "",
  initialBedrooms = "",
  compact = false,
}: SearchFormProps) {
  const router = useRouter();
  const [city, setCity] = useState(initialCity);
  const [type, setType] = useState(initialType);
  const [budget, setBudget] = useState(initialBudget);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim().slice(0, 80));
    if (type !== "all") params.set("type", type);
    if (budget) params.set("maxRent", budget);
    if (bedrooms) params.set("bedrooms", bedrooms);
    router.push("/rentals?" + params.toString());
  }

  return (
    <form className={compact ? "search-panel compact" : "search-panel"} onSubmit={onSubmit} role="search">
      <div className="search-heading">
        <span><Search size={18} aria-hidden="true" /> Find your next place</span>
        <span className="search-heading-note"><SlidersHorizontal size={15} aria-hidden="true" /> Search your way</span>
      </div>
      <div className="field-grid">
        <label className="search-field location-field">
          <span>Where?</span>
          <span className="field-value-icon">
            <MapPin size={18} aria-hidden="true" />
            <input aria-label="City or location" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or barangay" maxLength={80} />
          </span>
        </label>
        <label className="search-field">
          <span>Property type</span>
          <select aria-label="Property type" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="search-field">
          <span>Monthly budget</span>
          <select aria-label="Maximum monthly rent" value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">Any price</option>
            <option value="3000">Up to ₱3,000</option>
            <option value="5000">Up to ₱5,000</option>
            <option value="8000">Up to ₱8,000</option>
            <option value="12000">Up to ₱12,000</option>
            <option value="20000">Up to ₱20,000</option>
          </select>
        </label>
        <label className="search-field">
          <span>Bedrooms</span>
          <select aria-label="Minimum bedrooms" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
            <option value="">Any</option>
            <option value="1">1+ bedrooms</option>
            <option value="2">2+ bedrooms</option>
            <option value="3">3+ bedrooms</option>
            <option value="4">4+ bedrooms</option>
          </select>
        </label>
      </div>
      <button type="submit" className="button button-primary search-button"><Search size={19} aria-hidden="true" /> Search rentals</button>
    </form>
  );
}
