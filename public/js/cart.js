const payBtn = document.querySelector(".checkout-btn");
const clearCartButton = document.getElementById("clear-cart");

function updateCheckoutButton() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    payBtn.classList.add("disabled"); // Use class for styling
    payBtn.style.backgroundColor = "grey";
    payBtn.style.cursor = "not-allowed";
    if (payBtn.tagName.toLowerCase() === "button") {
      payBtn.disabled = true; // Disable if it’s a button
    }
  } else {
    payBtn.classList.remove("disabled");
    payBtn.style.backgroundColor = ""; // Reset to default
    payBtn.style.cursor = "";
    if (payBtn.tagName.toLowerCase() === "button") {
      payBtn.disabled = false;
    }
  }
}

// Initial check
updateCheckoutButton();

if (clearCartButton) {
  clearCartButton.addEventListener("click", () => {
    cart = []; // Note: Define 'cart' with let/const here if not global
    localStorage.setItem("cart", JSON.stringify(cart)); // Assuming saveToLocalStorage() does this
    renderCartItems();
    calculateCartTotal();
    updateCartIcon();
    updateCheckoutButton();
  });
}

payBtn.addEventListener("click", (event) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length > 0) {
    window.location.href = "/delivery.html";
  } else {
    event.preventDefault(); // Prevent redirect if cart is empty (useful for links)
  }
});
