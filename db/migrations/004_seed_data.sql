-- ============================================================
-- PT Orchestration POC - Seed Data (all fake, Miami-flavored)
-- Deterministic UUIDs for reproducibility
-- ============================================================

-- ---------- AUTH SEED (mock identities) ----------
insert into neon_auth.users_sync (id, name, email, created_at) values
('nau_phil_001','Phil Chaunu','phil@cyvine.example', now()),
('nau_mfern_01','Maria Fernandez','mfernandez@gablesortho.example', now()),
('nau_coord_01','Vanessa Ortiz','vortiz@gablesortho.example', now()),
('nau_lbet_001','Luis Betancourt','lbetancourt@doralspine.example', now()),
('nau_joka_001','James Okafor','jokafor@gablesortho.example', now()),
('nau_rchen_01','Rachel Chen','rchen@brickellsports.example', now()),
('nau_dpat_001','David Patterson','dpatterson@brickellsports.example', now());

-- ---------- PAYERS ----------
insert into payers (id, name, payer_id_code, type) values
('a0000000-0000-0000-0000-000000000001','Florida Blue','FLBLUE','commercial'),
('a0000000-0000-0000-0000-000000000002','Aetna','60054','commercial'),
('a0000000-0000-0000-0000-000000000003','UnitedHealthcare Medicare Advantage','87726','medicare_advantage'),
('a0000000-0000-0000-0000-000000000004','Simply Healthcare (FL Medicaid)','SIMPLY','medicaid'),
('a0000000-0000-0000-0000-000000000005','Original Medicare','CMS','medicare');

-- ---------- PRACTICES & PROVIDERS (3 practices, 5 doctors) ----------
insert into practices (id, name, npi_org, phone, fax, address_line1, city, state, zip) values
('b0000000-0000-0000-0000-000000000001','Gables Orthopedic Group','1234567001','305-555-0100','305-555-0101','2601 SW 37th Ave','Coral Gables','FL','33133'),
('b0000000-0000-0000-0000-000000000002','Doral Spine & Rehab Physicians','1234567002','305-555-0200','305-555-0201','8400 NW 36th St','Doral','FL','33166'),
('b0000000-0000-0000-0000-000000000003','Brickell Sports Medicine','1234567003','305-555-0300','305-555-0301','1001 Brickell Bay Dr','Miami','FL','33131');

insert into providers (id, practice_id, first_name, last_name, npi, specialty, email, phone) values
('d0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Maria','Fernandez','1112223001','orthopedic_surgery','mfernandez@gablesortho.example','305-555-0102'),
('d0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','James','Okafor','1112223002','sports_medicine','jokafor@gablesortho.example','305-555-0103'),
('d0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002','Luis','Betancourt','1112223003','physiatry','lbetancourt@doralspine.example','305-555-0202'),
('d0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000003','Rachel','Chen','1112223004','sports_medicine','rchen@brickellsports.example','305-555-0302'),
('d0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000003','David','Patterson','1112223005','orthopedic_surgery','dpatterson@brickellsports.example','305-555-0303');

-- ---------- APP USERS (all 5 doctors + admin + coordinator) ----------
insert into app_users (auth_user_id, role, practice_id, provider_id) values
('nau_phil_001','platform_admin', null, null),
('nau_mfern_01','provider',
 'b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001'),
('nau_joka_001','provider',
 'b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002'),
('nau_coord_01','coordinator',
 'b0000000-0000-0000-0000-000000000001', null),
('nau_lbet_001','provider',
 'b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003'),
('nau_rchen_01','provider',
 'b0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000004'),
('nau_dpat_001','provider',
 'b0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000005');

-- ---------- SERVICE TYPES ----------
insert into service_types (id, code, name, description) values
('e0000000-0000-0000-0000-000000000001','PT_ORTHO','Orthopedic Physical Therapy','Post-surgical and musculoskeletal rehab'),
('e0000000-0000-0000-0000-000000000002','PT_NEURO','Neurological Physical Therapy','Stroke, Parkinsons, balance and gait'),
('e0000000-0000-0000-0000-000000000003','PT_AQUATIC','Aquatic Therapy','Pool-based low-impact therapy'),
('e0000000-0000-0000-0000-000000000004','OT','Occupational Therapy','ADL and upper-extremity function'),
('e0000000-0000-0000-0000-000000000005','PT_HOME','Home-Visit Physical Therapy','PT delivered at patient residence');

