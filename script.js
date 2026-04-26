const file = document.getElementById("file");
const list = document.getElementById("list");
const bar = document.getElementById("bar");
const status = document.getElementById("status");
const downloads = document.getElementById("downloads");
const dropzone = document.getElementById("dropzone");

/* CLICK UPLOAD */
dropzone.addEventListener("click", () => file.click());

/* DRAG */
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  file.files = e.dataTransfer.files;
  showFiles();
});

/* SHOW FILES */
file.addEventListener("change", showFiles);

function showFiles() {
  list.innerHTML = "";
  [...file.files].forEach(f => {
    const div = document.createElement("div");
    div.className = "file";
    div.innerText = "📄 " + f.name;
    list.appendChild(div);
  });
}

/* PROGRESS */
function progress(v, text) {
  bar.style.width = v + "%";
  status.innerText = text;
}

/* NAME */
function getName(f) {
  return f.name.split(".")[0];
}

/* IMAGE → PDF */
function toPDF() {
  const files = [...file.files];
  if (!files.length) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let done = 0;

  files.forEach((f, i) => {
    const r = new FileReader();

    r.onload = e => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        if (i !== 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 10, 10, 180, 150);

        done++;
        progress((done / files.length) * 100, "Converting...");

        if (done === files.length) {
          pdf.save(getName(files[0]) + ".pdf");
          progress(100, "Done ✔");
        }
      }
    }

    r.readAsDataURL(f);
  });
}

/* COMPRESS */
function compress() {
  const files = [...file.files];
  if (!files.length) return;

  downloads.innerHTML = "";
  let done = 0;

  files.forEach(f => {
    const r = new FileReader();

    r.onload = e => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");

        c.width = img.width / 2;
        c.height = img.height / 2;

        ctx.drawImage(img, 0, 0, c.width, c.height);

        c.toBlob(b => {
          const url = URL.createObjectURL(b);

          const a = document.createElement("a");
          a.href = url;
          a.download = getName(f) + "_Compressed.jpg";
          a.innerText = "⬇ Download " + f.name;

          downloads.appendChild(a);

          done++;
          progress((done / files.length) * 100, "Compressing...");
        }, "image/jpeg", 0.6);
      }
    }

    r.readAsDataURL(f);
  });
}

/* PDF → TEXT */
async function pdfText() {
  const f = file.files[0];
  if (!f) return;

  const r = new FileReader();

  r.onload = async function () {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      content.items.forEach(t => text += t.str + " ");

      progress((i / pdf.numPages) * 100, "Extracting...");
    }

    const blob = new Blob([text]);
    const url = URL.createObjectURL(blob);

    downloads.innerHTML = "";

    const a = document.createElement("a");
    a.href = url;
    a.download = getName(f) + ".txt";
    a.innerText = "⬇ Download Text File";

    downloads.appendChild(a);
  }

  r.readAsArrayBuffer(f);
}