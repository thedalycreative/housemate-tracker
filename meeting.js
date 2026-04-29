var MEETING_ID = "meeting-2026-04-29";

document.addEventListener("DOMContentLoaded", function () {
  loadSignatures();
});

function loadSignatures() {
  var saved = JSON.parse(localStorage.getItem("zj_sig_" + MEETING_ID) || "{}");
  ["tim", "darcy", "nessa"].forEach(function (id) {
    var input = document.getElementById("sign-" + id);
    var dateEl = document.getElementById("sign-" + id + "-date");
    if (saved[id] && input && dateEl) {
      input.value = saved[id].name;
      dateEl.textContent = "Signed: " + saved[id].date;
    }
  });
}

function saveSignatures() {
  var data = {};
  var anySigned = false;
  ["tim", "darcy", "nessa"].forEach(function (id) {
    var input = document.getElementById("sign-" + id);
    var dateEl = document.getElementById("sign-" + id + "-date");
    var name = input ? input.value.trim() : "";
    if (name) {
      var date = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
      data[id] = { name: name, date: date };
      if (dateEl) dateEl.textContent = "Signed: " + date;
      anySigned = true;
    }
  });
  localStorage.setItem("zj_sig_" + MEETING_ID, JSON.stringify(data));
  announce(anySigned ? "Signatures saved." : "No signatures to save - type a name in at least one box.");
}

function downloadAgreementPDF() {
  var element = document.getElementById("agreement-printable");
  if (!element) return;

  var inputs = element.querySelectorAll("input");
  var replacements = [];
  inputs.forEach(function (input) {
    var span = document.createElement("span");
    span.className = "pdf-signature-text";
    span.textContent = input.value || "(unsigned)";
    span.style.borderBottom = "1px solid #333";
    span.style.padding = "2px 8px";
    span.style.display = "inline-block";
    span.style.minWidth = "150px";
    input.style.display = "none";
    input.parentNode.insertBefore(span, input.nextSibling);
    replacements.push({ input: input, span: span });
  });

  var opt = {
    margin: 0.5,
    filename: "zebra-jukebox-agreement-2026-04-29.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save().then(function () {
    replacements.forEach(function (r) {
      r.input.style.display = "";
      r.span.remove();
    });
    announce("PDF downloaded.");
  });
}

function announce(msg) {
  var a = document.getElementById("sr-announce");
  if (a) {
    a.textContent = msg;
    setTimeout(function () { a.textContent = ""; }, 3000);
  }
}