-- ---------- PATIENTS ----------
insert into patients (id, first_name, last_name, dob, phone, phone_verified, preferred_channel,
                      preferred_language, address_line1, city, state, zip, geom, home_visit_ok, mobility_notes) values
('c0000000-0000-0000-0000-000000000001','Rosa','Delgado','1958-03-14','305-555-1001',true,'voice','es',
 '1421 SW 8th St','Miami','FL','33135', ST_SetSRID(ST_MakePoint(-80.2170,25.7654),4326)::geography,
 false,'Prefers mornings, daughter drives her'),
('c0000000-0000-0000-0000-000000000002','Kevin','Charles','1979-11-02','786-555-1002',true,'sms','ht',
 '540 NE 125th St','North Miami','FL','33161', ST_SetSRID(ST_MakePoint(-80.1834,25.8901),4326)::geography,
 false,null),
('c0000000-0000-0000-0000-000000000003','Amanda','Ruiz','1991-06-25','305-555-1003',true,'sms','en',
 '9200 SW 137th Ave','Miami','FL','33186', ST_SetSRID(ST_MakePoint(-80.4162,25.6851),4326)::geography,
 false,'Works 9-6, needs evening or Saturday slots'),
('c0000000-0000-0000-0000-000000000004','Harold','Weiss','1946-01-30','305-555-1004',true,'voice','en',
 '19501 W Country Club Dr','Aventura','FL','33180', ST_SetSRID(ST_MakePoint(-80.1345,25.9565),4326)::geography,
 true,'Post-hip replacement, no longer drives, home visits preferred'),
('c0000000-0000-0000-0000-000000000005','Yusniel','Perez','1985-09-12','786-555-1005',false,'sms','es',
 '760 W 49th St','Hialeah','FL','33012', ST_SetSRID(ST_MakePoint(-80.3045,25.8672),4326)::geography,
 false,null),
('c0000000-0000-0000-0000-000000000006','Danielle','Thompson','2001-04-08','954-555-1006',true,'sms','en',
 '1200 Brickell Bay Dr','Miami','FL','33131', ST_SetSRID(ST_MakePoint(-80.1898,25.7601),4326)::geography,
 false,'ACL reconstruction, college athlete');

-- ---------- COVERAGE ----------
insert into patient_coverage (patient_id, payer_id, member_id, plan_name, eligibility_status,
                              pt_visit_limit, pt_visits_used, copay_cents, requires_auth, eligibility_checked_at, is_primary) values
('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','UHC44821','AARP Medicare Advantage Choice','active',40,6,2000,true, now() - interval '2 days', true),
('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','FB99012','BlueOptions 05901','active',35,0,4000,false, now() - interval '1 day', true),
('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002','AET55310','Aetna Open Access HMO','active',30,0,3500,false, now() - interval '3 days', true),
('c0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','MED11003','Original Medicare Part B','active',null,12,0,false, now() - interval '5 days', true),
('c0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000004','SMP70244','Simply Medicaid MMA','unverified',null,null,0,true, null, true),
('c0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','FB33471','BlueCare HMO 121','active',30,4,2500,false, now() - interval '1 day', true);

-- ---------- PT CENTERS ----------
insert into pt_centers (id, name, phone, email, address_line1, city, state, zip, geom,
                        offers_home_visits, home_visit_radius_km, scheduling_mode, ehr_system, onboarded, rating) values
('f0000000-0000-0000-0000-000000000001','CORA Physical Therapy Coral Gables','305-555-2001','gables@corapt.example','3850 Bird Rd','Miami','FL','33146',
 ST_SetSRID(ST_MakePoint(-80.2551,25.7345),4326)::geography,false,null,'phone','WebPT',true,4.7),
('f0000000-0000-0000-0000-000000000002','Kendall Rehab & Sports Medicine','305-555-2002','frontdesk@kendallrehab.example','12000 SW 88th St','Miami','FL','33186',
 ST_SetSRID(ST_MakePoint(-80.3900,25.6866),4326)::geography,false,null,'phone','Prompt',true,4.5),
('f0000000-0000-0000-0000-000000000003','Hialeah Therapy Center','305-555-2003','info@hialeahtherapy.example','1190 W 49th St','Hialeah','FL','33012',
 ST_SetSRID(ST_MakePoint(-80.3122,25.8669),4326)::geography,false,null,'phone','Clinicient',true,4.2),
