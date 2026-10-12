"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { SearchSelect } from "@/components/search-select";

const types = [
  { value: "all", label: "All property types" },
  { value: "house", label: "Whole house" },
  { value: "apartment", label: "Apartment" },
  { value: "boarding_house", label: "Boarding house" },
  { value: "bedspace", label: "Bedspace / dorm" },
];

const budgets = [
  { value: "any", label: "Any price" },
  { value: "3000", label: "Up to ₱3,000" },
  { value: "5000", label: "Up to ₱5,000" },
  { value: "8000", label: "Up to ₱8,000" },
  { value: "12000", label: "Up to ₱12,000" },
  { value: "20000", label: "Up to ₱20,000" },
];

const roomOptions = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+ bedrooms" },
  { value: "2", label: "2+ bedrooms" },
  { value: "3", label: "3+ bedrooms" },
  { value: "4", label: "4+ bedrooms" },
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
          <span className="search-field-label">Where?</span>
          <span className="field-value-icon">
            <MapPin size={18} aria-hidden="true" />
            <input aria-label="City or location" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or barangay" maxLength={80} />
          </span>
        </label>
        <SearchSelect label="Property type" accessibleName="Property type" value={type} onValueChange={setType} options={types} emptyValue="any"/>
        <SearchSelect label="Monthly budget" accessibleName="Maximum monthly rent" value={budget} onValueChange={setBudget} options={budgets}/>
        <SearchSelect label="Bedrooms" accessibleName="Minimum bedrooms" value={bedrooms} onValueChange={setBedrooms} options={roomOptions}/>
      </div>
      <button type="submit" className="button button-primary search-button"><Search size={19} aria-hidden="true" /> Search rentals</button>
    </form>
  );
}
