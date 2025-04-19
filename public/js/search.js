// Search functionality
const searchIcon = document.getElementById("search-icon");
const searchBox = document.getElementById("search-box");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchHints = document.getElementById("search-hints");
const closeSearch = document.getElementById("close-search");

if (
  searchIcon &&
  searchBox &&
  searchInput &&
  searchResults &&
  searchHints &&
  closeSearch
) {
  searchIcon.addEventListener("click", () => {
    searchBox.style.display =
      searchBox.style.display === "none" ? "block" : "none";
  });

  closeSearch.addEventListener("click", () => {
    searchBox.style.display = "none";
  });

  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    if (query === "") {
      searchHints.style.display = "block";
      searchResults.innerHTML = "";
    } else {
      searchHints.style.display = "none";
      try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const products = await response.json();
        renderSearchResults(products);
      } catch (error) {
        console.error("Error searching products:", error);
      }
    }
  });

  function renderSearchResults(products) {
    if (products.length === 0) {
      searchResults.innerHTML = "<p>No products found.</p>";
    } else {
      searchResults.innerHTML = products
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
      const addToCartButtons =
        searchResults.getElementsByClassName("add-to-cart");
      for (let i = 0; i < addToCartButtons.length; i++) {
        const button = addToCartButtons[i];
        if (!button.classList.contains("unavailable")) {
          button.addEventListener("click", addToCart);
        }
      }
    }
  }
}

// Hide search icon on excluded pages
const excludedPages = [
  "cart.html",
  "delivery.html",
  "success.html",
  "cancel.html",
];
if (
  searchIcon &&
  excludedPages.some((page) => window.location.pathname.includes(page))
) {
  searchIcon.style.display = "none";
}