('f0000000-0000-0000-0000-000000000004','Aventura Aquatic & Physical Therapy','305-555-2004','care@aventurapt.example','2920 NE 207th St','Aventura','FL','33180',
 ST_SetSRID(ST_MakePoint(-80.1420,25.9682),4326)::geography,false,null,'portal','WebPT',true,4.8),
('f0000000-0000-0000-0000-000000000005','Brickell Performance PT','305-555-2005','hello@brickellpt.example','1001 S Miami Ave','Miami','FL','33130',
 ST_SetSRID(ST_MakePoint(-80.1936,25.7645),4326)::geography,false,null,'api','Prompt',true,4.9),
('f0000000-0000-0000-0000-000000000006','MiamiMobile PT (Home Visits)','786-555-2006','dispatch@miamimobilept.example','7900 NW 27th Ave','Miami','FL','33147',
 ST_SetSRID(ST_MakePoint(-80.2410,25.8467),4326)::geography,true,40,'phone',null,true,4.6),
('f0000000-0000-0000-0000-000000000007','North Miami Physical Therapy','305-555-2007','office@northmiamipt.example','12550 Biscayne Blvd','North Miami','FL','33181',
 ST_SetSRID(ST_MakePoint(-80.1560,25.8890),4326)::geography,false,null,'phone','WebPT',false,4.0),
('f0000000-0000-0000-0000-000000000008','Doral Rehab Institute','305-555-2008','contact@doralrehab.example','3650 NW 82nd Ave','Doral','FL','33166',
 ST_SetSRID(ST_MakePoint(-80.3320,25.8080),4326)::geography,false,null,'email','Clinicient',false,4.3);

-- ---------- PENDING INVITE (after centers exist) ----------
insert into user_invites (email, role, center_id) values
('frontdesk@kendallrehab.example','center_staff',
 'f0000000-0000-0000-0000-000000000002');

-- ---------- CENTER SERVICES ----------
insert into center_services (center_id, service_type_id) values
('f0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000002'),
('f0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000003'),
('f0000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000005'),
('f0000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000007','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000008','e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000008','e0000000-0000-0000-0000-000000000002');

-- ---------- NETWORK PARTICIPATION ----------
insert into center_network_participation (center_id, payer_id, in_network, verified_via, verified_at) values
('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',true,'phone_call', now() - interval '10 days'),
('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',true,'phone_call', now() - interval '10 days'),
('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003',true,'payer_directory', now() - interval '90 days'),
('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000005',true,'claim_history', now() - interval '30 days'),
('f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',true,'phone_call', now() - interval '5 days'),
('f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002',true,'phone_call', now() - interval '5 days'),
('f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004',false,'phone_call', now() - interval '5 days'),
('f0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004',true,'phone_call', now() - interval '7 days'),
('f0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003',true,'center_reported', now() - interval '60 days'),
('f0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005',true,'claim_history', now() - interval '20 days'),
('f0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003',true,'phone_call', now() - interval '3 days'),
('f0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005',true,'phone_call', now() - interval '3 days'),
('f0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001',true,'payer_directory', now() - interval '120 days'),
('f0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001',true,'api', now() - interval '1 day'),
('f0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000002',true,'api', now() - interval '1 day'),
('f0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000005',false,'center_reported', now() - interval '30 days'),
('f0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000005',true,'phone_call', now() - interval '4 days'),
('f0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000003',true,'phone_call', now() - interval '4 days'),
('f0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001',true,'payer_directory', now() - interval '200 days'),
('f0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000002',true,'center_reported', now() - interval '45 days'),
('f0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001',true,'payer_directory', now() - interval '150 days');

-- ---------- AVAILABILITY (next 7 days, generated) ----------
insert into center_availability (center_id, slot_start, slot_end, capacity, booked, source)
select c.id,
       d + t,
       d + t + interval '45 minutes',
       2,
       0,
       'phone_call'
from pt_centers c
cross join generate_series(date_trunc('day', now()) + interval '1 day',
                           date_trunc('day', now()) + interval '7 days',
                           interval '1 day') d
cross join unnest(array[interval '8 hours', interval '10 hours', interval '14 hours', interval '16 hours']) t
where extract(dow from d) between 1 and 6;

-- ---------- ORDERS ----------
insert into orders (id, provider_id, practice_id, patient_id, service_type_id, diagnosis_codes, cpt_codes,
                    frequency_per_week, duration_weeks, total_visits_ordered, reeval_interval_days,
                    home_visits_allowed, urgency, clinical_notes, status, received_via, created_at, expires_at) values
