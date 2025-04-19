const form = document.getElementById("delivery-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form.checkValidity()) {
    const formData = new FormData(form);
    const deliveryDetails = {
      name: formData.get("name"),
      address: {
        street: formData.get("street"),
        city: formData.get("city"),
        state: formData.get("state"),
      },
      mobile: formData.get("mobile"),
      email: formData.get("email"),
    };
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    try {
      const response = await fetch("/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryDetails, cart }),
      });
      if (response.ok) {
        window.location.href = "/success.html";
      } else {
        const data = await response.json();
        alert(data.error || "Error placing order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order");
    }
  } else {
    alert("Please fill in all required fields");
  }
});
