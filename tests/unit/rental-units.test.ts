import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { CREATE_UNIT, UPDATE_UNIT, OWNED_UNITS, PUBLIC_UNITS } from "../../lib/rental-unit-sql.ts";
import { unitInput } from "../../lib/rental-unit-input.ts";

test("unit rent accepts centavos without floats and rejects invalid amounts/statuses", () => {
  assert.equal(unitInput.parse({ label: " Room 1 ", status: "available", monthlyRent: "1234.56" }).monthlyRent, 123456);
  for (const monthlyRent of ["-1", "1e5", "0", "12.345", "5000001", "Infinity", ""]) {
    assert.equal(unitInput.safeParse({ label: "Room 1", status: "available", monthlyRent }).success, false);
  }
  assert.equal(unitInput.safeParse({ label: "", status: "available", monthlyRent: "100" }).success, false);
  assert.equal(unitInput.safeParse({ label: "Room 1", status: "admin", monthlyRent: "100" }).success, false);
});

test("room changes are owner scoped; public availability excludes unpublished properties", async () => {
  const db = new PGlite();
  const first = "00000000-0000-4000-8000-000000000001", second = "00000000-0000-4000-8000-000000000002";
  try {
    for (const name of ["001_core.sql", "002_profiles_admin_activity.sql", "003_email_accounts.sql", "004_native_sessions_locations.sql", "005_rental_units.sql"])
      await db.exec(readFileSync(new URL("../../db/migrations/" + name, import.meta.url), "utf8"));
    await db.exec(`INSERT INTO users(id,email,role) VALUES('owner','owner@test.invalid','landlord'),('other','other@test.invalid','landlord'),('renter','renter@test.invalid','renter');
      INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Owner'),('other','Other'),('renter','Renter');`);
    await db.query(`INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at)
      SELECT $1::uuid,id,'test-first','First','Local test only','boarding_house','published','Test','Test',100000,now(),now() FROM owner_profiles WHERE user_id='owner'`, [first]);
    await db.query(`INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at)
      SELECT $1::uuid,id,'test-second','Second','Local test only','house','draft','Test','Test',100000,now(),now() FROM owner_profiles WHERE user_id='other'`, [second]);
    assert.equal((await db.query(CREATE_UNIT, [first, "other", "Room 1", "available", 100000])).rows.length, 0);
    assert.equal((await db.query(CREATE_UNIT, [first, "renter", "Room 1", "available", 100000])).rows.length, 0);
    const [unit] = (await db.query<{ id: string }>(CREATE_UNIT, [first, "owner", "Room 1", "available", 100000])).rows;
    await db.query(CREATE_UNIT, [first, "owner", "Room 2", "available", 120000]);
    await assert.rejects(db.query(CREATE_UNIT, [first, "owner", "room 1", "available", 100000]));
    assert.equal((await db.query(UPDATE_UNIT, [first, "other", unit.id, "Hijacked", "occupied", 100])).rows.length, 0);
    assert.equal((await db.query(UPDATE_UNIT, [second, "owner", unit.id, "Hijacked", "occupied", 100])).rows.length, 0);
    await db.query(UPDATE_UNIT, [first, "owner", unit.id, "Room 1", "occupied", 100000]);
    const rooms = (await db.query<{ status: string }>(PUBLIC_UNITS, [first])).rows;
    assert.equal(rooms.filter(room => room.status === "available").length, 1);
    assert.equal(rooms.filter(room => room.status === "occupied").length, 1);
    assert.equal((await db.query(OWNED_UNITS, [first, "other"])).rows.length, 0);
    await db.query(CREATE_UNIT, [second, "other", "Whole property", "available", 100000]);
    assert.equal((await db.query(PUBLIC_UNITS, [second])).rows.length, 0);
    const fields = Object.keys((await db.query<Record<string, unknown>>(PUBLIC_UNITS, [first])).rows[0]);
    assert.deepEqual(fields.sort(), ["id", "label", "monthlyRentCentavos", "status"].sort());
    await assert.rejects(db.query("UPDATE rental_units SET status='invalid' WHERE id=$1", [unit.id]));
  } finally { await db.close(); }
});
