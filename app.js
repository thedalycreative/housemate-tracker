document.addEventListener("DOMContentLoaded", function () {
  loadBills();
  loadNoticeboard();
  loadMeetings();
});

// --- DOM helpers ---

function el(tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === "className") node.className = attrs[k];
      else if (k === "onclick") node.addEventListener("click", attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
  }
  if (typeof children === "string") node.textContent = children;
  else if (Array.isArray(children)) children.forEach(function (c) { if (c) node.appendChild(c); });
  return node;
}

function announce(msg) {
  var a = document.getElementById("sr-announce");
  if (a) { a.textContent = msg; setTimeout(function () { a.textContent = ""; }, 3000); }
}

// --- Bills ---

function loadBills() {
  var bills = JSON.parse(localStorage.getItem("zj_bills") || "[]");
  var tbody = document.getElementById("bills-body");
  if (!tbody) return;
  tbody.textContent = "";
  bills.forEach(function (bill, i) {
    var tr = el("tr", bill.paid ? { className: "bill-paid" } : {}, [
      el("td", {}, bill.desc),
      el("td", {}, "$" + bill.amount),
      el("td", {}, bill.due),
      el("td", {}, bill.who),
      el("td", {}, [
        el("button", {
          className: "btn btn-sm btn-outline-zj me-1",
          "aria-label": "Mark " + (bill.paid ? "unpaid" : "paid"),
          onclick: function () { toggleBill(i); }
        }, bill.paid ? "Undo" : "Paid"),
        el("button", {
          className: "btn btn-sm btn-outline-danger",
          "aria-label": "Remove bill",
          onclick: function () { removeBill(i); }
        }, "Remove")
      ])
    ]);
    tbody.appendChild(tr);
  });
}

function addBill() {
  var desc = document.getElementById("bill-desc").value.trim();
  var amount = document.getElementById("bill-amount").value.trim();
  var due = document.getElementById("bill-due").value;
  var who = document.getElementById("bill-who").value.trim();
  if (!desc || !amount) { announce("Please fill in description and amount."); return; }
  var bills = JSON.parse(localStorage.getItem("zj_bills") || "[]");
  bills.push({ desc: desc, amount: amount, due: due, who: who, paid: false });
  localStorage.setItem("zj_bills", JSON.stringify(bills));
  document.getElementById("bill-desc").value = "";
  document.getElementById("bill-amount").value = "";
  document.getElementById("bill-due").value = "";
  document.getElementById("bill-who").value = "";
  loadBills();
  announce("Bill added: " + desc);
}

function toggleBill(i) {
  var bills = JSON.parse(localStorage.getItem("zj_bills") || "[]");
  bills[i].paid = !bills[i].paid;
  localStorage.setItem("zj_bills", JSON.stringify(bills));
  loadBills();
}

function removeBill(i) {
  var bills = JSON.parse(localStorage.getItem("zj_bills") || "[]");
  var name = bills[i].desc;
  bills.splice(i, 1);
  localStorage.setItem("zj_bills", JSON.stringify(bills));
  loadBills();
  announce("Bill removed: " + name);
}

// --- Noticeboard ---

function loadNoticeboard() {
  var posts = JSON.parse(localStorage.getItem("zj_notices") || "[]");
  var container = document.getElementById("notices-list");
  if (!container) return;
  container.textContent = "";
  if (posts.length === 0) {
    container.appendChild(el("p", { className: "text-muted" }, "No notices yet. Post one above."));
    return;
  }
  posts.forEach(function (post, i) {
    var div = el("div", { className: "noticeboard-post", role: "article" }, [
      el("div", { className: "d-flex justify-content-between align-items-start" }, [
        el("div", {}, [
          el("strong", {}, post.from),
          el("span", { className: "post-meta ms-2" }, post.date),
          el("p", { className: "mb-0 mt-1" }, post.msg)
        ]),
        el("button", {
          className: "btn btn-sm btn-outline-danger ms-2",
          "aria-label": "Remove notice from " + post.from,
          onclick: function () { removeNotice(i); }
        }, "X")
      ])
    ]);
    container.appendChild(div);
  });
}

