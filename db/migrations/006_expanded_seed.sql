-- ============================================================
-- Expanded seed data: more patients, centers, coverage, availability
-- Run after 004_seed_data.sql
-- ============================================================

-- ---------- 14 MORE PATIENTS (20 total) ----------
insert into patients (id, first_name, last_name, dob, phone, phone_verified, preferred_channel,
                      preferred_language, address_line1, city, state, zip, geom, home_visit_ok, mobility_notes) values
('c0000000-0000-0000-0000-000000000010','Sofia','Martinez','1988-07-22','305-555-1010',true,'sms','es',
 '3501 SW 22nd St','Miami','FL','33145', ST_SetSRID(ST_MakePoint(-80.2340,25.7480),4326)::geography,
 false,'Prefers afternoons'),
('c0000000-0000-0000-0000-000000000011','Marcus','Williams','1972-03-18','786-555-1011',true,'sms','en',
 '8501 NW 7th Ave','Miami','FL','33150', ST_SetSRID(ST_MakePoint(-80.2110,25.8480),4326)::geography,
 false,'Construction worker, knee injury'),
('c0000000-0000-0000-0000-000000000012','Maria','Santos','1965-11-05','305-555-1012',true,'voice','es',
 '2750 SW 3rd Ave','Miami','FL','33129', ST_SetSRID(ST_MakePoint(-80.1980,25.7550),4326)::geography,
 true,'Uses walker, needs ground-floor access'),
('c0000000-0000-0000-0000-000000000013','James','O''Brien','1955-08-14','305-555-1013',true,'sms','en',
 '9450 SW 40th St','Miami','FL','33165', ST_SetSRID(ST_MakePoint(-80.3410,25.7280),4326)::geography,
 false,'Rotator cuff repair, 4 weeks post-op'),
('c0000000-0000-0000-0000-000000000014','Carla','Hernandez','1993-02-28','786-555-1014',true,'sms','en',
 '15600 NW 67th Ave','Miami Lakes','FL','33014', ST_SetSRID(ST_MakePoint(-80.3290,25.9120),4326)::geography,
 false,'Marathon runner, IT band syndrome'),
('c0000000-0000-0000-0000-000000000015','Jean-Baptiste','Pierre','1981-06-10','305-555-1015',true,'sms','ht',
 '1230 NE 2nd Ave','Miami','FL','33132', ST_SetSRID(ST_MakePoint(-80.1890,25.7730),4326)::geography,
 false,'Lower back pain, warehouse job'),
('c0000000-0000-0000-0000-000000000016','Patricia','Cohen','1948-12-01','305-555-1016',true,'voice','en',
 '3200 Collins Ave','Miami Beach','FL','33140', ST_SetSRID(ST_MakePoint(-80.1280,25.8050),4326)::geography,
 true,'Post-knee replacement, uses cane'),
('c0000000-0000-0000-0000-000000000017','Carlos','Vega','1990-09-15','786-555-1017',true,'sms','es',
 '7900 W Flagler St','Miami','FL','33144', ST_SetSRID(ST_MakePoint(-80.3120,25.7630),4326)::geography,
 false,'Soccer player, meniscus tear'),
('c0000000-0000-0000-0000-000000000018','Linda','Nguyen','1975-04-20','305-555-1018',true,'sms','en',
 '18901 Biscayne Blvd','Aventura','FL','33180', ST_SetSRID(ST_MakePoint(-80.1410,25.9530),4326)::geography,
 false,'Cervical radiculopathy, desk job'),
('c0000000-0000-0000-0000-000000000019','Roberto','Diaz','1960-01-25','786-555-1019',true,'voice','es',
 '5600 SW 8th St','Miami','FL','33134', ST_SetSRID(ST_MakePoint(-80.2680,25.7640),4326)::geography,
 false,'Diabetic neuropathy, needs morning slots'),
('c0000000-0000-0000-0000-000000000020','Tamika','Johnson','1987-10-08','954-555-1020',true,'sms','en',
 '2001 Salzedo St','Coral Gables','FL','33134', ST_SetSRID(ST_MakePoint(-80.2570,25.7490),4326)::geography,
 false,'Plantar fasciitis, teacher on feet all day'),
('c0000000-0000-0000-0000-000000000021','Alejandro','Fuentes','1970-05-30','305-555-1021',true,'sms','es',
 '11401 NW 12th St','Sweetwater','FL','33172', ST_SetSRID(ST_MakePoint(-80.3710,25.7640),4326)::geography,
 false,'Lumbar fusion 8 weeks ago'),