('90000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001','{M17.11}','{97110,97140}',
 3,6,18,14,false,'routine','R knee OA, pre-TKA strengthening','in_progress','web_form', now() - interval '3 weeks', now() + interval '60 days'),
('90000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002',
 'c0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001','{M54.50}','{97110,97112}',
 2,8,16,28,false,'routine','Chronic LBP, no red flags','scheduled','fax', now() - interval '4 days', now() + interval '80 days'),
('90000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001','{M75.101}','{97110}',
 3,4,12,14,false,'routine','Rotator cuff tendinopathy','matching','web_form', now() - interval '2 days', now() + interval '85 days'),
('90000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000005','{Z96.641,Z47.1}','{97110,97116}',
 3,4,12,14,true,'post_op','THA POD 10, home-bound, fall risk','in_progress','web_form', now() - interval '10 days', now() + interval '50 days'),
('90000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002',
 'c0000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000001','{S93.401A}','{97110}',
 2,4,8,28,false,'routine','Ankle sprain grade II','contacting_patient','fax', now() - interval '1 day', now() + interval '89 days'),
('90000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000001','{Z98.890,S83.512D}','{97110,97116,97530}',
 3,12,36,14,false,'post_op','ACL-R week 6, criterion-based progression','in_progress','web_form', now() - interval '5 weeks', now() + interval '120 days');

-- ---------- PATIENT AVAILABILITY ----------
insert into patient_availability (patient_id, order_id, day_of_week, window_start, window_end) values
('c0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',1,'08:00','12:00'),
('c0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',3,'08:00','12:00'),
('c0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',5,'08:00','12:00'),
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003',2,'18:00','20:00'),
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003',4,'18:00','20:00'),
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003',6,'09:00','13:00'),
('c0000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000004',1,'09:00','17:00'),
('c0000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000004',2,'09:00','17:00'),
('c0000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000004',4,'09:00','17:00'),
('c0000000-0000-0000-0000-000000000006','90000000-0000-0000-0000-000000000006',1,'07:00','09:00'),
('c0000000-0000-0000-0000-000000000006','90000000-0000-0000-0000-000000000006',3,'07:00','09:00'),
('c0000000-0000-0000-0000-000000000006','90000000-0000-0000-0000-000000000006',5,'07:00','09:00');

-- ---------- APPOINTMENTS ----------
-- Rosa: 9 visits so far, all completed (adherent)
insert into appointments (order_id, patient_id, center_id, scheduled_start, scheduled_end, visit_number, status, status_source)
select '90000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001',
       now() - interval '3 weeks' + (n || ' days')::interval + interval '9 hours',
       now() - interval '3 weeks' + (n || ' days')::interval + interval '9 hours 45 minutes',
       row_number() over (order by n),
       'completed','center_reported'
from unnest(array[0,2,4,7,9,11,14,16,18]) n;

-- Danielle: 15 visits expected by week 5, only 9 completed, last 3 no-shows
insert into appointments (order_id, patient_id, center_id, scheduled_start, scheduled_end, visit_number, status, status_source)
select '90000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000006','f0000000-0000-0000-0000-000000000005',
       now() - interval '5 weeks' + (n || ' days')::interval + interval '7 hours',
       now() - interval '5 weeks' + (n || ' days')::interval + interval '7 hours 45 minutes',
       row_number() over (order by n),
       case when n >= 28 then 'no_show' else 'completed' end,
       'center_reported'
from unnest(array[0,2,4,7,9,11,14,16,18,28,30,32]) n;

-- Kevin: first two visits booked, upcoming
insert into appointments (order_id, patient_id, center_id, scheduled_start, scheduled_end, visit_number, status, status_source) values
('90000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000007',
 date_trunc('day', now()) + interval '2 days 10 hours', date_trunc('day', now()) + interval '2 days 10 hours 45 minutes',1,'confirmed','patient_reported'),
('90000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000007',
 date_trunc('day', now()) + interval '5 days 10 hours', date_trunc('day', now()) + interval '5 days 10 hours 45 minutes',2,'scheduled','staff'),
-- Harold: home visits, 4 completed, next one scheduled
('90000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000006',
 now() - interval '8 days' + interval '10 hours', null, 1,'completed','center_reported'),
('90000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000006',
 now() - interval '6 days' + interval '10 hours', null, 2,'completed','center_reported'),
('90000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000006',
 now() - interval '3 days' + interval '10 hours', null, 3,'completed','center_reported'),
