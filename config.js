/* ============================================================================
   LIVE MUSIC & COMEDY HUB · a vertical of the AE Hub Core. A white-label box
   office for concert & comedy venues. Shows off THREE venue modes via config.venues:
   a reserved hall (seat map), a general-admission floor (capacity meter), and a
   comedy-club cabaret (tables). Events reference a venue per show.
   Accelerated Experiences, LLC.
   ============================================================================ */
window.HUB_CONFIG = {
  tenant: "amphitheater",
  seedVersion: "2026-07-25-amphitheater-v1",

  brand: {
    name:    "Amphitheater OS",
    short:   "Amphitheater",
    version: "V1.1",
    tagline: "Concerts & comedy · reserved, GA, or cabaret — sold in one place",
    logo:    "https://aexperiences.com/Amphitheater_OS.png",
    credit:  "Powered by Accelerated Experiences, LLC"
  },

  // Nightlife: hot magenta + neon cyan.
  skin: {
    paper:"#f6f3f6", card:"#ffffff", cream:"#f1e7ee",
    ink:"#241b22", ink2:"#4c3b45", mut:"#8a7a84",
    line:"#e7d9e2", line2:"#f2eaf0",
    accent:"#c02f7a", accent2:"#a52868", accent3:"#7f1e50",
    onAccent:"#fdf4f9", gold:"#2bb6c4"
  },

  departments: [
    { name:"",              keys:["home"] },
    { name:"Front of House", keys:["boxoffice","events"], accent:"#c02f7a" },
    { name:"Production",     keys:["tracker","studio"],   accent:"#b0812f" },
    { name:"Fans",           keys:["patrons"],            accent:"#2b8fc4" },
    { name:"System",         keys:["admin"] }
  ],

  sections: [
    { k:"home",      label:"Command Center", ic:"🏠", href:"/hub.html" },
    { k:"boxoffice", label:"Box Office",     ic:"📑", href:"/boxoffice.html" },
    { k:"events",    label:"Lineup",         ic:"🎤", href:"/productions.html" },
    { k:"tracker",   label:"Advance Tracker", ic:"💰", href:"/tracker.html" },
    { k:"studio",    label:"Show Studio",    ic:"🎨", href:"/studio.html" },
    { k:"patrons",   label:"Fans",           ic:"👥", href:"/patrons.html" },
    { k:"admin",     label:"Admin",          ic:"🛠️", href:"/admin.html" }
  ],

  roles: {
    admin:     "*",
    manager:   "*",
    boxoffice: ["home","boxoffice","events","patrons","tracker","studio"],
    foh:       ["home","boxoffice","events","tracker"],
    guest:     ["home","boxoffice","events","patrons","tracker","studio"]
  },
  rolePretty: { admin:"Admin", manager:"Talent Buyer", boxoffice:"Box Office", foh:"Door", guest:"Demo" },

  collections: ["events","patrons","sales","holds","tracker"],
  spineCollection: "events",

  tracker: {
    label:"Advance Tracker", ic:"💰", noun:"item",
    subjectLabel:"Item", partyLabel:"Ball in court", projectLabel:"Event",
    types:["Rider","Backline","Hospitality","Settlement Docs","Production / Tech","Marketing"],
    statuses:["Open","In Progress","Confirmed","Closed"],
    parties:["Artist / Agent","Promoter","Production","Venue Ops","Vendor"]
  },
  studio: { label:"Show Studio", subhead:"Stage plots and settlement scenarios — the advance, in pictures.", details:["stage-plot","settlement"] },
  boxOffice: { eventNoun:"Event", eventCollection:"events", holdMinutes:10 },
  defaultVenue: "hall",

  assistant: {
    name:  "Vinny",
    role:  "Booking & marketing",
    blurb: "Ask me for an on-sale announcement, an event blurb, a comedian intro, or a social post.",
    persona: "You are Vinny, the booking & marketing assistant for {BRAND}, a live music & comedy venue. " +
             "You write on-sale announcements, event and artist blurbs, comedian intros, curtain/stage-time notes, and social posts. " +
             "Ground everything in the real event, showtime, venue, and pricing data you are given; NEVER invent facts — artist names, dates, set times, prices, capacities — say 'verify' if unsure. Energetic, nightlife voice; keep comedy content venue-appropriate."
  },

  /* ===== VENUES — three modes. Swap/add to fit the room. ===== */
  venues: {
    hall: { name:"Grandview Hall (reserved)", mode:"reserved",
      tiers:{ front:{ name:"Front", price:65, color:"#2bb6c4" }, floor:{ name:"Floor", price:45, color:"#c02f7a" }, balcony:{ name:"Balcony", price:32, color:"#8a5cc4" } },
      sections:[
        { id:"FloorC", name:"Floor", level:"orch", rows:[
          { row:"A", seats:14, tier:"front" }, { row:"B", seats:14, tier:"front" }, { row:"C", seats:14, tier:"front" }, { row:"D", seats:14, tier:"front" },
          { row:"E", seats:16, tier:"floor" }, { row:"F", seats:16, tier:"floor" }, { row:"G", seats:16, tier:"floor" }, { row:"H", seats:16, tier:"floor" },
          { row:"I", seats:14, tier:"floor" }, { row:"J", seats:14, tier:"floor" }, { row:"K", seats:14, tier:"floor" } ] },
        { id:"balc", name:"Balcony", level:"balc", rows:[
          { row:"AA", seats:14, tier:"balcony" }, { row:"BB", seats:14, tier:"balcony" }, { row:"CC", seats:12, tier:"balcony" } ] }
      ],
      accessible:["FloorC-K-1","FloorC-K-14"], removed:[] },
    floor: { name:"The Warehouse (GA standing)", mode:"ga", capacity:450,
      tiers:{ ga:{ name:"General Admission", price:35, color:"#c02f7a" } } },
    club: { name:"The Basement (comedy · cabaret)", mode:"reserved",
      tiers:{ table:{ name:"Table seat", price:28, color:"#d99a2b" } },
      sections:[ { id:"tbl", name:"Tables", level:"orch", rows:[
        { row:"T1", seats:4, tier:"table" }, { row:"T2", seats:4, tier:"table" }, { row:"T3", seats:4, tier:"table" }, { row:"T4", seats:4, tier:"table" }, { row:"T5", seats:4, tier:"table" },
        { row:"T6", seats:4, tier:"table" }, { row:"T7", seats:4, tier:"table" }, { row:"T8", seats:4, tier:"table" }, { row:"T9", seats:4, tier:"table" }, { row:"T10", seats:4, tier:"table" } ] } ],
      accessible:["tbl-T1-1","tbl-T1-4"], removed:[] }
  },

  seed: {
    tracker: [
      { id:"t1", subject:"Tech rider — monitor mixes (asked 6, house has 4)", project:"The Midnight Echoes", type:"Rider", party:"Artist / Agent", status:"Open", due:"2026-08-01", notes:"Offer wedges + IEM combo, or rent two mixes." },
      { id:"t2", subject:"Backline — bass rig rental", project:"The Midnight Echoes", type:"Backline", party:"Vendor", status:"In Progress", due:"2026-08-05", notes:"Quote in from the local shop; confirm head model with the TM." },
      { id:"t3", subject:"Hospitality — dressing room + dinner buyout", project:"The Midnight Echoes", type:"Hospitality", party:"Venue Ops", status:"Confirmed", due:"2026-08-08", notes:"Buyout agreed on the advance call." },
      { id:"t4", subject:"Settlement packet — expense receipts folder", project:"The Midnight Echoes", type:"Settlement Docs", party:"Promoter", status:"Open", due:"2026-08-08", notes:"Collect marketing invoices before doors." }
    ],
    events: [
      { id:"e1", title:"The Midnight Echoes", author:"with The Ferns", genre:"Indie rock", status:"On Sale", poster:"🎸", runStart:"2026-08-08", runEnd:"2026-08-08", blurb:"Reverb-soaked indie rock — reserved seating in Grandview Hall.",
        performances:[ { id:"h1a", date:"2026-08-08T20:00", label:"Fri Aug 8 · 8:00 PM · Grandview Hall", venue:"hall" } ] },
      { id:"e2", title:"Comedy Night: Dana Fields", author:"host Marcus Bell", genre:"Stand-up", status:"On Sale", poster:"🎤", runStart:"2026-07-25", runEnd:"2026-07-25", blurb:"Two cabaret shows — tables of four, two-item minimum.",
        performances:[ { id:"k1a", date:"2026-07-25T19:00", label:"Fri Jul 25 · 7:00 PM · The Basement", venue:"club" }, { id:"k1b", date:"2026-07-25T21:30", label:"Fri Jul 25 · 9:30 PM · The Basement", venue:"club" } ] },
      { id:"e3", title:"Summer Soul Revue", author:"9-piece band", genre:"Soul / R&B", status:"On Sale", poster:"🎶", runStart:"2026-08-15", runEnd:"2026-08-15", blurb:"A standing-room dance party at The Warehouse.",
        performances:[ { id:"g1a", date:"2026-08-15T21:00", label:"Sat Aug 15 · 9:00 PM · The Warehouse (GA)", venue:"floor" } ] },
      { id:"e4", title:"Kyle Ramos: Live", author:"opener Tia Vé", genre:"Stand-up", status:"On Sale", poster:"😂", runStart:"2026-08-01", runEnd:"2026-08-01", blurb:"An hour of new material, cabaret seating.",
        performances:[ { id:"k4a", date:"2026-08-01T20:00", label:"Fri Aug 1 · 8:00 PM · The Basement", venue:"club" } ] },
      { id:"e5", title:"Aurora Skye", author:"special guest TBA", genre:"Pop", status:"Coming Soon", poster:"✨", runStart:"2026-09-12", runEnd:"2026-09-12", blurb:"On sale soon — reserved hall show.", performances:[] }
    ],
    patrons: [
      { id:"p1", name:"Jordan Blake",         type:"Member",        email:"j.blake@example.com", phone:"(208) 555-0401", notes:"Every indie show." },
      { id:"p2", name:"The Nguyens",          type:"Member",        email:"nguyens@example.com", phone:"(208) 555-0402", notes:"Comedy-club regulars." },
      { id:"p3", name:"Sam Cole",             type:"Single ticket", email:"sam.c@example.com",   phone:"(208) 555-0403", notes:"Follows the comedians." },
      { id:"p4", name:"Priya Anand",          type:"VIP",           email:"priya.a@example.com", phone:"(208) 555-0404", notes:"Front-row, always." },
      { id:"p5", name:"Lakeside Brewing Co.", type:"Group",         email:"events@lakeside.example", phone:"(208) 555-0405", notes:"Sponsor + group buys." }
    ],
    sales: [
      { id:"v1", perfId:"h1a", production:"The Midnight Echoes",       buyer:"Priya Anand",  seats:["FloorC-A-5","FloorC-A-6"], tier:"Front", tender:"Card", total:130, ts:"2026-07-12T12:00:00Z" },
      { id:"v2", perfId:"h1a", production:"The Midnight Echoes",       buyer:"Jordan Blake", seats:["FloorC-G-7","FloorC-G-8"], tier:"Floor", tender:"Card", total:90,  ts:"2026-07-13T14:30:00Z" },
      { id:"v3", perfId:"k1a", production:"Comedy Night: Dana Fields", buyer:"The Nguyens",  seats:["tbl-T2-1","tbl-T2-2"],     tier:"Table", tender:"Card", total:56,  ts:"2026-07-14T19:00:00Z" },
      { id:"v4", perfId:"k1a", production:"Comedy Night: Dana Fields", buyer:"Sam Cole",     seats:["tbl-T1-3","tbl-T1-4"],     tier:"Table", tender:"Card", total:56,  ts:"2026-07-14T20:15:00Z" },
      { id:"v5", perfId:"g1a", production:"Summer Soul Revue",         buyer:"Lakeside Brewing Co.", qty:60, tier:"General Admission", tender:"Invoice", total:2100, ts:"2026-07-10T10:00:00Z" }
    ],
    holds: []
  }
};
