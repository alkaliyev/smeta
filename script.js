const itemsBody = document.querySelector("#items");
const itemTemplate = document.querySelector("#item-template");
const addItemButton = document.querySelector("#add-item");
const discountRate = document.querySelector("#discount-rate");
const vatRate = document.querySelector("#vat-rate");
const currency = document.querySelector("#currency");
const subtotalElement = document.querySelector("#subtotal");
const discountRow = document.querySelector("#discount-row");
const discountTotal = document.querySelector("#discount-total");
const discountedRow = document.querySelector("#discounted-row");
const discountedTotal = document.querySelector("#discounted-total");
const vatRow = document.querySelector("#vat-row");
const vatTotal = document.querySelector("#vat-total");
const grandTotal = document.querySelector("#grand-total");
const grandTotalWords = document.querySelector("#grand-total-words");
const estimateDate = document.querySelector("#estimate-date");
const estimateNumber = document.querySelector("#estimate-number");
const comment = document.querySelector("#comment");
const printEstimateButton = document.querySelector("#print-estimate");
const printEstimateNumber = document.querySelector("#print-estimate-number");
const printEstimateDate = document.querySelector("#print-estimate-date");
const printComment = document.querySelector("#print-comment");
const fromField = document.querySelector("#from");
const toField = document.querySelector("#to");
const newEstimateButton = document.querySelector("#new-estimate");
const copyWhatsappButton = document.querySelector("#copy-whatsapp");
const copyStatus = document.querySelector("#copy-status");
const manualCopy = document.querySelector("#manual-copy");
const manualCopyText = document.querySelector("#manual-copy-text");
const STORAGE_KEY = "smeta-draft-v1";
let copyStatusTimer;

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseNumber(value) {
  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");

  if (normalized === "") {
    return 0;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  const formatted = safeValue.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return `${formatted.replace(/[\u00a0\u202f]/g, " ")} ${currency.value}`;
}

function getWordForm(value, forms) {
  const lastTwoDigits = Math.abs(value) % 100;
  const lastDigit = lastTwoDigits % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
}

function numberToWords(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  const absoluteValue = Math.abs(safeValue);

  if (!Number.isSafeInteger(absoluteValue)) {
    return "сумма слишком велика";
  }

  if (absoluteValue === 0) {
    return "ноль";
  }

  const ones = [
    ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
    ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
  ];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
  const scales = [
    null,
    { forms: ["тысяча", "тысячи", "тысяч"], feminine: true },
    { forms: ["миллион", "миллиона", "миллионов"] },
    { forms: ["миллиард", "миллиарда", "миллиардов"] },
    { forms: ["триллион", "триллиона", "триллионов"] },
    { forms: ["квадриллион", "квадриллиона", "квадриллионов"] }
  ];
  const groups = [];
  let remainder = absoluteValue;

  while (remainder > 0) {
    groups.push(remainder % 1000);
    remainder = Math.floor(remainder / 1000);
  }

  const words = safeValue < 0 ? ["минус"] : [];

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (group === 0) {
      continue;
    }

    words.push(hundreds[Math.floor(group / 100)]);
    const lastTwoDigits = group % 100;

    if (lastTwoDigits >= 10 && lastTwoDigits <= 19) {
      words.push(teens[lastTwoDigits - 10]);
    } else {
      words.push(tens[Math.floor(lastTwoDigits / 10)]);
      words.push(ones[scales[index]?.feminine ? 1 : 0][lastTwoDigits % 10]);
    }

    if (index > 0) {
      words.push(getWordForm(group, scales[index].forms));
    }
  }

  return words.filter(Boolean).join(" ");
}

function formatMoneyInWords(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  const currencyForms = {
    "₸": ["тенге", "тенге", "тенге"],
    "₽": ["рубль", "рубля", "рублей"],
    "$": ["доллар", "доллара", "долларов"],
    "€": ["евро", "евро", "евро"]
  };
  const forms = currencyForms[currency.value] || ["единица", "единицы", "единиц"];
  const result = `${numberToWords(safeValue)} ${getWordForm(safeValue, forms)}`;

  return result.charAt(0).toUpperCase() + result.slice(1);
}

function formatNumber(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = safeValue.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return formatted.replace(/[\u00a0\u202f]/g, " ");
}

function formatDateForPrint(value) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return "—";
  }

  return `${day}.${month}.${year}`;
}

function updatePrintDocument() {
  printEstimateNumber.textContent = estimateNumber.value.trim() || "—";
  printEstimateDate.textContent = formatDateForPrint(estimateDate.value);
  printComment.textContent = comment.value.trim() || "—";
}

