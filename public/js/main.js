let header = document.querySelector("header");
let categories = [];

window.addEventListener("scroll", () => {
  header.classList.toggle("shadow", window.scrollY > 0);
});

let cart = JSON.parse(localStorage.getItem("cart")) || [];

async function renderCategories() {
  try {
    const response = await fetch("/categories");
    categories = await response.json();
    const categoriesRow = document.getElementById("categoriesRow");
    if (categoriesRow) {
      categoriesRow.innerHTML = categories
        .map(
          (category) => `
        <button class="category-btn" data-category="${category.name}">${category.name}</button>
      `
        )
        .join("");
      const categoryButtons = categoriesRow.querySelectorAll(".category-btn");
      categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const category = button.dataset.category;
          categoryButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
          renderSubcategories(category);
          fetchProducts(category);
          updateFilterDisplay(category);
        });
      });
      const clearFilter = document.getElementById("clear-filter");
      clearFilter.addEventListener("click", () => {
        categoryButtons.forEach((btn) => btn.classList.remove("active"));
        const subcategoryButtons =
          document.querySelectorAll(".subcategory-btn");
        subcategoryButtons.forEach((btn) => btn.classList.remove("active"));
        document.getElementById("subcategoriesRow").style.display = "none";
        fetchProducts();
        updateFilterDisplay();
      });
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

function renderSubcategories(category) {
  const subcategoriesRow = document.getElementById("subcategoriesRow");
  if (subcategoriesRow) {
    const selectedCategory = categories.find((cat) => cat.name === category);
    if (selectedCategory && selectedCategory.subcategories.length > 0) {
      subcategoriesRow.innerHTML = selectedCategory.subcategories
        .map(
          (sub) => `
        <button class="subcategory-btn" data-category="${category}" data-subcategory="${sub}">${sub}</button>
      `
        )
        .join("");
      subcategoriesRow.style.display = "flex";
      const subcategoryButtons =
        subcategoriesRow.querySelectorAll(".subcategory-btn");
      subcategoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const subcategory = button.dataset.subcategory;
          subcategoryButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
          fetchProducts(category, subcategory);
          updateFilterDisplay(category, subcategory);
        });
      });
    } else {
      subcategoriesRow.style.display = "none";
    }
  }
}

function updateFilterDisplay(category = null, subcategory = null) {
  const currentFilter = document.getElementById("current-filter");
  const clearFilter = document.getElementById("clear-filter");
  if (subcategory) {
    currentFilter.textContent = `${category} > ${subcategory}`;
    clearFilter.style.display = "inline";
  } else if (category) {
    currentFilter.textContent = category;
    clearFilter.style.display = "inline";
  } else {
    currentFilter.textContent = "";
    clearFilter.style.display = "none";
  }
}

