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
const estimateDate = document.querySelector("#estimate-date");

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

function updateTotals() {
  let subtotal = 0;

  itemsBody.querySelectorAll(".item-row").forEach((row) => {
    const quantity = parseNumber(row.querySelector(".item-quantity").value);
    const price = parseNumber(row.querySelector(".item-price").value);
    const rowTotal = quantity * price;
    const safeRowTotal = Number.isFinite(rowTotal) ? rowTotal : 0;

    row.querySelector(".item-total").textContent = formatMoney(safeRowTotal);
    subtotal += safeRowTotal;
  });

  const roundedSubtotal = Math.round(subtotal);
  const safeDiscountRate = Math.max(0, parseNumber(discountRate.value));
  const safeVatRate = Math.max(0, parseNumber(vatRate.value));
  const discount = Math.round(roundedSubtotal * safeDiscountRate / 100);
  const afterDiscount = roundedSubtotal - discount;
  const vat = Math.round(afterDiscount * safeVatRate / 100);
  const total = afterDiscount + vat;

  subtotalElement.textContent = formatMoney(roundedSubtotal);
  discountTotal.textContent = formatMoney(-discount);
  discountedTotal.textContent = formatMoney(afterDiscount);
  vatTotal.textContent = formatMoney(vat);
  grandTotal.textContent = formatMoney(total);

  const hasDiscount = discount !== 0;
  discountRow.hidden = !hasDiscount;
  discountedRow.hidden = !hasDiscount;
  vatRow.hidden = vat === 0;
}

function addItem({ focus = true } = {}) {
  const fragment = itemTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".item-row");

  itemsBody.append(fragment);
  updateTotals();

  if (focus) {
    row.querySelector(".item-name").focus();
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
  }
});

addItemButton.addEventListener("click", () => addItem());
discountRate.addEventListener("input", updateTotals);
vatRate.addEventListener("input", updateTotals);
currency.addEventListener("change", updateTotals);

estimateDate.value = getToday();
addItem({ focus: false });