('c0000000-0000-0000-0000-000000000022','Priya','Patel','1995-03-12','786-555-1022',true,'sms','en',
 '1111 Lincoln Rd','Miami Beach','FL','33139', ST_SetSRID(ST_MakePoint(-80.1390,25.7900),4326)::geography,
 false,'Wrist fracture recovery, needs OT'),
('c0000000-0000-0000-0000-000000000023','Georges','Beaumont','1952-07-04','305-555-1023',true,'voice','ht',
 '900 NE 125th St','North Miami','FL','33161', ST_SetSRID(ST_MakePoint(-80.1780,25.8910),4326)::geography,
 true,'Stroke recovery, right-side weakness, home visits needed');

-- ---------- COVERAGE FOR NEW PATIENTS ----------
insert into patient_coverage (patient_id, payer_id, member_id, plan_name, eligibility_status,
                              pt_visit_limit, pt_visits_used, copay_cents, requires_auth, eligibility_checked_at, is_primary) values
('c0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000002','AET88201','Aetna PPO Select','active',40,0,3000,false, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001','FB22103','BlueSelect 301','active',30,0,3500,false, now() - interval '2 days', true),
('c0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000003','UHC55102','AARP Medicare Choice Plus','active',40,8,2000,true, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000001','FB44501','BlueOptions PPO','active',35,0,2500,false, now() - interval '3 days', true),
('c0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000002','AET99320','Aetna Open Choice','active',30,0,4000,false, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000004','SMP80155','Simply Gold','active',null,0,0,true, now() - interval '4 days', true),
('c0000000-0000-0000-0000-000000000016','a0000000-0000-0000-0000-000000000005','MED22016','Original Medicare Part B','active',null,20,0,false, now() - interval '2 days', true),
('c0000000-0000-0000-0000-000000000017','a0000000-0000-0000-0000-000000000001','FB55717','BlueCare HMO Plus','active',30,0,3000,false, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000018','a0000000-0000-0000-0000-000000000002','AET77218','Aetna HMO','active',25,0,4500,false, now() - interval '2 days', true),
('c0000000-0000-0000-0000-000000000019','a0000000-0000-0000-0000-000000000003','UHC33019','UHC Dual Complete','active',40,4,0,true, now() - interval '3 days', true),
('c0000000-0000-0000-0000-000000000020','a0000000-0000-0000-0000-000000000001','FB66120','BlueSelect PPO','active',35,0,2500,false, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000021','a0000000-0000-0000-0000-000000000002','AET11121','Aetna PPO','active',30,0,3500,false, now() - interval '2 days', true),
('c0000000-0000-0000-0000-000000000022','a0000000-0000-0000-0000-000000000001','FB77222','BlueOptions HMO','active',30,0,4000,false, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000023','a0000000-0000-0000-0000-000000000005','MED88023','Original Medicare Part B','active',null,15,0,false, now() - interval '5 days', true);

-- ---------- 6 MORE PT CENTERS (14 total) ----------
insert into pt_centers (id, name, phone, email, address_line1, city, state, zip, geom,
                        offers_home_visits, home_visit_radius_km, scheduling_mode, ehr_system, onboarded, rating) values
('f0000000-0000-0000-0000-000000000009','Miami Beach Physical Therapy','305-555-2009','info@miamibeachpt.example','1680 Michigan Ave','Miami Beach','FL','33139',
 ST_SetSRID(ST_MakePoint(-80.1400,25.7900),4326)::geography,false,null,'api','Prompt',true,4.6),
('f0000000-0000-0000-0000-000000000010','Palmetto Bay Rehab Center','305-555-2010','care@palmettopt.example','17601 Old Cutler Rd','Palmetto Bay','FL','33157',
 ST_SetSRID(ST_MakePoint(-80.3100,25.6310),4326)::geography,false,null,'phone','WebPT',true,4.4),
('f0000000-0000-0000-0000-000000000011','Pinecrest Sports Therapy','305-555-2011','hello@pinecrestpt.example','9700 S Dixie Hwy','Pinecrest','FL','33156',
 ST_SetSRID(ST_MakePoint(-80.2430,25.6660),4326)::geography,false,null,'portal','Clinicient',true,4.8),
('f0000000-0000-0000-0000-000000000012','Westchester PT & Wellness','305-555-2012','frontdesk@westchesterpt.example','8600 Coral Way','Miami','FL','33155',
 ST_SetSRID(ST_MakePoint(-80.3200,25.7480),4326)::geography,false,null,'phone','WebPT',true,4.3),
('f0000000-0000-0000-0000-000000000013','Little Havana Community Rehab','305-555-2013','info@lhrehab.example','1600 SW 1st St','Miami','FL','33135',
 ST_SetSRID(ST_MakePoint(-80.2180,25.7680),4326)::geography,true,15,'phone',null,true,4.1),
('f0000000-0000-0000-0000-000000000014','Sunny Isles Aquatic Therapy','305-555-2014','swim@sunnyislespt.example','17070 Collins Ave','Sunny Isles Beach','FL','33160',
 ST_SetSRID(ST_MakePoint(-80.1230,25.9380),4326)::geography,false,null,'portal','Prompt',true,4.7);

-- ---------- SERVICES FOR NEW CENTERS ----------
insert into center_services (center_id, service_type_id) values
('f0000000-0000-0000-0000-000000000009','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000009','e0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000010','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000010','e0000000-0000-0000-0000-000000000002'),
('f0000000-0000-0000-0000-000000000011','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000012','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000012','e0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000013','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000013','e0000000-0000-0000-0000-000000000005'),
('f0000000-0000-0000-0000-000000000014','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000014','e0000000-0000-0000-0000-000000000003');

-- ---------- NETWORK FOR NEW CENTERS ----------
insert into center_network_participation (center_id, payer_id, in_network, verified_via, verified_at) values
('f0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000001',true,'phone_call', now() - interval '3 days'),
('f0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000002',true,'phone_call', now() - interval '3 days'),
('f0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000001',true,'phone_call', now() - interval '5 days'),
('f0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000003',true,'payer_directory', now() - interval '30 days'),
('f0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000005',true,'claim_history', now() - interval '15 days'),
('f0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001',true,'api', now() - interval '1 day'),
('f0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000002',true,'api', now() - interval '1 day'),
('f0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000005',true,'phone_call', now() - interval '10 days'),
('f0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000001',true,'phone_call', now() - interval '7 days'),
('f0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000002',true,'center_reported', now() - interval '14 days'),
('f0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000003',true,'phone_call', now() - interval '7 days'),
('f0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000004',true,'phone_call', now() - interval '5 days'),
('f0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000005',true,'claim_history', now() - interval '10 days'),
('f0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000003',true,'phone_call', now() - interval '5 days'),
('f0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000001',true,'phone_call', now() - interval '2 days'),
('f0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000003',true,'phone_call', now() - interval '2 days'),
('f0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000005',true,'phone_call', now() - interval '2 days');

-- ---------- EXPANDED AVAILABILITY (next 14 days, more time slots) ----------
-- 6 slots per day (7am, 9am, 11am, 1pm, 3pm, 5pm) Mon-Sat for all centers
insert into center_availability (center_id, slot_start, slot_end, capacity, booked, source)
select c.id,
       d + t,
       d + t + interval '45 minutes',
       3,
       0,
       'phone_call'
from pt_centers c
cross join generate_series(date_trunc('day', now()) + interval '1 day',
                           date_trunc('day', now()) + interval '14 days',
                           interval '1 day') d
cross join unnest(array[
  interval '7 hours', interval '9 hours', interval '11 hours',
  interval '13 hours', interval '15 hours', interval '17 hours'
]) t
where extract(dow from d) between 1 and 6
  and not exists (
    select 1 from center_availability ca
    where ca.center_id = c.id and ca.slot_start = d + t
  );

-- Add Saturday morning slots (8am, 9am, 10am, 11am) for centers that are open
insert into center_availability (center_id, slot_start, slot_end, capacity, booked, source)
select c.id,
       d + t,
       d + t + interval '45 minutes',
       2,
       0,
       'manual'
from pt_centers c
cross join generate_series(date_trunc('day', now()) + interval '1 day',
                           date_trunc('day', now()) + interval '14 days',
                           interval '1 day') d
cross join unnest(array[
  interval '8 hours', interval '9 hours', interval '10 hours', interval '11 hours'
]) t
where extract(dow from d) = 6
  and c.onboarded
  and not exists (
    select 1 from center_availability ca
    where ca.center_id = c.id and ca.slot_start = d + t
  );