async function fetchProducts(category = null, subcategory = null) {
  try {
    let url = "/products";
    if (category || subcategory) {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (subcategory) params.append("subcategory", subcategory);
      url += `?${params.toString()}`;
    }
    const response = await fetch(url);
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function renderProducts(products) {
  const productList = document.getElementById("productList");
  if (productList) {
    if (products.length === 0) {
      productList.innerHTML = "<p>No product found.</p>";
    } else {
      productList.innerHTML = products
        .map(
          (product) => `
        <div class="product">
          <img src="${product.image}" alt="${
            product.title
          }" class="product-img" />
          <div class="product-info">
            <h2 class="product-title">${product.title}</h2>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <p class="product-stock">${
              product.stock > 0 ? "In Stock" : "Out of Stock"
            }</p>
            ${
              product.stock > 0
                ? `<a class="add-to-cart" data-id="${product.id}">Add to cart</a>`
                : `<a class="add-to-cart unavailable" data-id="${product.id}">Out of stock</a>`
            }
          </div>
        </div>
      `
        )
        .join("");
      const addToCartButtons = document.getElementsByClassName("add-to-cart");
      for (let i = 0; i < addToCartButtons.length; i++) {
        const button = addToCartButtons[i];
        if (!button.classList.contains("unavailable")) {
          button.addEventListener("click", addToCart);
        }
      }
    }
  }
}

function showToast(message) {
  const toastContainer = document.getElementById("toast-container");
  if (toastContainer) {
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3000);
  }
}

function addToCart(event) {
  const productID = parseInt(event.target.dataset.id);
  fetch(`/products?id=${productID}`)
    .then((response) => response.json())
    .then((products) => {
      const product = products.find((p) => p.id === productID);
      if (product && product.stock > 0) {
        const existingItem = cart.find((item) => item.id === productID);
        if (existingItem) {
          if (existingItem.quantity + 1 <= product.stock) {
            existingItem.quantity++;
            event.target.textContent = "Added";
          } else {
            showToast(
              `Cannot add more ${product.title}. Only ${product.stock} in stock.`
            );
            return;
          }
        } else {
          const cartItem = {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1,
          };
          cart.push(cartItem);
          event.target.textContent = "Added";
        }
        updateCartIcon();
        saveToLocalStorage();
        renderCartItems();
        calculateCartTotal();
      }
    });
}

function removeFromCart(event) {
  const productID = parseInt(event.target.dataset.id);
  cart = cart.filter((item) => item.id !== productID);
  saveToLocalStorage();
  renderCartItems();
  calculateCartTotal();
  updateCartIcon();
  if (typeof updateCheckoutButton === "function") {
    updateCheckoutButton();
  }
}

function changeQuantity(event) {
  const productID = parseInt(event.target.dataset.id);
  const quantity = parseInt(event.target.value);
  fetch(`/products?id=${productID}`)
    .then((response) => response.json())
    .then((products) => {
      const product = products.find((p) => p.id === productID);
      const cartItem = cart.find((item) => item.id === productID);
      if (cartItem && product && quantity > 0) {
        if (quantity <= product.stock) {
          cartItem.quantity = quantity;
          saveToLocalStorage();
          calculateCartTotal();
          updateCartIcon();
          if (typeof updateCheckoutButton === "function") {
            updateCheckoutButton();
          }
        } else {
          showToast(
            `Cannot set quantity to ${quantity}. Only ${product.stock} ${product.title} in stock.`
          );
          event.target.value = cartItem.quantity;
        }
      } else if (quantity <= 0) {
        event.target.value = cartItem.quantity;
      }
    });
}

function saveToLocalStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCartItems() {
  const cartItemsElement = document.getElementById("cartItems");
  if (cartItemsElement) {
    cartItemsElement.innerHTML = cart
      .map(
        (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.title}" />
          <div class="cart-item-info">
            <h2 class="cart-item-title">${item.title}</h2>
            <input
              class="cart-item-quantity"
              type="number"
              name=""
              min="1"
              value="${item.quantity}"
              data-id="${item.id}"
            />
          </div>
          <h2 class="cart-item-price">$${item.price}</h2>
          <button class="remove-from-cart" data-id="${item.id}">Remove</button>
        </div>
      `
      )
      .join("");
    const removeButtons = document.getElementsByClassName("remove-from-cart");
    for (let i = 0; i < removeButtons.length; i++) {
      const removeButton = removeButtons[i];
      removeButton.addEventListener("click", removeFromCart);
    }
    const quantityInputs = document.querySelectorAll(".cart-item-quantity");
    quantityInputs.forEach((input) => {
      input.addEventListener("change", changeQuantity);
    });
  }
}

function calculateCartTotal() {
  const cartTotalElement = document.getElementById("cartTotal");
  if (cartTotalElement) {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cartTotalElement.textContent = `Total: $${total.toFixed(2)}`;
  }
}

if (window.location.pathname.includes("cart.html")) {
  renderCartItems();
  calculateCartTotal();
} else if (window.location.pathname.includes("success.html")) {
  clearCart();
} else {
  renderCategories();
  fetchProducts();
}

function clearCart() {
  cart = [];
  saveToLocalStorage();
  updateCartIcon();
}

function updateCartIcon() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartIcon = document.getElementById("cart-icon");
  if (cartIcon) {
    cartIcon.setAttribute("data-quantity", totalQuantity);
  }
}

updateCartIcon();
