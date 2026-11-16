/* Housemate Tracker — vanilla JS, data kept in localStorage.
   All people and events are fictional demo data. */
(function () {
  "use strict";

  var KEY = "housemate-tracker-v1";
  var PEOPLE = [
    { id: "priya",  name: "Priya",  color: "#191A23" },
    { id: "marcus", name: "Marcus", color: "#FF6B4A" },
    { id: "jo",     name: "Jo",     color: "#7B61FF" },
    { id: "sam",    name: "Sam",    color: "#1F8A70" }
  ];
  var CHORES = [
    { t: "Kitchen & benches", s: "Wipe down, mop, empty dishrack", c: "#FF6B4A" },
    { t: "Bathroom",          s: "Shower, toilet, mirror, floor",  c: "#7B61FF" },
    { t: "Lounge & hallway",  s: "Vacuum, dust, tidy shoes",       c: "#FFD166" },
    { t: "Bins & recycling",  s: "Out Tuesday night, rinse yellow", c: "#B9FF66" }
  ];
  var TYPES = {
    inspection: { label: "Inspection",   bg: "#B9FF66", fg: "#191A23" },
    tradie:     { label: "Tradie visit", bg: "#FFD166", fg: "#191A23" },
    bins:       { label: "Bin night",    bg: "#E2E2E2", fg: "#191A23" },
    rent:       { label: "Rent / bills", bg: "#191A23", fg: "#B9FF66" },
    social:     { label: "House social", bg: "#C9B8FF", fg: "#191A23" }
  };

  // ---------- date helpers ----------
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function monday(d) { var x = new Date(d); var k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); x.setHours(0, 0, 0, 0); return x; }
  function weekIndex(d) { return Math.floor(monday(d).getTime() / (7 * 864e5)); }
  function fmt(d, o) { return d.toLocaleDateString("en-AU", o || { day: "numeric", month: "short" }); }
  function money(n) { return "$" + Number(n).toFixed(2); }
  function person(id) { return PEOPLE.find(function (p) { return p.id === id; }); }

  // ---------- seed data (relative to today, so the demo never goes stale) ----------
  function seed() {
    var t = today(), all = PEOPLE.map(function (p) { return p.id; });
    var bills = [
      { desc: "Electricity — quarter", cat: "⚡ Power",    amount: 412.60, due: iso(addDays(t, 6)),  payer: "priya",  split: all, paid: ["priya", "jo"] },
      { desc: "NBN 100/20",            cat: "🌐 Internet", amount: 89.00,  due: iso(addDays(t, 2)),  payer: "marcus", split: all, paid: ["marcus", "sam", "priya"] },
      { desc: "Water usage",           cat: "💧 Water",    amount: 156.30, due: iso(addDays(t, 15)), payer: "jo",     split: all, paid: ["jo"] },
      { desc: "Cleaning supplies run", cat: "🧻 Supplies", amount: 48.75,  due: iso(addDays(t, -3)), payer: "sam",    split: ["sam", "priya", "marcus"], paid: ["sam", "priya", "marcus"] },
      { desc: "Gas — winter bill",     cat: "🔥 Gas",      amount: 131.20, due: iso(addDays(t, 11)), payer: "priya",  split: all, paid: ["priya"] }
    ];
    var w = weekIndex(t), done = {};
    done[w] = [0, 3];
    done[w - 1] = [0, 1, 2, 3];
    done[w - 2] = [0, 1, 3];
    var m = new Date(t.getFullYear(), t.getMonth(), 1), events = [];
    function ev(offsetFromToday, title, type, time) { events.push({ date: iso(addDays(t, offsetFromToday)), title: title, type: type, time: time || "" }); }
    ev(3, "Routine inspection — Banksia Realty", "inspection", "10:00");
    ev(-9, "Electrician — smoke alarm check", "tradie", "08:30");
    ev(1, "Plumber — leaking kitchen tap", "tradie", "13:00");
    ev(8, "Handyman — fix back gate latch", "tradie", "15:30");
    ev(17, "Gutter clean (landlord booked)", "tradie", "09:00");
    ev(-2, "House dinner — taco night", "social", "18:30");
    ev(12, "Movie night + pizza", "social", "19:00");
    ev(5, "Rent due ($2,280 / fortnight)", "rent");
    ev(19, "Rent due ($2,280 / fortnight)", "rent");
    ev(-9 + 0, "Rent due ($2,280 / fortnight)", "rent");
    // bin nights: every Tuesday this month and next
    for (var d = addDays(m, -7); d < addDays(m, 70); d = addDays(d, 1)) {
      if (d.getDay() === 2) events.push({ date: iso(d), title: (weekIndex(d) % 2 ? "Bins: general + recycling" : "Bins: general + green"), type: "bins", time: "19:00" });
    }
    return { bills: bills, done: done, events: events };
  }

  var state;
  function load() { try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; } if (!state) { state = seed(); save(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }

  // ---------- tiny DOM helper ----------
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "style") n.setAttribute("style", attrs[k]);
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    [].concat(kids == null ? [] : kids).forEach(function (c) { n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); });
    return n;
  }
  function av(p, small) { return h("span", { class: "av" + (small ? " sm" : ""), style: "background:" + p.color, title: p.name }, p.name[0]); }
  function fill(id, nodes) { var el = document.getElementById(id); el.textContent = ""; nodes.forEach(function (n) { el.appendChild(n); }); }
  function announce(msg) { var a = document.getElementById("sr-announce"); a.textContent = msg; }

  // ---------- money maths ----------
  function share(b) { return b.amount / b.split.length; }
  function netBalances() {
    var bal = {}; PEOPLE.forEach(function (p) { bal[p.id] = 0; });
    state.bills.forEach(function (b) {
      var s = share(b);
      b.split.forEach(function (id) {
        if (id === b.payer || b.paid.indexOf(id) > -1) return;
        bal[id] -= s; bal[b.payer] += s;
      });
    });
    return bal;
  }
  function settlements() {
    var bal = netBalances(), debtors = [], creditors = [], out = [];
    Object.keys(bal).forEach(function (id) {
      var v = Math.round(bal[id] * 100) / 100;
      if (v < 0) debtors.push({ id: id, v: -v }); else if (v > 0) creditors.push({ id: id, v: v });
    });
    debtors.sort(function (a, b) { return b.v - a.v; }); creditors.sort(function (a, b) { return b.v - a.v; });
    var i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      var x = Math.min(debtors[i].v, creditors[j].v);
      out.push({ from: debtors[i].id, to: creditors[j].id, amt: x });
      debtors[i].v -= x; creditors[j].v -= x;
      if (debtors[i].v < 0.01) i++; if (creditors[j].v < 0.01) j++;
    }
    return out;
  }
  function outstanding() {
    return state.bills.reduce(function (sum, b) {
      return sum + b.split.filter(function (id) { return id !== b.payer && b.paid.indexOf(id) < 0; }).length * share(b);
    }, 0);
  }

  // ---------- roster ----------
  var viewWeek = weekIndex(today());
  function assignee(choreIdx, w) { return PEOPLE[(choreIdx + w) % PEOPLE.length]; }
  function isDone(w, i) { return (state.done[w] || []).indexOf(i) > -1; }

  // ---------- render: overview ----------
  function renderOverview() {
    fill("avatars", PEOPLE.map(function (p) { return av(p); }));
    var t = today(), w = weekIndex(t);
    var upcoming = state.events.filter(function (e) { var d = parse(e.date); return d >= t && d <= addDays(t, 14); })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var choresDone = CHORES.filter(function (_, i) { return isDone(w, i); }).length;
    var stats = [
      ["Outstanding shares", money(outstanding())],
      ["Bills this month", String(state.bills.filter(function (b) { var d = parse(b.due); return d.getMonth() === t.getMonth(); }).length)],
      ["Chores done this week", choresDone + " / " + CHORES.length],
      ["Visitors next 14 days", String(upcoming.filter(function (e) { return e.type === "tradie" || e.type === "inspection"; }).length)]
    ];
    fill("stats", stats.map(function (s) { return h("div", { class: "stat" }, [h("div", { class: "k" }, s[0]), h("div", { class: "v" }, s[1])]); }));

    var st = settlements();
    fill("ov-balances", st.length ? st.map(function (s) {
      return h("li", {}, [av(person(s.from), true), h("span", { class: "grow" }, [person(s.from).name + " owes ", h("strong", {}, person(s.to).name)]), h("strong", {}, money(s.amt))]);
    }) : [h("li", {}, "All square — nobody owes anything 🎉")]);

    fill("ov-chores", CHORES.map(function (c, i) {
      var p = assignee(i, w), ok = isDone(w, i);
      return h("li", {}, [av(p, true), h("span", { class: "grow" }, [h("strong", {}, p.name), " — " + c.t]),
        h("span", { class: "pill", style: ok ? "background:#B9FF66;color:#191A23" : "background:#F3F3F3;color:#191A23" }, ok ? "Done" : "To do")]);
    }));

    fill("ov-upcoming", upcoming.slice(0, 6).map(function (e) {
      var ty = TYPES[e.type], d = parse(e.date);
      return h("li", {}, [h("span", { class: "pill", style: "background:" + ty.bg + ";color:" + ty.fg }, ty.label),
        h("span", { class: "grow" }, e.title), h("span", { class: "muted" }, fmt(d, { weekday: "short", day: "numeric", month: "short" }) + (e.time ? " · " + e.time : ""))]);
    }));
  }

  // ---------- render: bills ----------
  function renderBillForm() {
    fill("bill-payer", PEOPLE.map(function (p) { return h("option", { value: p.id }, p.name); }));
    fill("bill-split", PEOPLE.map(function (p) {
      return h("label", { class: "chip" }, [h("input", { type: "checkbox", name: "split", value: p.id, checked: "checked" }), av(p, true), p.name]);
    }));
  }
  function renderBills() {
    var st = settlements();
    fill("settle", st.length ? st.map(function (s) {
      return h("li", {}, [av(person(s.from), true), h("span", { class: "grow" }, person(s.from).name + " → " + person(s.to).name), h("strong", {}, money(s.amt))]);
    }) : [h("li", {}, "All square 🎉")]);

    var sorted = state.bills.map(function (b, i) { return { b: b, i: i }; }).sort(function (a, c) { return a.b.due.localeCompare(c.b.due); });
    fill("bill-list", sorted.map(function (o) {
      var b = o.b, s = share(b), owing = b.split.filter(function (id) { return id !== b.payer; });
      var paidCount = owing.filter(function (id) { return b.paid.indexOf(id) > -1; }).length;
      var pct = owing.length ? Math.round(paidCount / owing.length * 100) : 100;
      var due = parse(b.due), overdue = due < today() && pct < 100;
      return h("article", { class: "bill" + (pct === 100 ? " done" : "") }, [
        h("div", { class: "bill-top" }, [
          h("div", {}, [h("div", { class: "muted tiny" }, b.cat), h("strong", {}, b.desc)]),
          h("div", { class: "bill-amt" }, money(b.amount))
        ]),
        h("div", { class: "progress", "aria-label": pct + "% settled" }, h("span", { style: "width:" + pct + "%" })),
        h("div", { class: "shares" }, b.split.map(function (id) {
          var p = person(id), isPayer = id === b.payer, paid = isPayer || b.paid.indexOf(id) > -1;
          return h("button", {
            class: "share" + (paid ? " paid" : "") + (isPayer ? " payer" : ""), type: "button",
            "aria-pressed": String(paid), title: isPayer ? p.name + " paid upfront" : "Toggle " + p.name + "'s share",
            onclick: isPayer ? null : function () { togglePaid(o.i, id); }
          }, [av(p, true), p.name + " " + (isPayer ? "paid" : money(s)) + (paid && !isPayer ? " ✓" : "")]);
        })),
        h("div", { class: "bill-foot" }, [
          h("span", { style: overdue ? "color:var(--bad);font-weight:700" : "" }, (overdue ? "Overdue · " : "Due ") + fmt(due, { weekday: "short", day: "numeric", month: "short" })),
          h("button", { class: "icon-btn", type: "button", onclick: function () { removeBill(o.i); } }, "Remove")
        ])
      ]);
    }));
  }
  function togglePaid(i, id) {
    var b = state.bills[i], k = b.paid.indexOf(id);
    if (k > -1) b.paid.splice(k, 1); else b.paid.push(id);
    save(); renderAll(); announce(person(id).name + "'s share of " + b.desc + (k > -1 ? " marked unpaid" : " marked paid"));
  }
  function removeBill(i) { var d = state.bills[i].desc; state.bills.splice(i, 1); save(); renderAll(); announce("Removed " + d); }

  // ---------- render: roster ----------
  function renderRoster() {
    var mon = new Date(viewWeek * 7 * 864e5); mon = monday(addDays(mon, 3));
    document.getElementById("wk-label").textContent = "Week of " + fmt(mon, { day: "numeric", month: "short" }) + (viewWeek === weekIndex(today()) ? " (this week)" : "");
    fill("roster-grid", CHORES.map(function (c, i) {
      var p = assignee(i, viewWeek), ok = isDone(viewWeek, i);
      return h("div", { class: "chore", style: "--c:" + c.c }, [
        av(p), h("div", { class: "grow" }, [h("div", { class: "t" }, c.t), h("div", { class: "s" }, p.name + " · " + c.s)]),
        h("button", { class: "check" + (ok ? " on" : ""), type: "button", "aria-pressed": String(ok), "aria-label": "Mark " + c.t + (ok ? " not done" : " done"),
          onclick: function () { toggleChore(i); } }, ok ? "✓" : "")
      ]);
    }));
    // streaks over last 6 weeks
    var cur = weekIndex(today()), totals = {};
    PEOPLE.forEach(function (p) { totals[p.id] = 0; });
    for (var w = cur - 5; w <= cur; w++) CHORES.forEach(function (_, i) { if (isDone(w, i)) totals[assignee(i, w).id]++; });
    fill("streaks", PEOPLE.map(function (p) {
      var pct = Math.round(totals[p.id] / 6 * 100);
      return h("div", { class: "bar-row" }, [h("span", {}, p.name), h("div", { class: "bar" }, h("span", { style: "width:" + pct + "%;background:" + p.color })), h("span", { class: "muted" }, totals[p.id] + "/6")]);
    }));
  }
  function toggleChore(i) {
    var arr = state.done[viewWeek] = state.done[viewWeek] || [], k = arr.indexOf(i);
    if (k > -1) arr.splice(k, 1); else arr.push(i);
    save(); renderAll();
  }

  // ---------- render: calendar ----------
  var viewMonth = (function () { var t = today(); return new Date(t.getFullYear(), t.getMonth(), 1); })();
  function renderCalendar() {
    document.getElementById("m-label").textContent = viewMonth.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
    fill("legend", Object.keys(TYPES).map(function (k) { return h("span", { class: "pill", style: "background:" + TYPES[k].bg + ";color:" + TYPES[k].fg }, TYPES[k].label); }));
    var cells = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) { return h("div", { class: "dow" }, d); });
    var start = monday(viewMonth), t = iso(today());
    for (var i = 0; i < 42; i++) {
      var d = addDays(start, i), key = iso(d);
      if (i >= 35 && d.getMonth() !== viewMonth.getMonth()) break;
      var evs = state.events.filter(function (e) { return e.date === key; }).sort(function (a, b) { return a.time.localeCompare(b.time); });
      cells.push(h("div", { class: "day" + (d.getMonth() !== viewMonth.getMonth() ? " out" : "") + (key === t ? " today" : ""), role: "gridcell", "aria-label": fmt(d, { weekday: "long", day: "numeric", month: "long" }) + (evs.length ? ": " + evs.map(function (e) { return e.title; }).join(", ") : "") },
        [h("span", { class: "n" }, d.getDate())].concat(evs.map(function (e) {
          var ty = TYPES[e.type];
          return h("span", { class: "ev", style: "background:" + ty.bg + ";color:" + ty.fg, title: (e.time ? e.time + " · " : "") + e.title }, (e.time ? e.time + " " : "") + e.title);
        }))));
    }
    fill("cal", cells);
    fill("event-type", Object.keys(TYPES).map(function (k) { return h("option", { value: k }, TYPES[k].label); }));
  }

  // ---------- tabs ----------
  function show(tab) {
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("is-active", p.id === tab); });
    document.querySelectorAll(".tab").forEach(function (a) { var on = a.dataset.tab === tab; a.classList.toggle("is-active", on); a.setAttribute("aria-current", on ? "page" : "false"); });
    window.scrollTo({ top: 0 });
  }
  function route() { var t = (location.hash || "#overview").slice(1); show(["overview", "bills", "roster", "calendar"].indexOf(t) > -1 ? t : "overview"); }

  function renderAll() { renderOverview(); renderBills(); renderRoster(); renderCalendar(); }

  // ---------- wire up ----------
  document.addEventListener("DOMContentLoaded", function () {
    load(); renderBillForm(); renderAll(); route();
    window.addEventListener("hashchange", route);

    document.getElementById("bill-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, split = [].slice.call(f.querySelectorAll("input[name=split]:checked")).map(function (x) { return x.value; });
      if (!split.length) { announce("Pick at least one housemate to split with."); return; }
      if (split.indexOf(f.payer.value) < 0) split.unshift(f.payer.value);
      state.bills.push({ desc: f.desc.value.trim(), cat: f.cat.value, amount: parseFloat(f.amount.value), due: f.due.value, payer: f.payer.value, split: split, paid: [] });
      save(); f.reset(); renderBillForm(); renderAll(); announce("Bill added");
    });
    document.getElementById("event-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      state.events.push({ title: f.title.value.trim(), date: f.date.value, time: f.time.value, type: f.type.value });
      viewMonth = new Date(parse(f.date.value).getFullYear(), parse(f.date.value).getMonth(), 1);
      save(); f.reset(); renderAll(); announce("Event added");
    });
    document.getElementById("wk-prev").onclick = function () { viewWeek--; renderRoster(); };
    document.getElementById("wk-next").onclick = function () { viewWeek++; renderRoster(); };
    document.getElementById("m-prev").onclick = function () { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); renderCalendar(); };
    document.getElementById("m-next").onclick = function () { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); renderCalendar(); };
    var tt = document.getElementById("theme-toggle");
    function syncToggle() { var dark = document.documentElement.getAttribute("data-theme") === "dark"; tt.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode"); tt.setAttribute("aria-pressed", String(dark)); }
    tt.onclick = function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("ht-theme", next); } catch (e) {}
      syncToggle(); announce(next === "dark" ? "Dark mode on" : "Light mode on");
    };
    syncToggle();
    document.getElementById("reset").onclick = function () { state = seed(); save(); renderBillForm(); renderAll(); announce("Demo data reset"); };
  });
})();
