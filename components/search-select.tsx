"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

type Choice = { value: string; label: string };
type SearchSelectProps = {
  label: string;
  accessibleName: string;
  value: string;
  onValueChange: (next: string) => void;
  options: Choice[];
  emptyValue?: string;
};

/** Radix handles keyboard navigation, typeahead, touch, focus and ARIA.
 * "any" is a UI-only sentinel because Radix does not accept an empty item value.
 * Search URLs retain the original empty/omitted semantics.
 */
export function SearchSelect({
  label, accessibleName, value, onValueChange, options, emptyValue = "any",
}: SearchSelectProps) {
  const selected = value === "" ? emptyValue : value;
  return (
    <div className="search-field search-select-field">
      <span className="search-field-label">{label}</span>
      <Select.Root value={selected} onValueChange={(next) => onValueChange(next === emptyValue ? "" : next)}>
        <Select.Trigger className="search-select-trigger" aria-label={accessibleName}>
          <Select.Value/>
          <Select.Icon className="search-select-chevron" aria-hidden="true"><ChevronDown size={16}/></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content position="popper" align="start" sideOffset={7} collisionPadding={10} className="search-select-content">
            <Select.ScrollUpButton className="search-select-scroll"><ChevronDown className="rotate-180" size={15}/></Select.ScrollUpButton>
            <Select.Viewport className="search-select-viewport">
              {options.map((option) => (
                <Select.Item key={option.value} value={option.value} className="search-select-option">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="search-select-tick"><Check size={15}/></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="search-select-scroll"><ChevronDown size={15}/></Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
