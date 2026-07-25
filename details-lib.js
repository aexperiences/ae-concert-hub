/* Show Studio — parametric planning tools for the venue.
   Same generator contract as every hub studio: { label, blurb, params, draw(p) -> {summary, svg, specs, notes, flag?} }.
   PLANNING AIDS ONLY — settlements are checked by the accountant, plots by production. Accelerated Experiences, LLC. */
window.DETAILS = (function () {
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function r(n){return Math.round(n*10)/10;}
  function fmt(n){return Math.round(n).toLocaleString();}
  function money(n){return '$'+fmt(n);}
  var DIM='stroke:var(--accent);stroke-width:1;fill:none';
  var DIMT='fill:var(--accent);font:600 11px Inter,system-ui,sans-serif';
  var LBL='fill:var(--ink2);font:500 11px Inter,system-ui,sans-serif';
  var FILLL='fill:var(--cream);stroke:var(--ink2);stroke-width:1.4';
  function line(x1,y1,x2,y2,st){return '<line x1="'+r(x1)+'" y1="'+r(y1)+'" x2="'+r(x2)+'" y2="'+r(y2)+'" style="'+st+'"/>';}
  function rect(x,y,w,h,st){return '<rect x="'+r(x)+'" y="'+r(y)+'" width="'+r(w)+'" height="'+r(h)+'" style="'+st+'"/>';}
  function circle(cx,cy,rr,st){return '<circle cx="'+r(cx)+'" cy="'+r(cy)+'" r="'+r(rr)+'" style="'+st+'"/>';}
  function txt(x,y,s,st,anc){return '<text x="'+r(x)+'" y="'+r(y)+'" text-anchor="'+(anc||'middle')+'" style="'+(st||LBL)+'">'+esc(s)+'</text>';}
  function dimH(x1,x2,y,label){return line(x1,y,x2,y,DIM)+line(x1,y-4,x1,y+4,DIM)+line(x2,y-4,x2,y+4,DIM)+txt((x1+x2)/2,y-6,label,DIMT,'middle');}
  function svg(w,h,inner){return '<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-height:440px;display:block;background:var(--card);border:1px solid var(--line);border-radius:12px">'+inner+'</svg>';}

  var GENS={
    'stage-plot': {
      label:'Stage plot', blurb:'Band on deck — positions, risers, monitor mixes. The advance sheet in one picture.',
      params:[
        {k:'width',label:'Stage width',type:'number',def:24,unit:'ft'},
        {k:'depth',label:'Stage depth',type:'number',def:16,unit:'ft'},
        {k:'band',label:'Act shape',type:'select',def:'4-piece',options:['solo','duo','3-piece','4-piece','5-piece','DJ']},
        {k:'riser',label:'Drum riser',type:'select',def:'yes',options:['yes','no']},
        {k:'mixes',label:'Monitor mixes',type:'number',def:4}
      ],
      draw:function(p){
        var wft=Math.max(12,+p.width||24), dft=Math.max(8,+p.depth||16);
        var band=p.band||'4-piece', riser=p.riser!=='no', mixes=Math.max(1,Math.min(8,+p.mixes||4));
        var W=760,H=500,pad=80;
        var sc=Math.min((W-pad*2)/wft,(H-170)/dft);
        var x0=(W-wft*sc)/2,y0=70,out='';
        out+=rect(x0,y0,wft*sc,dft*sc,'fill:var(--line2);stroke:var(--ink);stroke-width:2');
        function spot(fx,fy,label,big){
          var cx=x0+wft*sc*fx, cy=y0+dft*sc*fy;
          out+=circle(cx,cy,big?20:14,FILLL)+txt(cx,cy+4,label,'fill:var(--ink);font:700 '+(big?'11':'9.5')+'px Inter,system-ui,sans-serif','middle');
        }
        var plots={
          'solo':[[.5,.62,'VOX/GTR',1]],
          'duo':[[.38,.62,'VOX/GTR',1],[.62,.62,'GTR/KEY',1]],
          '3-piece':[[.5,.68,'VOX/GTR',1],[.25,.5,'BASS',1],[.5,.28,'DRUMS',1]],
          '4-piece':[[.5,.72,'VOX',1],[.22,.55,'GTR',1],[.78,.55,'BASS',1],[.5,.28,'DRUMS',1]],
          '5-piece':[[.5,.75,'VOX',1],[.2,.55,'GTR 1',1],[.8,.55,'BASS',1],[.35,.4,'KEYS',1],[.5,.26,'DRUMS',1]],
          'DJ':[[.5,.45,'DJ BOOTH',1]]
        };
        if(riser&&band!=='solo'&&band!=='duo'&&band!=='DJ'){
          out+=rect(x0+wft*sc*.36,y0+dft*sc*.16,wft*sc*.28,dft*sc*.2,'fill:var(--cream);stroke:var(--ink2);stroke-width:1.4;stroke-dasharray:6 4');
          out+=txt(x0+wft*sc*.5,y0+dft*sc*.145,"8'×8' DRUM RISER",'fill:var(--mut);font:600 9px Inter,system-ui,sans-serif','middle');
        }
        (plots[band]||plots['4-piece']).forEach(function(s2){spot(s2[0],s2[1],s2[2],s2[3]);});
        // monitors along DS edge
        for(var m=0;m<mixes;m++){ var mx=x0+wft*sc*((m+1)/(mixes+1)); out+='<path d="M '+r(mx-11)+' '+r(y0+dft*sc-6)+' L '+r(mx+11)+' '+r(y0+dft*sc-6)+' L '+r(mx)+' '+r(y0+dft*sc-20)+' Z" style="'+FILLL+'"/>'+txt(mx,y0+dft*sc+12,'mix '+(m+1),'fill:var(--mut);font:500 9px Inter,system-ui,sans-serif','middle'); }
        out+=txt(x0+wft*sc/2,y0+dft*sc+34,'▼  DOWNSTAGE / AUDIENCE  ▼','fill:var(--ink2);font:700 12px Inter,system-ui,sans-serif','middle');
        out+=dimH(x0,x0+wft*sc,y0-14,wft+"' wide");
        var inputs={'solo':6,'duo':10,'3-piece':16,'4-piece':20,'5-piece':26,'DJ':4}[band]||20;
        return { summary:band+' on a '+wft+"'×"+dft+"' deck · "+mixes+' monitor mixes',
          svg:svg(W,H,out),
          specs:[['Deck',wft+"' × "+dft+"'"],['Act',band],['Drum riser',riser?"8'×8' (typ.)":'none'],['Monitor mixes',String(mixes)],['Input estimate','~'+inputs+' channels (typ. for this shape)'],['Power','confirm distro with production advance']],
          notes:['PLANNING AID — the artist\'s own advance rider overrides everything on this sheet.','Confirm backline, riser and power needs in the advance call, in writing.'],
          flag:false };
      }
    },
    'settlement': {
      label:'Settlement scenarios', blurb:'Guarantee vs. door split — see break-even and both sides of the night.',
      params:[
        {k:'guarantee',label:'Artist guarantee',type:'number',def:1500,unit:'$'},
        {k:'price',label:'Ticket price',type:'number',def:25,unit:'$'},
        {k:'cap',label:'Sellable capacity',type:'number',def:350},
        {k:'expenses',label:'Show expenses (house)',type:'number',def:1200,unit:'$'},
        {k:'split',label:'Artist % after break-even',type:'select',def:'80',options:['70','75','80','85'],unit:'%'}
      ],
      draw:function(p){
        var g=Math.max(0,+p.guarantee||1500), price=Math.max(1,+p.price||25), cap=Math.max(10,+p.cap||350);
        var exp=Math.max(0,+p.expenses||1200), split=(+p.split||80)/100;
        var be=Math.ceil((g+exp)/price); // tickets to cover guarantee + expenses
        var W=760,H=500,pad=70,out='';
        var steps=[0.25,0.5,0.75,1.0];
        var barW=(W-pad*2)/steps.length-26;
        var maxGross=cap*price;
        steps.forEach(function(f,i){
          var sold=Math.round(cap*f), gross=sold*price;
          var over=Math.max(0,gross-g-exp);
          var artist=g+over*split, venue=gross-artist-exp;
          var x=pad+i*(barW+26);
          var hTot=(gross/maxGross)*(H-220);
          var y=H-90-hTot;
          var hArt=gross?hTot*(artist/gross):0, hExp=gross?hTot*(exp>gross?1:exp/gross):0;
          out+=rect(x,y,barW,hTot,'fill:var(--line2);stroke:var(--ink2);stroke-width:1');
          out+=rect(x,H-90-hArt,barW,hArt,'fill:var(--accent);opacity:.85');
          out+=rect(x,H-90-hArt-Math.min(hExp,hTot-hArt),barW,Math.min(hExp,hTot-hArt),'fill:var(--mut);opacity:.5');
          out+=txt(x+barW/2,y-24,Math.round(f*100)+'% sold ('+fmt(sold)+')','fill:var(--ink);font:700 12px Inter,system-ui,sans-serif','middle');
          out+=txt(x+barW/2,y-10,'gross '+money(gross),'fill:var(--mut);font:500 10px Inter,system-ui,sans-serif','middle');
          out+=txt(x+barW/2,H-72,'artist '+money(artist),'fill:var(--accent);font:700 11px Inter,system-ui,sans-serif','middle');
          out+=txt(x+barW/2,H-57,'venue '+(venue<0?'−'+money(-venue):money(venue)),'fill:'+(venue<0?'#b3401f':'var(--ink2)')+';font:600 11px Inter,system-ui,sans-serif','middle');
        });
        out+=txt(W/2,H-24,'Break-even: '+fmt(be)+' tickets ('+Math.round(be/cap*100)+'% of house) covers guarantee + expenses','fill:var(--ink);font:700 12.5px Inter,system-ui,sans-serif','middle');
        return { summary:'Break-even at '+fmt(be)+' tickets · artist '+Math.round(split*100)+'% after',
          svg:svg(W,H,out),
          specs:[['Guarantee',money(g)],['Ticket',money(price)],['Sellable house',fmt(cap)],['House expenses',money(exp)],['Break-even',fmt(be)+' tickets ('+Math.round(be/cap*100)+'% of house)'],['Sellout night','artist '+money(g+Math.max(0,maxGross-g-exp)*split)+' · venue '+money(maxGross-(g+Math.max(0,maxGross-g-exp)*split)-exp)]],
          notes:['PLANNING AID — NOT A SETTLEMENT DOCUMENT. Real settlements add taxes, fees, deductions and the deal memo\'s exact language; the accountant settles the night.','Numbers here are exactly what you typed — change the inputs to match the deal memo.'],
          flag:true };
      }
    }
  };
  return GENS;
})();