function addNotice() {
  var from = document.getElementById("notice-from").value.trim();
  var msg = document.getElementById("notice-msg").value.trim();
  if (!from || !msg) { announce("Please fill in your name and message."); return; }
  var posts = JSON.parse(localStorage.getItem("zj_notices") || "[]");
  var now = new Date();
  posts.unshift({
    from: from,
    msg: msg,
    date: now.toLocaleDateString("en-AU") + " " + now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
  });
  localStorage.setItem("zj_notices", JSON.stringify(posts));
  document.getElementById("notice-msg").value = "";
  loadNoticeboard();
  announce("Notice posted by " + from);
}

function removeNotice(i) {
  var posts = JSON.parse(localStorage.getItem("zj_notices") || "[]");
  posts.splice(i, 1);
  localStorage.setItem("zj_notices", JSON.stringify(posts));
  loadNoticeboard();
  announce("Notice removed.");
}

// --- Meetings ---

function loadMeetings() {
  var meetings = JSON.parse(localStorage.getItem("zj_meetings") || "[]");
  var container = document.getElementById("meetings-list");
  if (!container) return;
  container.textContent = "";
  if (meetings.length === 0) {
    container.appendChild(el("p", { className: "text-muted" }, "No meetings recorded yet."));
    return;
  }
  meetings.forEach(function (mtg, i) {
    var sigBadges = ["Tim", "D'Arcy", "Nessa"].map(function (name) {
      var sig = mtg.signatures[name];
      return el("span", {
        className: sig ? "badge bg-success me-1" : "badge bg-warning text-dark me-1"
      }, name + " - " + (sig || "unsigned"));
    });

    var card = el("div", { className: "card mb-3" }, [
      el("div", { className: "card-body" }, [
        el("h4", { className: "card-title" }, "Meeting: " + mtg.date),
        el("h5", {}, "Agreements"),
        el("p", { style: "white-space:pre-wrap" }, mtg.agreements),
        el("h5", {}, "Signatures"),
        el("div", { className: "mb-2" }, sigBadges),
        el("button", {
          className: "btn btn-sm btn-outline-danger",
          onclick: function () { removeMeeting(i); }
        }, "Delete meeting")
      ])
    ]);
    container.appendChild(card);
  });
}

function saveMeeting() {
  var date = document.getElementById("meeting-date").value;
  var agreements = document.getElementById("meeting-agreements").value.trim();
  if (!date || !agreements) { announce("Please set a date and enter agreements."); return; }

  var signatures = {};
  var allSigned = true;
  [["Tim", "sig-Tim"], ["D'Arcy", "sig-DArcy"], ["Nessa", "sig-Nessa"]].forEach(function (pair) {
    var cb = document.getElementById(pair[1]);
    if (cb && cb.checked) {
      signatures[pair[0]] = new Date().toLocaleDateString("en-AU");
    } else {
      allSigned = false;
    }
  });

  if (!allSigned) { announce("All three housemates must agree before saving."); return; }

  var meetings = JSON.parse(localStorage.getItem("zj_meetings") || "[]");
  meetings.unshift({ date: date, agreements: agreements, signatures: signatures });
  localStorage.setItem("zj_meetings", JSON.stringify(meetings));

  document.getElementById("meeting-date").value = "";
  document.getElementById("meeting-agreements").value = "";
  ["sig-Tim", "sig-DArcy", "sig-Nessa"].forEach(function (id) {
    var cb = document.getElementById(id);
    if (cb) cb.checked = false;
  });

  loadMeetings();
  announce("Meeting saved with all signatures.");
}

function removeMeeting(i) {
  var meetings = JSON.parse(localStorage.getItem("zj_meetings") || "[]");
  meetings.splice(i, 1);
  localStorage.setItem("zj_meetings", JSON.stringify(meetings));
  loadMeetings();
  announce("Meeting removed.");
}