function calculateEstimate() {
  let subtotal = 0;

  itemsBody.querySelectorAll(".item-row").forEach((row) => {
    const quantity = parseNumber(row.querySelector(".item-quantity").value);
    const price = parseNumber(row.querySelector(".item-price").value);
    const rowTotal = quantity * price;
    subtotal += Number.isFinite(rowTotal) ? rowTotal : 0;
  });

  const roundedSubtotal = Math.round(subtotal);
  const safeDiscountRate = Math.max(0, parseNumber(discountRate.value));
  const safeVatRate = Math.max(0, parseNumber(vatRate.value));
  const discount = Math.round(roundedSubtotal * safeDiscountRate / 100);
  const afterDiscount = roundedSubtotal - discount;
  const vat = Math.round(afterDiscount * safeVatRate / 100);

  return {
    subtotal: roundedSubtotal,
    discountRate: safeDiscountRate,
    discount,
    afterDiscount,
    vatRate: safeVatRate,
    vat,
    total: afterDiscount + vat
  };
}

function updateTotals() {
  itemsBody.querySelectorAll(".item-row").forEach((row) => {
    const quantity = parseNumber(row.querySelector(".item-quantity").value);
    const price = parseNumber(row.querySelector(".item-price").value);
    const rowTotal = quantity * price;
    const safeRowTotal = Number.isFinite(rowTotal) ? rowTotal : 0;

    row.querySelector(".item-total").textContent = formatMoney(safeRowTotal);
  });

  const calculation = calculateEstimate();

  subtotalElement.textContent = formatMoney(calculation.subtotal);
  discountTotal.textContent = formatMoney(-calculation.discount);
  discountedTotal.textContent = formatMoney(calculation.afterDiscount);
  vatTotal.textContent = formatMoney(calculation.vat);
  grandTotal.textContent = formatMoney(calculation.total);
  grandTotalWords.textContent = formatMoneyInWords(calculation.total);

  const hasDiscount = calculation.discount !== 0;
  discountRow.hidden = !hasDiscount;
  discountedRow.hidden = !hasDiscount;
  vatRow.hidden = calculation.vat === 0;
}

function addItem({ focus = true, item = {} } = {}) {
  const fragment = itemTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".item-row");
  const safeItem = item && typeof item === "object" ? item : {};

  row.querySelector(".item-name").value = safeItem.name || "";
  row.querySelector(".item-quantity").value = safeItem.quantity || "";
  row.querySelector(".item-price").value = safeItem.price || "";

  const unit = row.querySelector(".item-unit");
  if ([...unit.options].some((option) => option.value === safeItem.unit)) {
    unit.value = safeItem.unit;
  }

  itemsBody.append(fragment);
  updateTotals();

  if (focus) {
    row.querySelector(".item-name").focus();
  }
}

function getDraft() {
  return {
    from: fromField.value,
    to: toField.value,
    number: estimateNumber.value,
    date: estimateDate.value,
    discountRate: discountRate.value,
    vatRate: vatRate.value,
    currency: currency.value,
    comment: comment.value,
    items: [...itemsBody.querySelectorAll(".item-row")].map((row) => ({
      name: row.querySelector(".item-name").value,
      quantity: row.querySelector(".item-quantity").value,
      unit: row.querySelector(".item-unit").value,
      price: row.querySelector(".item-price").value
    }))
  };
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDraft()));
  } catch (error) {
    // Приложение продолжает работать, даже если браузер запретил localStorage.
  }
}

function restoreDraft() {
  try {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (!savedDraft) {
      return false;
    }

    const draft = JSON.parse(savedDraft);
    fromField.value = draft.from || "";
    toField.value = draft.to || "";
    estimateNumber.value = draft.number || "";
    estimateDate.value = draft.date || getToday();
    discountRate.value = draft.discountRate ?? "0";
    vatRate.value = draft.vatRate ?? "0";
    comment.value = draft.comment || "";

    if ([...currency.options].some((option) => option.value === draft.currency)) {
      currency.value = draft.currency;
    }

    itemsBody.replaceChildren();
    const savedItems = Array.isArray(draft.items) ? draft.items : [];
    if (savedItems.length) {
      savedItems.forEach((item) => addItem({ focus: false, item }));
    } else {
      addItem({ focus: false });
    }

    return true;
  } catch (error) {
    return false;
  }
}

function getNextEstimateNumber(value) {
  const currentNumber = value.trim();

  if (!/^\d+$/.test(currentNumber)) {
    return "1";
  }

  const nextNumber = String(Number(currentNumber) + 1);
  return currentNumber.startsWith("0")
    ? nextNumber.padStart(currentNumber.length, "0")
    : nextNumber;
}