('90000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000006',
 now() - interval '1 day' + interval '10 hours', null, 4,'completed','center_reported'),
('90000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000006',
 date_trunc('day', now()) + interval '1 day 10 hours', null, 5,'scheduled','staff');

-- fix is_home_visit for Harold
update appointments set is_home_visit = true where order_id = '90000000-0000-0000-0000-000000000004';

-- ---------- MATCH CANDIDATES (Amanda's open order) ----------
insert into match_candidates (order_id, center_id, distance_km, drive_minutes, in_network, score, status) values
('90000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000002',3.1,9,true,0.92,'proposed'),
('90000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000001',17.4,26,true,0.61,'proposed'),
('90000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000005',24.0,35,true,0.48,'proposed');

-- ---------- OUTREACH MESSAGES ----------
insert into outreach_messages (patient_id, order_id, channel, direction, purpose, body, ai_extraction, provider_ref, sent_at, responded) values
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003','sms','outbound','intake_address',
 'Hi Amanda, this is the care coordinator for Dr. Okafor at Gables Orthopedic. He referred you for physical therapy for your shoulder. Reply with your home address so we can find in-network clinics near you.',null,'SM_fake_001', now() - interval '2 days', true),
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003','sms','inbound','intake_address',
 '9200 SW 137th Ave, Miami 33186','{"address_line1":"9200 SW 137th Ave","city":"Miami","zip":"33186"}','SM_fake_002', now() - interval '2 days' + interval '18 minutes', null),
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003','sms','outbound','intake_availability',
 'Got it. What days and times work for you? Most clinics have weekday and Saturday morning slots.',null,'SM_fake_003', now() - interval '2 days' + interval '20 minutes', true),
('c0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003','sms','inbound','intake_availability',
 'I work til 6 so evenings after 6, or Saturday mornings','{"windows":[{"dow":[2,4],"start":"18:00","end":"20:00"},{"dow":[6],"start":"09:00","end":"13:00"}]}','SM_fake_004', now() - interval '2 days' + interval '31 minutes', null),
('c0000000-0000-0000-0000-000000000005','90000000-0000-0000-0000-000000000005','sms','outbound','intake_address',
 'Hola Yusniel, le contactamos de parte del Dr. Betancourt sobre su terapia fisica para el tobillo. Responda con su direccion para encontrar clinicas cerca de usted.',null,'SM_fake_005', now() - interval '1 day', false),
('c0000000-0000-0000-0000-000000000005','90000000-0000-0000-0000-000000000005','voice','outbound','intake_address',
 'Voicemail left in Spanish, callback number provided','{"outcome":"voicemail"}','EL_fake_001', now() - interval '4 hours', false),
('c0000000-0000-0000-0000-000000000006','90000000-0000-0000-0000-000000000006','sms','outbound','missed_visit_recovery',
 'Hi Danielle, we noticed you missed your last few PT sessions at Brickell Performance. Your ACL recovery depends on this phase. Want us to move your sessions to a different time or location?',null,'SM_fake_006', now() - interval '2 days', false),
('c0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','voice','outbound','reminder_24h',
 'Llamada recordatorio: cita manana 9am en CORA Coral Gables. Confirmo asistencia.','{"outcome":"confirmed"}','EL_fake_002', now() - interval '1 day', true);

-- ---------- ADHERENCE SNAPSHOTS ----------
insert into adherence_snapshots (order_id, as_of, visits_expected, visits_completed, visits_missed, adherence_pct, risk_level, escalated_to_provider) values
('90000000-0000-0000-0000-000000000001', current_date, 9, 9, 0, 100.0, 'on_track', false),
('90000000-0000-0000-0000-000000000004', current_date, 4, 4, 0, 100.0, 'on_track', false),
('90000000-0000-0000-0000-000000000006', current_date, 15, 9, 3, 60.0, 'fallen_off', true);

-- ---------- PROVIDER REPORTS ----------
insert into provider_reports (order_id, provider_id, report_type, body, sent_via, sent_at) values
('90000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000002','adherence_alert',
 'Danielle Thompson (ACL-R, week 6) has missed 3 consecutive sessions at Brickell Performance PT. Adherence 60% vs plan. Recovery outreach unanswered for 48h. Recommend office follow-up at next visit.','email', now() - interval '1 day'),
('90000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','progress_reeval',
 'Rosa Delgado completed 9 of 18 visits, 100% adherence. 14-day re-eval due. Center reports improved quad strength and ROM.','fax', now() - interval '2 days');
