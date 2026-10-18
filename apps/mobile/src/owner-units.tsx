import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { FeedbackPressable as Pressable } from "./feedback-pressable";
import { usePalette } from "./theme";
import { api } from "./session";

type Unit = { id: string; label: string; status: string; monthlyRentCentavos: number };
const statuses = ["available", "reserved", "occupied", "unavailable"];
export function OwnerUnits({ listingId }: { listingId: string }) {
  const c = usePalette();
  const [units, setUnits] = useState<Unit[]>([]), [message, setMessage] = useState("");
  const [label, setLabel] = useState(""), [rent, setRent] = useState(""), [busy, setBusy] = useState(false);
  const [photos,setPhotos]=useState("");
  async function load() {
    const result = await api("/api/mobile/units?listingId=" + encodeURIComponent(listingId));
    setUnits(result.units);
  }
  useEffect(() => { let live = true; setUnits([]); setMessage("");
    api("/api/mobile/units?listingId=" + encodeURIComponent(listingId)).then(result => { if (live) setUnits(result.units); })
      .catch(e => { if (live) setMessage(e.message); });
    return () => { live = false; };
  }, [listingId]);
  async function save(unit?: Unit, status = "available") {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      await api("/api/mobile/units", { listingId, ...(unit ? { unitId: unit.id } : {}), label: unit?.label || label,
        monthlyRent: unit ? (unit.monthlyRentCentavos / 100).toFixed(2) : rent, status });
      if (!unit) { setLabel(""); setRent(""); }
      await load(); setMessage("Availability saved.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save availability."); }
    finally { setBusy(false); }
  }
  return <View style={s.panel}>
    <Text style={[s.title, { color: c.green }]}>Rooms & availability</Text>
    <Text style={{ color: c.muted }}>{units.filter(u => u.status === "available").length} of {units.length} available</Text>
    {units.map(unit => <View key={unit.id} style={[s.unit, { borderColor: c.border }]}>
      <Text style={[s.title, { color: c.green }]}>{unit.label}</Text>
      <Text style={{ color: c.muted }}>₱{(unit.monthlyRentCentavos / 100).toLocaleString()} / month · {unit.status}</Text>
      <View style={s.row}>{statuses.map(status => <Pressable key={status} accessibilityRole="radio" accessibilityState={{ checked: unit.status === status, disabled: busy }} disabled={busy} onPress={() => void save(unit, status)} style={[s.chip, { backgroundColor: unit.status === status ? c.green : c.soft }]}>
        <Text style={{ color: unit.status === status ? "white" : c.green }}>{status}</Text>
      </Pressable>)}</View>
    </View>)}
    <Text style={{ color: c.muted }}>Add a room, bed, or whole unit. Use a label, not a tenant’s name.</Text>
    <TextInput accessibilityLabel="Room label" maxLength={60} placeholder="Room 1" value={label} onChangeText={setLabel} style={[s.input, { color: c.green, borderColor: c.border }]} />
    <TextInput accessibilityLabel="Room monthly rent in pesos" placeholder="Monthly rent (₱)" keyboardType="decimal-pad" value={rent} onChangeText={setRent} style={[s.input, { color: c.green, borderColor: c.border }]} />
    <Pressable accessibilityRole="button" disabled={busy || !label.trim() || !rent.trim()} onPress={() => void save()} style={[s.chip, { backgroundColor: c.green, opacity: busy ? .5 : 1 }]}><Text style={{ color: "white" }}>{busy ? "Saving…" : "Add available unit"}</Text></Pressable>
    <Text style={[s.title,{color:c.green}]}>Rental photos</Text><Text style={{color:c.muted}}>Paste up to eight HTTPS image links, one per line, for photos you have permission to publish. Saving replaces your photo set without changing publication status.</Text>
    <TextInput accessibilityLabel="Rental photo links" multiline maxLength={16500} value={photos} onChangeText={setPhotos} style={[s.input,{color:c.green,borderColor:c.border}]}/>
    <Pressable accessibilityRole="button" disabled={busy} style={[s.chip,{backgroundColor:c.green}]} onPress={()=>{setBusy(true);api("/api/mobile/owner-photos",{listingId,urls:photos.split(/\r?\n/).map(u=>u.trim()).filter(Boolean)}).then(r=>setMessage(r.message)).catch(e=>setMessage(e.message)).finally(()=>setBusy(false));}}><Text style={{color:"white"}}>Replace photos</Text></Pressable>
    {!!message && <Text accessibilityRole="alert" style={{ color: c.muted }}>{message}</Text>}
  </View>;
}
const s = StyleSheet.create({ panel: { gap: 12, paddingTop: 16 }, title: { fontSize: 17, fontWeight: "700" }, unit: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { padding: 12, borderRadius: 12 }, input: { borderWidth: 1, borderRadius: 12, padding: 12 } });
