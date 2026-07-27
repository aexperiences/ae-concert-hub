/* ============================================================================
   AMPHITHEATER OS — SHOWROOM ENGINE
   Concerts & Live-Venue OS · Powered by Accelerated Experiences LLC

   BROWSER-ONLY SHOWROOM. sessionStorage, resets on idle. No backend, no network.
   AEHub canon: Founder -> COO -> DH -> AE -> Event Bus -> Pacemaker -> Triad,
   confidence-gated release, LIVE/ESTIMATE/ASSUMPTION tags, the Fences.

   The business: a live-music venue / talent buyer. The money model is the
   ARTIST DEAL -> the night-of SETTLEMENT. Headline: the one-click Settlement
   Sheet. Rights-gate: a show cannot go ON-SALE until its contract + deposit
   are in — you don't sell tickets to a show that isn't booked.
   Grounded in: Prism.fm venue settlement guides, Ticket Fairy 2026 booking &
   settlement guide, tourmanager.info show-settlement primer (all tagged est.).
   ============================================================================ */
(function (global) {
  "use strict";

  var KEY = "amph_showroom_v1";
  var IDLE_MS = 20 * 60 * 1000;
  var STORE = sessionStorage;

  function now() { return Date.now(); }
  function read() { try { return JSON.parse(STORE.getItem(KEY)) || null; } catch (e) { return null; } }
  function write(d) { d._t = now(); try { STORE.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function fresh() {
    return { _t: now(), started: now(), tier: "grandsuite", adds: [], offs: [],
      shows: clone(SEED.shows), team: clone(SEED.team), systems: clone(SEED.systems),
      matters: clone(SEED.matters), approvals: clone(SEED.approvals), bus: [], seq: 1 };
  }
  function clone(a){ return JSON.parse(JSON.stringify(a)); }
  function db() { var d = read(); if (!d) { d = fresh(); write(d); return d; } if (now()-(d._t||0) > IDLE_MS) { d = fresh(); write(d); } return d; }
  function save(mut) { var d = db(); mut(d); write(d); return d; }
  function resetFloor() { var d = fresh(); write(d); return d; }

  /* -------------------------------------------------------------- canon */
  var DEAL_TYPES = [
    { k:"guarantee", name:"Flat Guarantee", note:"Artist gets a fixed fee regardless of the count. The venue takes all the risk — and all the upside over breakeven." },
    { k:"door", name:"Door Deal (% split)", note:"Artist gets a % of ticket revenue (often 70–85%) after the venue's basic expenses. Common for developing acts." },
    { k:"vs", name:"Guarantee vs. Overage", note:"A guarantee plus a backend split of the overage above breakeven — whichever is greater. The most common headliner deal." }
  ];
  var SEAT_TYPES = ["GA", "Reserved", "Cabaret", "Comp", "Hold"];
  var EXPENSE_LINES = ["Production (sound/lights/backline)", "Marketing & advertising", "Hospitality & rider", "Staffing & security", "Facility & insurance"];
  /* Facility fee & tax model — kept simple and shown. */
  var FACILITY_FEE = 3;   // per paid ticket
  var TICKET_TAX = 0.06;  // on gross box office

  var BENCH = {
    sellThrough:{ target:[70,95], median:78, unit:"%", src:"Independent-venue sell-through band (estimate — verify per room)" },
    perCap:{ target:[12,22], median:16, unit:"$", src:"Bar/F&B per-cap band, club venues (estimate)" },
    walkRate:{ target:[10,20], median:14, unit:"%", src:"Advance-vs-walk-up split (estimate)" }
  };
  var REPLACES = [
    { tool:"Prism.fm / booking + settlement", job:"Calendar, holds, offers, settlement", cost:"Quote-only per venue" },
    { tool:"Ticketmaster / AXS / Eventbrite", job:"Box office, on-sale, scan-in", cost:"Per-ticket fees to a third party" },
    { tool:"Master Tour / Daysheets", job:"Advance, riders, day-of-show", cost:"Per-seat/mo" },
    { tool:"A spreadsheet + a shoebox of receipts", job:"The settlement, the P&L, the per-cap", cost:"Free — and it's costing you the door" }
  ];

  /* -------------------------------------------------------------- seed
     A believable ~900-cap club. Deliberately imperfect: one show over on
     expenses, one blocked from on-sale (contract not signed), one unsettled. */
  function tier(name, price, cap, sold, comps, holds){ return { name:name, price:price, cap:cap, sold:sold, comps:comps||0, holds:holds||0 }; }
  var SEED = {
    shows: [
      { id:"s1", artist:"The Ember Coast", date:"2026-08-09", genre:"Indie rock", cap:900, status:"On sale",
        contractSigned:true, depositReceived:true, onSale:true, settled:false,
        deal:{ type:"guarantee", guarantee:9000 },
        tiers:[ tier("GA",32,700,540,24,12), tier("Reserved (balcony)",42,150,138,6,4), tier("Cabaret (front tables)",65,50,44,4,2) ],
        expenses:{ prod:3800, mkt:2000, hosp:1200, staff:2200, fac:1200 },
        note:"On sale, selling well — 82% in. Flat $9k guarantee — the venue took the risk and keeps every dollar over breakeven." },
      { id:"s2", artist:"Marlowe & the Tides", date:"2026-08-16", genre:"Folk / Americana", cap:900, status:"On sale",
        contractSigned:true, depositReceived:true, onSale:true, settled:false,
        deal:{ type:"door", artistPct:80 },
        tiers:[ tier("GA",28,700,410,30,0), tier("Reserved (balcony)",36,150,96,8,0), tier("Cabaret (front tables)",55,50,31,6,0) ],
        expenses:{ prod:2400, mkt:1600, hosp:800, staff:1500, fac:500 },
        note:"Door deal, 80% to the artist after expenses. Thin for the venue by design — the bar is where this one pays." },
      { id:"s3", artist:"Nova Sol (DJ set)", date:"2026-08-23", genre:"Electronic", cap:900, status:"Announced — not on sale",
        contractSigned:false, depositReceived:false, onSale:false, settled:false,
        deal:{ type:"guarantee", guarantee:14000 },
        tiers:[ tier("GA",38,850,0,0,40), tier("Cabaret (front tables)",70,50,0,0,10) ],
        expenses:{ prod:7000, mkt:3500, hosp:2600, staff:3800, fac:1500 },
        note:"⚠ Announced but the contract isn't signed and the deposit isn't in — the on-sale is BLOCKED until it is." },
      { id:"s4", artist:"Harbor Lights (album release)", date:"2026-07-19", genre:"Pop / soul", cap:900, status:"Settled",
        contractSigned:true, depositReceived:true, onSale:true, settled:true,
        deal:{ type:"vs", guarantee:7500, splitPct:80 },
        tiers:[ tier("GA",30,700,700,20,0), tier("Reserved (balcony)",40,150,150,10,0), tier("Cabaret (front tables)",60,50,50,8,0) ],
        expenses:{ prod:3000, mkt:1500, hosp:1400, staff:2200, fac:500 },
        note:"Sold out. Settled and paid — the settlement sheet went to the tour manager the same night." },
      { id:"s5", artist:"Comedy Night — Dave Rourke", date:"2026-08-30", genre:"Comedy", cap:600, status:"On sale",
        contractSigned:true, depositReceived:true, onSale:true, settled:false,
        deal:{ type:"guarantee", guarantee:6000 },
        tiers:[ tier("Reserved",34,500,300,20,0), tier("Cabaret (front tables)",55,100,58,10,0) ],
        expenses:{ prod:1400, mkt:1200, hosp:600, staff:700, fac:300 },
        note:"Seated comedy, flat guarantee. Steady walk-up expected." }
    ],
    team: [
      { id:"h1", name:"Dana Reyes", role:"Owner / Talent Buyer", type:"Human", status:"Active", dept:"Principal", note:"Signs the offers, cuts the settlements." },
      { id:"h2", name:"Marcus Vega", role:"Production Manager", type:"Human", status:"Active", dept:"Production", note:"Runs the advance and the day-of-show." },
      { id:"h3", name:"Priya Shah", role:"Box Office & Marketing", type:"Human", status:"Active", dept:"Box Office", note:"On-sales, holds, presales." },
      { id:"h4", name:"Roxy", role:"Chief Operating Officer", type:"AI · DeepSeek", status:"Active", dept:"Command", note:"The interface machine to the owner." },
      { id:"h5", name:"Ledger", role:"Head of Settlement & Books", type:"AI · DeepSeek", status:"Active", dept:"Settlement", note:"Owns the P&L, the deal math and the settlement sheet." },
      { id:"h6", name:"Sam Okafor", role:"House / Bar Manager", type:"Human", status:"Active", dept:"F&B", note:"Per-cap, staffing, the bar." }
    ],
    systems: [
      { id:"sy1", name:"Ticketing / box office", state:"CLEAR", metric:"scanners synced · on-sale queue healthy" },
      { id:"sy2", name:"Payments / settlement", state:"CLEAR", metric:"ACH rail up · deposits reconciled" },
      { id:"sy3", name:"Presale / member portal", state:"WATCH", metric:"traffic spike on the Ember Coast presale" },
      { id:"sy4", name:"Auth / staff logins", state:"CLEAR", metric:"no failed logins in 30 days" },
      { id:"sy5", name:"Website / event pages", state:"CLEAR", metric:"99.98% uptime · 190ms" }
    ],
    matters: [
      { id:"mt1", title:"Nova Sol — on sale announced before contract executed", state:"Open", risk:"High", ref:"Booking agreement", note:"Tickets can't go live without a signed contract and deposit. Announcing a date you can't sell is a refund-and-reputation event. Hold the on-sale." },
      { id:"mt2", title:"ASCAP / BMI / SESAC blanket licensing current?", state:"Open", risk:"Medium", ref:"PRO licensing", note:"A venue owes public-performance licenses to the PROs. Confirm the blanket licenses cover the season before the fall run." },
      { id:"mt3", title:"Liquor license capacity vs. GA count", state:"Open", risk:"Medium", ref:"ABC / occupancy", note:"GA counts plus staff can't exceed posted occupancy under the liquor license. Confirm against the fire marshal number." },
      { id:"mt4", title:"Ticket-fee disclosure (all-in pricing)", state:"Open", risk:"Medium", ref:"Consumer / FTC junk-fee rule", note:"2026 all-in pricing rules require fees shown up front. Confirm the box office displays the total before checkout." }
    ],
    approvals: [
      { id:"ap1", kind:"onsale", title:"Put Nova Sol (DJ set) on sale", by:"Priya (Box Office AE)", summary:"Marketing wants the on-sale live today. The contract is unsigned and the deposit hasn't landed.", state:"Pending", why:"The rights-gate: no on-sale until the contract + deposit are in. Blocked to a human." },
      { id:"ap2", kind:"settle", title:"Cut the settlement — The Ember Coast", by:"Ledger (Settlement AE)", summary:"Show is 82% sold with two days to go. Draft settlement ready to finalize after doors close.", state:"Pending", why:"A settlement pays an artist real money — the owner signs it, not the software." },
      { id:"ap3", kind:"pricing", title:"Offer — hold Sept 20 for Aurora Fields", by:"Dana (Talent Buyer)", summary:"Send a $12,000 guarantee offer to hold the date.", state:"Pending", why:"An offer is a financial commitment to an agent — the owner's call." }
    ]
  };

  /* -------------------------------------------------------------- money spine */
  function soldTickets(sh){ return (sh.tiers||[]).reduce(function(s,t){ return s+(Number(t.sold)||0); },0); }
  function capTickets(sh){ return (sh.tiers||[]).reduce(function(s,t){ return s+(Number(t.cap)||0); },0); }
  function grossBoxOffice(sh){ return (sh.tiers||[]).reduce(function(s,t){ return s+(Number(t.sold)||0)*(Number(t.price)||0); },0); }
  function sellThrough(sh){ var c=capTickets(sh); return c ? soldTickets(sh)/c*100 : 0; }
  function ticketTax(sh){ return Math.round(grossBoxOffice(sh)*TICKET_TAX); }
  function facilityFees(sh){ return soldTickets(sh)*FACILITY_FEE; }
  function showExpenses(sh){ var e=sh.expenses||{}; return (e.prod||0)+(e.mkt||0)+(e.hosp||0)+(e.staff||0)+(e.fac||0); }
  function netToSplit(sh){ return grossBoxOffice(sh) - ticketTax(sh) - facilityFees(sh) - showExpenses(sh); }
  function artistCut(sh){
    var d=sh.deal||{}, gross=grossBoxOffice(sh), net=netToSplit(sh);
    if (d.type==="guarantee") return d.guarantee||0;
    if (d.type==="door") return Math.max(0, Math.round(net * (Number(d.artistPct)||0)/100));
    /* vs: guarantee, plus split of overage above the point where the venue recoups guarantee+expenses */
    var overage = Math.max(0, net - (d.guarantee||0));
    return (d.guarantee||0) + Math.round(overage * (Number(d.splitPct)||0)/100);
  }
  function venueNet(sh){ return grossBoxOffice(sh) - ticketTax(sh) - facilityFees(sh) - showExpenses(sh) - artistCut(sh); }
  function canGoOnSale(sh){ return !!(sh.contractSigned && sh.depositReceived); }
  function blockedOnSale(d){ d=d||db(); return d.shows.filter(function(s){ return !s.onSale && !canGoOnSale(s); }); }
  function unsettled(d){ d=d||db(); return d.shows.filter(function(s){ return !s.settled && s.onSale; }); }
  function totalVenueNet(d){ d=d||db(); return d.shows.filter(function(sh){ return sh.onSale; }).reduce(function(s,sh){ return s+venueNet(sh); },0); }
  function avgSellThrough(d){ d=d||db(); var on=d.shows.filter(function(s){return s.onSale;}); if(!on.length) return 0; return on.reduce(function(s,sh){return s+sellThrough(sh);},0)/on.length; }
  function settleShow(id){ return save(function(d){ d.shows.forEach(function(s){ if(s.id===id) s.settled=true; }); }); }

  /* -------------------------------------------------------------- price book */
  var ROOMS = {
    calendar:   { label:"Shows & Calendar", mo:75, build:550, why:"The lineup — holds vs confirmed, load-in / soundcheck / doors / set times, the day-of-show board." },
    boxoffice:  { label:"Box Office & Ticketing", mo:95, build:800, why:"GA / reserved / cabaret, holds & comps, on-sale, scan-in, the live manifest and sell-through." },
    deals:      { label:"Artists & Deals", mo:85, build:650, why:"The offer and the deal memo — guarantee, door, or vs. Contract + deposit gate the on-sale." },
    settlement: { label:"Settlement", mo:110, build:900, why:"One click turns the box office + expenses + the deal into the artist settlement sheet. The whole reason to switch." },
    advance:    { label:"Advance & Riders", mo:75, build:550, why:"Hospitality and technical riders, the advance checklist, day-of-show logistics." },
    fnb:        { label:"Front of House & F&B", mo:70, build:500, why:"Per-cap spend, the bar and concessions, house staffing." },
    marketing:  { label:"Marketing & Members", mo:70, build:450, why:"On-sales, presales, memberships and the announce calendar." },
    books:      { label:"Venue Metrics", mo:80, build:600, why:"Per-show P&L, sell-through, per-cap, walk rate — computed, not reconstructed." },
    hr:         { label:"Staffing", mo:65, build:400, why:"Crew, security and volunteers by show; call times and check-in." },
    it:         { label:"IT · System Health", mo:60, build:400, why:"CLEAR / WATCH / INTERVENE on ticketing, payments, the portal and backups." },
    law:        { label:"Law · Contracts", mo:100, build:800, why:"Booking agreements, PRO licensing (ASCAP/BMI), liquor & occupancy — advisory, with a fence to a real attorney." },
    org:        { label:"Agent Org · Bus", mo:150, build:1300, why:"The ten AI department chains, the event bus, and the confidence gates. The venue's brain." }
  };
  var TIERS = {
    lite: { key:"lite", name:"Club", rank:1, mo:600, build:3500, desc:"The room running. Calendar, box office (GA/reserved/cabaret), deals, advance and settlement.", base:"Single room · up to 8 seats", includes:["calendar","boxoffice","deals","settlement","advance"] },
    standard: { key:"standard", name:"Venue", rank:2, mo:1400, build:9000, desc:"The full house. Adds F&B, marketing & members, venue metrics, staffing, IT — and the agent org.", base:"Single venue · up to 25 seats", includes:["calendar","boxoffice","deals","settlement","advance","fnb","marketing","books","hr","it","org"] },
    grandsuite: { key:"grandsuite", name:"Group / Promoter", rank:3, mo:3000, build:22000, desc:"Multi-venue, nothing held back. Every department, the full agent org, and counsel.", base:"Multi-venue · unlimited seats · dedicated environment", includes:["calendar","boxoffice","deals","settlement","advance","fnb","marketing","books","hr","it","law","org"] }
  };
  var DEPTS = [
    { group:"Command", items:[ { href:"dashboard.html", label:"Command Center", ic:"◎" }, { href:"approvals.html", label:"Approval Desk", ic:"✓", accent:"ops" } ]},
    { group:"The Bookings", items:[ { href:"calendar.html", label:"Shows & Calendar", ic:"▦", room:"calendar", accent:"calendar" }, { href:"deals.html", label:"Artists & Deals", ic:"◆", room:"deals", accent:"deals" }, { href:"advance.html", label:"Advance & Riders", ic:"⛭", room:"advance", accent:"advance" } ]},
    { group:"The Money", items:[ { href:"boxoffice.html", label:"Box Office", ic:"◧", room:"boxoffice", accent:"box" }, { href:"settlement.html", label:"Settlement", ic:"❖", room:"settlement", accent:"settle" }, { href:"books.html", label:"Venue Metrics", ic:"◭", room:"books", accent:"books" } ]},
    { group:"The House", items:[ { href:"fnb.html", label:"Front of House & F&B", ic:"♥", room:"fnb", accent:"fnb" }, { href:"marketing.html", label:"Marketing & Members", ic:"◈", room:"marketing", accent:"market" }, { href:"hr.html", label:"Staffing", ic:"☷", room:"hr", accent:"hr" } ]},
    { group:"Systems & Governance", items:[ { href:"it.html", label:"IT · System Health", ic:"⚙", room:"it", accent:"it" }, { href:"law.html", label:"Law · Contracts", ic:"⚖", room:"law", accent:"law" }, { href:"org.html", label:"Agent Org · Bus", ic:"❖", room:"org", accent:"ops" } ]}
  ];

  var SEATS = {
    coo: { id:"coo", name:"Roxy", role:"Chief Operating Officer", tier:"COO", dept:"Command", gate:null, line:"Apex seat. Makes the ordinary call; defers to the owner only behind a Fence." },
    depts: [
      { key:"booking", name:"Bookings & Calendar", accent:"calendar", gate:80, dh:{name:"Locke",line:"Owns the calendar — holds, confirms, and the routing that fills the room."}, ae:{name:"Herald",line:"Packages holds, offers and the announce schedule."}, pace:{name:"Compass",line:"Only voice out of the triad. Confirms at ≥80%; below that a hold with reasons."}, lensA:{name:"Draw",line:"Draw lens — does this act sell this room on this date?"}, lensB:{name:"Route",line:"Feasibility lens — is the date clear, the deal sane, and the contract in?"} },
      { key:"deals", name:"Deals & Offers", accent:"deals", gate:85, dh:{name:"Broker",line:"Owns the offer and the deal memo. Nothing sells until the paper is signed."}, ae:{name:"Memo",line:"Packages guarantee/door/vs terms, the deposit, and the executed contract."}, pace:{name:"Chain",line:"High bar (85%). No on-sale without a signed contract and a received deposit — it routes to a human."}, lensA:{name:"Terms",line:"Enablement lens — how do we get to a signed, sellable date?"}, lensB:{name:"Exposure",line:"Risk lens — is this deal underwater at a realistic count?"} },
      { key:"box", name:"Box Office", accent:"box", gate:80, dh:{name:"Turnstile",line:"Owns the count — the manifest, the on-sale, the scan-in."}, ae:{name:"Manifest",line:"Packages holds, comps, sell-through and the walk-up estimate."}, pace:{name:"Gate",line:"Releases box-office calls at ≥80%; a fee-disclosure question escalates."}, lensA:{name:"Pace",line:"Velocity lens — is this show pacing to sell out or to paper?"}, lensB:{name:"Manifest",line:"Integrity lens — do the holds, comps and kills reconcile to the cap?"} },
      { key:"money", name:"Settlement & Books", accent:"settle", gate:85, dh:{name:"Ledger",line:"Owns the P&L and the settlement. A wrong line pays the wrong artist."}, ae:{name:"Sheet",line:"Packages gross, taxes/fees, expenses, the deal, and the venue net."}, pace:{name:"Baseline",line:"High bar (85%). A bluffed settlement is a dispute with a tour manager at 1am."}, lensA:{name:"Actual",line:"Cash lens — what actually cleared the box office, tagged LIVE only."}, lensB:{name:"Deal",line:"Deal lens — does the artist cut match the executed memo to the dollar?"} },
      { key:"production", name:"Advance & Production", accent:"advance", gate:80, dh:{name:"Marek",line:"Owns the advance — riders, load-in, the day-of-show."}, ae:{name:"Rider",line:"Packages the hospitality and technical riders and the schedule."}, pace:{name:"Trueline",line:"Releases the advance at ≥80%; a spec the room can't meet escalates."}, lensA:{name:"Spec",line:"Hospitality lens — can we meet the rider without blowing the expense line?"}, lensB:{name:"Stage",line:"Technical lens — does the stage, power and PA actually cover the input list?"} },
      { key:"fnb", name:"Front of House & F&B", accent:"fnb", gate:80, dh:{name:"House",line:"Owns the room on the night — bar, doors, and the per-cap."}, ae:{name:"Percap",line:"Packages the bar plan, staffing and the concessions count."}, pace:{name:"Meter",line:"Releases the house plan at ≥80%; an occupancy conflict escalates."}, lensA:{name:"Spend",line:"Revenue lens — what does this crowd drink and buy?"}, lensB:{name:"Safety",line:"Compliance lens — are we within occupancy and the liquor license?"} },
      { key:"marketing", name:"Marketing & Members", accent:"market", gate:80, dh:{name:"Hale",line:"Owns the announce and the presale — filling the room."}, ae:{name:"Announce",line:"Packages the on-sale, the presale codes and the member push."}, pace:{name:"Signal",line:"Releases a campaign at ≥80%; a spend that won't clear escalates."}, lensA:{name:"Reach",line:"Demand lens — where's the audience for this act?"}, lensB:{name:"Cost",line:"Efficiency lens — is the marketing line eating the show's margin?"} },
      { key:"hr", name:"Staffing", accent:"hr", gate:80, dh:{name:"Roster",line:"Owns the crew, security and volunteers by show."}, ae:{name:"Call",line:"Packages call times, check-in and the run-of-show."}, pace:{name:"Balance",line:"Releases staffing at ≥80%; an under-staffed door escalates."}, lensA:{name:"Cover",line:"Coverage lens — is every post filled for this count?"}, lensB:{name:"Cost",line:"Labor lens — is the staff line right-sized for the door?"} },
      { key:"it", name:"IT · System Health", accent:"it", gate:80, dh:{name:"Ward",line:"Owns uptime — ticketing, payments, the portal on-sale day."}, ae:{name:"Cache",line:"Packages incidents, the watch list, backup verification."}, pace:{name:"Steady",line:"Calls system health; a ticketing outage on-sale day escalates instantly."}, lensA:{name:"Access",line:"Availability lens — is the box office and the queue reachable?"}, lensB:{name:"Loss",line:"Risk lens — where's the exposure if the scanners drop at doors?"} },
      { key:"law", name:"Law · Contracts", accent:"law", gate:85, dh:{name:"Barrow",line:"Owns the booking agreement, PRO licensing and the liquor/occupancy read. NOT a lawyer; advisory only."}, ae:{name:"File",line:"Packages the matter, the risk, the sources; flags what needs a real attorney."}, pace:{name:"Care",line:"High bar (85%). Anything with real exposure routes to counsel."}, lensA:{name:"Clear",line:"Enablement lens — how do we get to a compliant, sellable show?"}, lensB:{name:"Claim",line:"Exposure lens — what claim could arise, and does our coverage respond?"} }
    ]
  };

  /* -------------------------------------------------------------- brain */
  var BRAIN = {
    booking: { match:["book","calendar","hold","confirm","route","date","announce","lineup","show","offer"], build:function(d){ var conf=d.shows.filter(function(s){return s.onSale;}); return { stance:"Confirm the strong dates and don't announce Nova Sol until the paper's in — an on-sale you can't fulfill is a refund event, not a marketing win.", conf:82, reasons:[{t:"data",s:conf.length+" show(s) confirmed and on sale; average sell-through is "+avgSellThrough(d).toFixed(0)+"%."},{t:"data",s:blockedOnSale(d).length+" announced show(s) are blocked from on-sale for a missing contract/deposit."},{t:"assumption",s:"Assumes the Nova Sol contract lands this week; if it slips, the date's marketing spend is at risk."}] }; } },
    deals: { match:["deal","offer","guarantee","door","split","vs","contract","deposit","on sale","onsale","memo","agent"], build:function(d){ var blocked=blockedOnSale(d); return { stance: blocked.length?"Do NOT put Nova Sol on sale — the contract is unsigned and the deposit isn't in. No on-sale without executed paper. That's the gate.":"All on-sale shows have executed contracts and deposits in.", conf:88, reasons:[{t:"data",s:blocked.length+" show(s) blocked from on-sale; the rights-gate holds the box office shut until the paper's in."},{t:"data",s:"Deal types on the books: guarantee, door (80–85% to artist), and guarantee-vs-overage — each computes a different settlement."},{t:"assumption",s:"Assumes the Nova Sol guarantee ($14k) is firm; at a realistic count it needs ~75% sell-through to clear."}] }; } },
    box: { match:["box office","ticket","manifest","hold","comp","scan","sell","sold","walk","presale","count","fee"], build:function(d){ var on=d.shows.filter(function(s){return s.onSale;}); var st=avgSellThrough(d); return { stance:"The Ember Coast is pacing to sell out — push the last GA and release the artist holds. Watch Marlowe's marketing line; it's eating the door.", conf:84, reasons:[{t:"data",s:on.length+" show(s) on sale; blended sell-through "+st.toFixed(0)+"% against a "+BENCH.sellThrough.target[0]+"–"+BENCH.sellThrough.target[1]+"% band ("+BENCH.sellThrough.src+")."},{t:"data",s:"Every hold, comp and kill reconciles to the posted cap — the manifest is the truth, not the marketing number."},{t:"assumption",s:"Assumes a ~"+BENCH.walkRate.median+"% walk-up; a rainy night moves it."}] }; } },
    money: { match:["settle","settlement","money","net","gross","expense","p&l","pnl","margin","payout","books","per-cap","percap"], build:function(d){ var un=unsettled(d); var net=totalVenueNet(d); return { stance:"Settle Harbor Lights tonight — it's sold out and closed. Present the sheet: gross box office, taxes and facility fees, expenses, the vs-deal, and the venue net. Then get paid.", conf:83, reasons:[{t:"data",s:un.length+" on-sale show(s) still to settle; projected venue net across the slate is $"+net.toLocaleString()+"."},{t:"data",s:"The settlement sheet computes the artist cut straight from the executed deal — guarantee, door %, or guarantee + overage split."},{t:"assumption",s:"Assumes no disputed expense lines; a challenged production cost moves the artist's overage."}] }; } },
    production: { match:["advance","rider","load-in","soundcheck","stage","production","hospitality","backline","day of show","schedule"], build:function(d){ return { stance:"Advance Nova Sol's rider only after the contract's signed — don't spend on hospitality for a show that can't go on sale.", conf:81, reasons:[{t:"data",s:d.shows.filter(function(s){return s.onSale;}).length+" show(s) advancing; riders and day-of-show schedules packaged per show."},{t:"data",s:"The rider spend rolls straight into the show's expense line and the settlement."},{t:"assumption",s:"Assumes the technical rider fits the house PA and power; a spec we can't meet is a renegotiation."}] }; } },
    fnb: { match:["bar","f&b","fnb","per-cap","percap","concession","house","door","staffing","occupancy","liquor"], build:function(d){ return { stance:"Staff the bar for a sold-out Ember Coast and confirm the GA count sits under occupancy with the liquor license — the per-cap is real money on a full house.", conf:82, reasons:[{t:"data",s:"Per-cap target band is $"+BENCH.perCap.target[0]+"–"+BENCH.perCap.target[1]+" ("+BENCH.perCap.src+")."},{t:"data",s:"A full GA plus staff must stay under posted occupancy — the fire-marshal number, not the ticket cap."},{t:"assumption",s:"Assumes the crowd's drink profile matches an indie-rock night; a comedy crowd spends differently."}] }; } },
    marketing: { match:["market","announce","presale","member","campaign","ad","promo","email","reach"], build:function(d){ return { stance:"Ride the Ember Coast momentum with a final GA push, and pull back Marlowe's ad spend — the marketing line is outrunning that show's margin.", conf:80, reasons:[{t:"data",s:d.shows.filter(function(s){return s.onSale;}).length+" show(s) marketing live; members get the presale window first."},{t:"data",s:"Every marketing dollar is a line in that show's settlement — it comes off the top before the split."},{t:"assumption",s:"Assumes the presale converts at its usual rate; a soft presale means more paid ads to fill."}] }; } },
    hr: { match:["staff","crew","security","volunteer","call","door","people","hire","schedule"], build:function(d){ return { stance:"Cover the sold-out night fully — doors, security and bar — and right-size the comedy night; a seated 600 doesn't need a rock-show door.", conf:85, reasons:[{t:"data",s:d.team.length+" core staff; per-show crew, security and volunteers scheduled by count."},{t:"data",s:"Every post filled for the count is a safety line, not just a labor line."},{t:"assumption",s:"A termination or a security incident always routes to a human."}] }; } },
    it: { match:["system","health","uptime","ticket","payment","portal","outage","scanner","onsale","backup"], build:function(d){ var watch=d.systems.filter(function(s){return s.state!=="CLEAR";}); return { stance: watch.length?"WATCH: "+watch.map(function(s){return s.name;}).join(", ")+". Nothing needs INTERVENE, but the presale portal is spiking — keep the queue armed for the on-sale.":"System is CLEAR — ticketing, payments and the portal reachable, backups verified.", conf: watch.length?84:89, reasons:[{t:"data",s:d.systems.length+" service(s) monitored; "+watch.length+" on WATCH, 0 INTERVENE."},{t:"data",s:"A ticketing outage on an on-sale is lost revenue you never recover — verified queue + failover."},{t:"assumption",s:"Assumes the showroom checks mirror production; a real on-sale outage pages a person."}] }; } },
    law: { match:["contract","legal","law","pro","ascap","bmi","license","liquor","occupancy","fee","disclosure","booking agreement"], build:function(d){ var open=d.matters.filter(function(m){return m.state==="Open";}); var high=open.filter(function(m){return m.risk==="High";}); return { stance:"Hold the Nova Sol on-sale until the contract's executed, and confirm the PRO blanket licenses cover the fall before another announce.", conf:66, reasons:[{t:"data",s:open.length+" open matter(s); "+high.length+" rated High risk."},{t:"assumption",s:"This is an advisory read, NOT legal advice. Counsel owns the sign-off — that caps confidence under the 85% bar by design."},{t:"assumption",s:"Selling a date without an executed contract, or without current PRO licensing, is direct exposure; needs counsel to clear."}] }; } },
    ops: { match:["operations","process","bottleneck","running","admin","calendar","board"], build:function(d){ return { stance:"The bottleneck is the Nova Sol paper — marketing is ready, the room is ready, but nothing sells until the contract and deposit land.", conf:81, reasons:[{t:"data",s:blockedOnSale(d).length+" show(s) blocked at the on-sale gate; "+unsettled(d).length+" awaiting settlement."},{t:"data",s:"Every released conclusion is filed to the show record with a settle-calendar follow-up."},{t:"assumption",s:"Assumes current staffing; a busy fall run needs a box-office capacity check."}] }; } }
  };

  function consult(deptKey, question) {
    var d = db();
    var dept = SEATS.depts.filter(function (x){ return x.key===deptKey; })[0];
    var brain = BRAIN[deptKey];
    if (!dept || !brain) return null;
    var verdict = brain.build(d, question||"");
    var passed = verdict.conf >= dept.gate;
    var topic = dept.key;
    var stamp = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    var events = [
      { topic:topic+".sot.read", kind:"route", from:dept.dh.name, to:"Filing · SSOT", body:dept.dh.name+" is called to the Source of Truth and reads it before acting. SSOT loaded ✓ — canon, fences, and this show's record in hand.", stamp:stamp },
      { topic:topic+".ae.packaged", kind:"route", from:dept.ae.name, to:dept.pace.name, body:dept.ae.name+" (Administrative Executive) packages the ask, files it, and routes it down the bus to the triad: \""+(question||"(department review)")+"\"", stamp:stamp },
      { topic:topic+".triad.finding", kind:"deliberate", from:dept.lensA.name, to:dept.pace.name, body:"["+dept.lensA.name+"] "+lensTake(verdict,"A"), stamp:stamp },
      { topic:topic+".triad.finding", kind:"deliberate", from:dept.lensB.name, to:dept.pace.name, body:"["+dept.lensB.name+"] "+lensTake(verdict,"B"), stamp:stamp }
    ];
    var COORD = { booking:{to:"deals",why:"confirm the deal and the contract before the date is announced"}, deals:{to:"box",why:"release the on-sale once the paper's executed"}, box:{to:"money",why:"hand the final count to settlement"}, money:{to:"box",why:"pull the reconciled manifest before cutting the sheet"}, production:{to:"fnb",why:"line up the house and the rider against the count"}, fnb:{to:"hr",why:"staff the bar and the doors to the count"}, marketing:{to:"box",why:"time the on-sale and presale against the manifest"}, hr:{to:"production",why:"put the crew call against the day-of-show schedule"}, it:{to:"box",why:"arm the queue for the on-sale"}, law:{to:"deals",why:"confirm the booking agreement before the on-sale"} };
    var co = COORD[dept.key];
    if (co) { var peer = SEATS.depts.filter(function (x){ return x.key===co.to; })[0]; if (peer) events.push({ topic:topic+".ae.lateral", kind:"route", from:dept.ae.name, to:peer.ae.name+" ("+peer.name+" AE)", body:dept.ae.name+" coordinates laterally with "+peer.ae.name+" to "+co.why+" — AE↔AE, same position, no chain needed.", stamp:stamp }); }
    if (passed) {
      events.push({ topic:topic+".pacemaker.released", kind:"conclude", from:dept.pace.name, to:dept.ae.name, body:verdict.stance, conclusion:true, verdict:verdict, gate:dept.gate, stamp:stamp });
      events.push({ topic:topic+".ae.filed", kind:"route", from:dept.ae.name, to:dept.dh.name, body:dept.ae.name+" files the released conclusion to the show record and sets a follow-up, then hands it to "+dept.dh.name+".", stamp:stamp });
      events.push({ topic:"coo.decision", kind:"route", from:dept.dh.name, to:SEATS.coo.name+" (COO)", body:dept.dh.name+" carries it up to "+SEATS.coo.name+", the interface to the owner: cleared the "+dept.gate+"% bar.", stamp:stamp });
    } else {
      events.push({ topic:"escalation.below_bar", kind:"reject", from:dept.pace.name, to:SEATS.coo.name+" → the Owner", body:"Held below the "+dept.gate+"% bar ("+verdict.conf+"%). Needs a human — not enough live data. "+dept.ae.name+" files the hold; "+SEATS.coo.name+" routes it up with reasons attached.", conclusion:true, verdict:verdict, gate:dept.gate, escalate:true, stamp:stamp });
    }
    save(function (x){ events.forEach(function (e){ e.id="e"+(x.seq++); e.dept=dept.key; x.bus.push(e); }); if (x.bus.length>60) x.bus=x.bus.slice(-60); });
    return { dept:dept, verdict:verdict, passed:passed, events:events };
  }
  function lensTake(v, which) { var pro=v.reasons.filter(function(r){return r.t==="data";})[0]; var con=v.reasons.filter(function(r){return r.t==="assumption";})[0]; if (which==="A") return "Argues FOR: "+(pro?pro.s:"the evidence supports moving."); return "Pushes back: "+(con?con.s:"the evidence isn't fully sourced yet."); }
  function routeDept(question) { var q=String(question||"").toLowerCase(),best=null,bs=0; Object.keys(BRAIN).forEach(function (k){ var sc=BRAIN[k].match.reduce(function(s,w){return s+(q.indexOf(w)>=0?1:0);},0); if (sc>bs){bs=sc;best=k;} }); return best||"booking"; }
  function askRoxy(question) {
    var deptKey = routeDept(question);
    var dept = SEATS.depts.filter(function (x){ return x.key===deptKey; })[0];
    var stamp = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    save(function (x){ x.bus.push({ id:"e"+(x.seq++), dept:"coo", topic:"coo.route", kind:"route", from:SEATS.coo.name+" (COO)", to:dept.dh.name+" ("+dept.name+")", body:SEATS.coo.name+" takes the ask off the owner's desk and routes it to "+dept.name+" — she gates and packages, she doesn't do the work herself.", stamp:stamp }); });
    var r = consult(deptKey, question);
    var packaged = r.passed ? (SEATS.coo.name+": On track. "+dept.name+" cleared its "+dept.gate+"% bar — I'm releasing this to you. "+r.verdict.stance) : (SEATS.coo.name+": Holding this off your desk. "+dept.name+" came in at "+r.verdict.conf+"%, under its "+dept.gate+"% bar — it needs a human. Here's what I have, and I've set a follow-up. "+r.verdict.stance);
    return { deptKey:deptKey, dept:dept, result:r, packaged:packaged, on_track:r.passed };
  }

  function approvals() { return db().approvals || []; }
  function stage(kind, title, summary, why, by) { var item = { id:"ap"+now(), kind:kind||"general", title:title||"Untitled", summary:summary||"", why:why||"Behind a fence — needs the owner.", by:by||"The org", state:"Pending" }; save(function (d){ (d.approvals=d.approvals||[]).push(item); }); return item; }
  function decideApproval(id, decision) { save(function (d){ (d.approvals||[]).forEach(function (a){ if (a.id===id) a.state=decision; }); }); return approvals(); }

  /* -------------------------------------------------------------- configurator */
  function tierKey() { return db().tier || "grandsuite"; }
  function tierRank() { return TIERS[tierKey()].rank; }
  function setTier(k) { save(function (d){ d.tier=k; d.adds=[]; d.offs=[]; }); }
  function activeRooms() { var d=db(); var inc=(TIERS[d.tier]||TIERS.grandsuite).includes.slice(); (d.offs||[]).forEach(function(k){var i=inc.indexOf(k);if(i>=0)inc.splice(i,1);}); (d.adds||[]).forEach(function(k){if(inc.indexOf(k)<0&&ROOMS[k])inc.push(k);}); return inc; }
  function hasRoom(k) { return !k || activeRooms().indexOf(k)>=0; }
  function toggleRoom(k) { if (!ROOMS[k]) return; save(function (d){ var inc=(TIERS[d.tier]||TIERS.grandsuite).includes; d.adds=d.adds||[]; d.offs=d.offs||[]; var inP=inc.indexOf(k)>=0,iA=d.adds.indexOf(k),iO=d.offs.indexOf(k); if (inP){ if(iO>=0)d.offs.splice(iO,1); else d.offs.push(k); } else { if(iA>=0)d.adds.splice(iA,1); else d.adds.push(k); } }); }
  function priceNow() {
    var d=db(), t=TIERS[d.tier]||TIERS.grandsuite;
    var adds=(d.adds||[]).filter(function(k){return ROOMS[k];}), offs=(d.offs||[]).filter(function(k){return ROOMS[k];});
    var addMo=adds.reduce(function(s,k){return s+ROOMS[k].mo;},0), addBuild=adds.reduce(function(s,k){return s+ROOMS[k].build;},0);
    var offMo=offs.reduce(function(s,k){return s+ROOMS[k].mo;},0), offBuild=offs.reduce(function(s,k){return s+ROOMS[k].build;},0);
    var rooms=activeRooms();
    var alaMo=rooms.reduce(function(s,k){return s+(ROOMS[k]?ROOMS[k].mo:0);},0), alaBuild=rooms.reduce(function(s,k){return s+(ROOMS[k]?ROOMS[k].build:0);},0);
    var mo=Math.max(0,t.mo+addMo-offMo), build=Math.max(0,t.build+addBuild-offBuild);
    return { tier:t, rooms:rooms, adds:adds, offs:offs, mo:mo, build:build, addMo:addMo, offMo:offMo, addBuild:addBuild, offBuild:offBuild, alaMo:alaMo, alaBuild:alaBuild, platformMo:Math.max(0,mo-alaMo), savingMo:Math.max(0,alaMo-mo), changed:adds.length>0||offs.length>0 };
  }
  function priceLabel() { var p=priceNow(); return money(p.mo)+"/mo · "+money(p.build)+" build"; }

  /* -------------------------------------------------------------- view helpers */
  function el(html) { var t=document.createElement("template"); t.innerHTML=String(html).trim(); return t.content.firstChild; }
  function esc(s) { return String(s==null?"":s).replace(/[&<>"']/g, function (c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function money(n){ return "$"+(Math.round(Number(n)||0)).toLocaleString(); }
  function pct(n, dp){ return (Number(n)||0).toFixed(dp===undefined?0:dp)+"%"; }
  function brandMark() {
    return '<img src="https://www.aexperiences.com/Amphitheater_OS.png" alt="Amphitheater OS" onerror="this.style.display=\'none\';this.parentNode.classList.add(\'fallback\')">' +
      '<svg class="fallback-mark" viewBox="0 0 32 32" width="24" height="24" style="display:none" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><path d="M4 26a12 8 0 0 1 24 0"/><path d="M8 26a8 5 0 0 1 16 0"/><path d="M12 26a4 3 0 0 1 8 0"/></g></svg>';
  }

  function renderShell(active) {
    var side = document.createElement("aside"); side.className = "sidebar";
    side.appendChild(el('<a href="dashboard.html" class="brand"><div class="bmark" aria-hidden="true">'+brandMark()+'</div><div><div class="bt">Amphitheater OS</div><div class="bs">Live Venue OS</div></div></a>'));
    var nav = document.createElement("nav"); nav.className = "nav"; var on = activeRooms();
    DEPTS.forEach(function (grp) {
      nav.appendChild(el('<div class="nav-group">'+esc(grp.group)+'</div>'));
      grp.items.forEach(function (it) {
        var off = it.room && on.indexOf(it.room)<0;
        var a = el('<a href="'+(off?"javascript:void(0)":it.href)+'" class="navlink '+(it.href===active?"active":"")+(off?" locked":"")+'"><span class="ic">'+it.ic+'</span><span class="lb">'+esc(it.label)+'</span>'+(off?'<span class="tier-tag">+'+money(ROOMS[it.room].mo)+'</span>':'')+'</a>');
        if (off) { a.title="Add "+ROOMS[it.room].label+" for "+money(ROOMS[it.room].mo)+"/mo + "+money(ROOMS[it.room].build)+" build"; a.addEventListener("click", function (){ toggleRoom(it.room); toast(ROOMS[it.room].label+" added — "+priceLabel(),"ok"); setTimeout(function(){location.reload();},500); }); }
        nav.appendChild(a);
      });
    });
    side.appendChild(nav);
    return side;
  }
  function renderTopbar(crumb) {
    var p = priceNow();
    var bar = document.createElement("div"); bar.className = "topbar";
    bar.innerHTML = '<button class="navtoggle" id="navToggle" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><div class="crumbs">Amphitheater OS · <b>'+esc(crumb)+'</b></div><div class="spacer"></div><div class="tierpill" id="tierPill" role="button" tabindex="0"><span class="dot"></span><div><b>'+esc(p.tier.name)+(p.changed?' <i class="cfg">configured</i>':'')+'</b> <span class="price">'+money(p.mo)+'/mo · '+money(p.build)+' build</span></div><span class="chev">▾</span></div><div class="who"><div class="av">DR</div><div>Dana Reyes<br><span class="muted small">Owner · Talent Buyer</span></div></div>';
    var menu = document.createElement("div"); menu.className = "tiermenu"; menu.id = "tierMenu";
    menu.appendChild(el('<div class="tm-head">Start from a package, then <b>add or take off any department</b>. Every one is priced on its own, so the build fits the venue instead of the venue fitting the build.</div>'));
    Object.keys(TIERS).sort(function (a,b){ return TIERS[b].rank-TIERS[a].rank; }).forEach(function (k) {
      var tt = TIERS[k];
      var opt = el('<div class="tieropt '+(k===tierKey()?"on":"")+'"><div class="to-top"><span class="to-name">'+esc(tt.name)+'</span><span class="to-price">'+money(tt.mo)+'/mo · '+money(tt.build)+' build</span></div><div class="to-desc">'+esc(tt.desc)+'</div><div class="to-base">'+esc(tt.base)+' · '+tt.includes.length+' departments</div></div>');
      opt.addEventListener("click", function (e){ e.stopPropagation(); setTier(k); location.reload(); });
      menu.appendChild(opt);
    });
    menu.appendChild(el('<div class="tm-sub">Departments — toggle any one on or off</div>'));
    var on = activeRooms(); var list = document.createElement("div"); list.className = "roomlist";
    Object.keys(ROOMS).forEach(function (k) {
      var r = ROOMS[k], isOn = on.indexOf(k)>=0, inPack = p.tier.includes.indexOf(k)>=0;
      var row = el('<div class="roomrow '+(isOn?"on":"")+'"><span class="rr-box">'+(isOn?"✓":"+")+'</span><span class="rr-name">'+esc(r.label)+(isOn&&!inPack?' <i class="rr-flag add">added</i>':'')+(!isOn&&inPack?' <i class="rr-flag off">removed</i>':'')+'</span><span class="rr-price">'+money(r.mo)+'/mo<i>'+money(r.build)+' build</i></span><span class="rr-why">'+esc(r.why)+'</span></div>');
      row.addEventListener("click", function (e){ e.stopPropagation(); toggleRoom(k); toast(r.label+(activeRooms().indexOf(k)>=0?" added — ":" removed — ")+priceLabel(),"ok"); setTimeout(function(){location.reload();},500); });
      list.appendChild(row);
    });
    menu.appendChild(list);
    var total = '<div class="tm-total"><div class="tt-line"><span>'+esc(p.tier.name)+' package</span><b>'+money(p.tier.mo)+'/mo</b></div>'+(p.adds.length?'<div class="tt-line add"><span>+ '+p.adds.length+' department'+(p.adds.length>1?"s":"")+' added</span><b>+'+money(p.addMo)+'/mo</b></div>':'')+(p.offs.length?'<div class="tt-line off"><span>− '+p.offs.length+' department'+(p.offs.length>1?"s":"")+' removed</span><b>−'+money(p.offMo)+'/mo</b></div>':'')+'<div class="tt-line grand"><span>Configured</span><b>'+money(p.mo)+'/mo · '+money(p.build)+' build</b></div><div class="tt-save">'+p.rooms.length+' department'+(p.rooms.length===1?"":"s")+' at '+money(p.alaMo)+'/mo, plus '+money(p.platformMo)+'/mo platform — '+esc(p.tier.base.toLowerCase())+'.</div><div class="tt-draft">Draft pricing — Accelerated Experiences LLC sets every live price.</div></div>';
    menu.appendChild(el(total));
    menu.addEventListener("click", function (e){ e.stopPropagation(); });
    setTimeout(function () { var pill=document.getElementById("tierPill"); if (pill) pill.addEventListener("click", function (e){ e.stopPropagation(); menu.classList.toggle("open"); }); document.addEventListener("click", function (){ menu.classList.remove("open"); }); }, 0);
    var frag = document.createDocumentFragment(); frag.appendChild(bar); frag.appendChild(menu); return frag;
  }
  function ribbon() { return el('<div class="ribbon"><span class="live">LIVE SHOWROOM</span> — this is the real OS, not a slideshow. Everything you type stays in your browser and resets when you leave. <a href="javascript:void(0)" id="resetFloor">Reset the floor</a></div>'); }
  function footer() { return el('<div class="ae-credit">Powered by <b>Accelerated Experiences LLC</b> · Amphitheater OS is a white-label build. Demo data is a fictional venue; benchmark figures are estimates and tagged.</div>'); }
  function mount(opts) {
    opts = opts || {}; db();
    var app = document.createElement("div"); app.className = "app";
    var scrim = document.createElement("div"); scrim.className = "navscrim"; scrim.id = "navScrim";
    var side = renderShell(opts.active);
    var main = document.createElement("div"); main.className = "main";
    main.appendChild(ribbon()); main.appendChild(renderTopbar(opts.crumb || "Command Center"));
    var content = document.createElement("div"); content.className = "content"; content.id = "content";
    main.appendChild(content); main.appendChild(footer());
    app.appendChild(scrim); app.appendChild(side); app.appendChild(main);
    document.body.innerHTML = ""; document.body.appendChild(app);
    document.body.appendChild(el('<div id="toast-wrap"></div>'));
    setTimeout(function () {
      var r = document.getElementById("resetFloor");
      if (r) r.addEventListener("click", function (){ resetFloor(); toast("Showroom reset to a fresh floor.","ok"); setTimeout(function(){location.reload();},450); });
      var t = document.getElementById("navToggle");
      if (t) t.addEventListener("click", function (){ app.classList.toggle("nav-open"); });
      if (scrim) scrim.addEventListener("click", function (){ app.classList.remove("nav-open"); });
    }, 0);
    return content;
  }
  function toast(msg, kind) { var w=document.getElementById("toast-wrap"); if (!w) return; var t=el('<div class="toast '+(kind||"")+'">'+esc(msg)+'</div>'); w.appendChild(t); setTimeout(function (){ t.style.opacity="0"; setTimeout(function(){t.remove();},250); }, 2600); }
  function page(title, sub, actionsHTML) { return el('<div class="pagehead"><div><h1>'+esc(title)+'</h1>'+(sub?'<p class="sub">'+sub+'</p>':"")+'</div><div class="pagehead-actions">'+(actionsHTML||"")+'</div></div>'); }
  function card(inner, cls) { return el('<section class="card '+(cls||"")+'">'+inner+'</section>'); }
  function stat(label, value, note, band) { return '<div class="stat '+(band||"")+'"><div class="s-l">'+esc(label)+'</div><div class="s-v">'+value+'</div>'+(note?'<div class="s-n">'+note+'</div>':"")+'</div>'; }
  function tag(text, kind) { return '<span class="tag '+(kind||"")+'">'+esc(text)+'</span>'; }
  function srcNote(text) { return '<div class="srcnote">Source: '+esc(text)+'</div>'; }

  document.addEventListener("visibilitychange", function (){ if (!document.hidden) db(); });

  global.Amph = {
    db:db, save:save, resetFloor:resetFloor, fresh:fresh, SEED:SEED,
    DEAL_TYPES:DEAL_TYPES, SEAT_TYPES:SEAT_TYPES, EXPENSE_LINES:EXPENSE_LINES, FACILITY_FEE:FACILITY_FEE, TICKET_TAX:TICKET_TAX, BENCH:BENCH, REPLACES:REPLACES,
    TIERS:TIERS, ROOMS:ROOMS, DEPTS:DEPTS, SEATS:SEATS, BRAIN:BRAIN,
    tierKey:tierKey, tierRank:tierRank, setTier:setTier, activeRooms:activeRooms, hasRoom:hasRoom, toggleRoom:toggleRoom, priceNow:priceNow, priceLabel:priceLabel,
    consult:consult, askRoxy:askRoxy, routeDept:routeDept,
    soldTickets:soldTickets, capTickets:capTickets, grossBoxOffice:grossBoxOffice, sellThrough:sellThrough, ticketTax:ticketTax, facilityFees:facilityFees, showExpenses:showExpenses, netToSplit:netToSplit, artistCut:artistCut, venueNet:venueNet,
    canGoOnSale:canGoOnSale, blockedOnSale:blockedOnSale, unsettled:unsettled, totalVenueNet:totalVenueNet, avgSellThrough:avgSellThrough, settleShow:settleShow,
    approvals:approvals, stage:stage, decideApproval:decideApproval,
    mount:mount, toast:toast, el:el, esc:esc, money:money, pct:pct, page:page, card:card, stat:stat, tag:tag, srcNote:srcNote
  };
})(window);