function resetEstimate() {
  const nextNumber = getNextEstimateNumber(estimateNumber.value);

  fromField.value = "";
  toField.value = "";
  estimateNumber.value = nextNumber;
  estimateDate.value = getToday();
  discountRate.value = "0";
  vatRate.value = "0";
  currency.value = "₸";
  comment.value = "";
  itemsBody.replaceChildren();
  addItem({ focus: false });
  manualCopy.hidden = true;
  copyStatus.hidden = true;
  updateTotals();
  updatePrintDocument();
  saveDraft();
  fromField.focus();
}

function buildWhatsappText() {
  const calculation = calculateEstimate();
  const number = estimateNumber.value.trim() || "—";
  const date = formatDateForPrint(estimateDate.value);
  const lines = [`Смета № ${number} от ${date}`, ""];

  itemsBody.querySelectorAll(".item-row").forEach((row) => {
    const name = row.querySelector(".item-name").value.trim();
    const quantityValue = row.querySelector(".item-quantity").value;
    const priceValue = row.querySelector(".item-price").value;
    const quantity = parseNumber(quantityValue);
    const price = parseNumber(priceValue);

    if (!name && !quantityValue.trim() && !priceValue.trim()) {
      return;
    }

    const unit = row.querySelector(".item-unit").value;
    lines.push(`• ${name || "Без наименования"} — ${formatNumber(quantity)} ${unit} × ${formatMoney(price)} = ${formatMoney(quantity * price)}`);
  });

  if (calculation.discount !== 0) {
    lines.push(`Скидка ${formatNumber(calculation.discountRate)} %: ${formatMoney(-calculation.discount)}`);
  }

  if (calculation.vat !== 0) {
    lines.push(`НДС ${formatNumber(calculation.vatRate)} %: ${formatMoney(calculation.vat)}`);
  }

  lines.push(`Итого к оплате: ${formatMoney(calculation.total)}`);
  lines.push(`Сумма прописью: ${formatMoneyInWords(calculation.total)}`);
  return lines.join("\n");
}

function showCopySuccess() {
  clearTimeout(copyStatusTimer);
  copyStatus.hidden = false;
  copyStatusTimer = setTimeout(() => {
    copyStatus.hidden = true;
  }, 2000);
}

function showManualCopy(text) {
  copyStatus.hidden = true;
  manualCopyText.value = text;
  manualCopy.hidden = false;
  manualCopyText.focus();
  manualCopyText.select();
}

async function copyForWhatsapp() {
  const text = buildWhatsappText();
  manualCopy.hidden = true;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      manualCopyText.value = text;
      manualCopy.hidden = false;
      manualCopyText.select();

      if (!document.execCommand?.("copy")) {
        throw new Error("Копирование недоступно");
      }

      manualCopy.hidden = true;
    }

    showCopySuccess();
  } catch (error) {
    showManualCopy(text);
  }
}

itemsBody.addEventListener("input", (event) => {
  if (event.target.matches(".item-quantity, .item-price")) {
    updateTotals();
  }
});

itemsBody.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-button");

  if (!removeButton) {
    return;
  }

  removeButton.closest(".item-row").remove();

  if (!itemsBody.querySelector(".item-row")) {
    addItem();
  } else {
    updateTotals();
  }

  saveDraft();
});

itemsBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  const currentRow = event.target.closest(".item-row");
  const lastRow = itemsBody.lastElementChild;

  if (currentRow && currentRow === lastRow) {
    event.preventDefault();
    addItem();
    saveDraft();
  }
});

addItemButton.addEventListener("click", () => {
  addItem();
  saveDraft();
});
discountRate.addEventListener("input", updateTotals);
vatRate.addEventListener("input", updateTotals);
currency.addEventListener("change", updateTotals);
document.addEventListener("input", saveDraft);
document.addEventListener("change", saveDraft);
newEstimateButton.addEventListener("click", () => {
  if (window.confirm("Создать новую смету? Текущий черновик будет очищен.")) {
    resetEstimate();
  }
});
copyWhatsappButton.addEventListener("click", copyForWhatsapp);
printEstimateButton.addEventListener("click", () => {
  updatePrintDocument();
  window.print();
});
window.addEventListener("beforeprint", updatePrintDocument);

if (!restoreDraft()) {
  estimateDate.value = getToday();
  addItem({ focus: false });
}

updateTotals();
updatePrintDocument();
saveDraft();
