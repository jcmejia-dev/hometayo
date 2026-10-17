import {test} from "node:test";
import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {buildMapQuery} from "../../lib/geo-query.ts";
import {distanceKm,isPoint} from "../../lib/geo.ts";
test("distance remains finite at the same point, antipodes, and the date line",()=>{
  assert.equal(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:0}),0);
  assert.ok(Math.abs(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:180})-20015.0868)<.01);
  assert.ok(Math.abs(distanceKm({latitude:0,longitude:179},{latitude:0,longitude:-179})-222.3898)<.01);
  assert.equal(isPoint({latitude:91,longitude:0}),false);
});
test("map query rejects incomplete coordinates and unbounded radii",()=>{
  for(const query of ["lat=0","lat=&lng=0","lat=NaN&lng=0","lat=91&lng=0","lat=0&lng=0&radiusKm=9999","radiusKm=3","offset=-1","maxRent=-1","maxRent=100.5","maxRent=5000001"])
    assert.throws(()=>buildMapQuery(new URL("https://test.local/?"+query)),/Invalid/);
});
test("PostgreSQL ranks the nearest published rental before newer distant listings, across cities",async()=>{
  const db=new PGlite();
  try {
    await db.exec(`CREATE TABLE listings(id UUID DEFAULT gen_random_uuid(),description TEXT DEFAULT '',slug TEXT,title TEXT,property_type TEXT,city TEXT,barangay TEXT,monthly_rent_centavos INT,bedrooms INT,bathrooms INT,rental_mode TEXT,last_confirmed_at TIMESTAMPTZ,latitude FLOAT8,longitude FLOAT8,published_at TIMESTAMPTZ,status TEXT);
      CREATE TABLE listing_images(listing_id UUID,storage_key TEXT,display_order INT);
      CREATE TABLE rental_units(listing_id UUID,status TEXT);
      INSERT INTO listings(slug,title,property_type,city,latitude,longitude,published_at,status) VALUES
      ('near-old','Nearest','house','Other City',0,0.001,'2020-01-01','published'),
      ('far-new','Far','house','Origin City',0,1,'2026-01-01','published'),
      ('hidden','Hidden','house','Origin City',0,0,'2026-01-02','pending_review'),
      ('no-pin','No pin','house','Origin City',NULL,NULL,'2026-01-03','published');`);
    const all=buildMapQuery(new URL("https://test.local/?lat=0&lng=0"));
    const rows=await db.query<{slug:string;distanceKm:number|null}>(all.query,all.params);
    assert.deepEqual(rows.rows.map(r=>r.slug),["near-old","far-new","no-pin"]);
    assert.ok(Math.abs(rows.rows[0].distanceKm!-.11119)<.001);
    await db.exec("UPDATE listings SET monthly_rent_centavos=CASE WHEN slug='near-old' THEN 100000 ELSE 900000 END");
    const affordable=buildMapQuery(new URL("https://test.local/?maxRent=3000"));
    assert.deepEqual((await db.query<{slug:string}>(affordable.query,affordable.params)).rows.map(r=>r.slug),["near-old"]);
    const near=buildMapQuery(new URL("https://test.local/?lat=0&lng=0&radiusKm=5"));
    assert.deepEqual((await db.query<{slug:string}>(near.query,near.params)).rows.map(r=>r.slug),["near-old"]);
    await db.exec("INSERT INTO rental_units(listing_id,status) SELECT id,'occupied' FROM listings WHERE slug='near-old'; INSERT INTO rental_units(listing_id,status) SELECT id,'available' FROM listings WHERE slug='near-old'");
    const withUnits=buildMapQuery(new URL("https://test.local/?lat=0&lng=0&radiusKm=5"),true);
    assert.deepEqual((await db.query<{unitCounts:{total:number;available:number}}>(withUnits.query,withUnits.params)).rows[0].unitCounts,{total:2,available:1});
  } finally {await db.close();}
});
