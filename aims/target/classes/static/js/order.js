/* Enhanced order.js with proper VNPay integration and rush order handling */

// Global variables
let sessionId =
  localStorage.getItem("sessionId") ||
  "guest_" + Math.random().toString(36).substr(2, 9);
let cart = [];
let isRushOrderSelected = false;

document.addEventListener("DOMContentLoaded", () => {
  loadOrderPageData();
  setupEventListeners();
});

function setupEventListeners() {
  // Rush order checkbox
  const rushOrderCheckbox = document.getElementById("rush-order");
  if (rushOrderCheckbox) {
    rushOrderCheckbox.addEventListener("change", toggleRushOrderDetails);
  }

  // Province/city change for delivery fee calculation
  const provinceInput = document.getElementById("order-province");
  if (provinceInput) {
    provinceInput.addEventListener("change", calculateDeliveryFee);
    provinceInput.addEventListener("blur", calculateDeliveryFee);
  }

  // Address input for rush order validation
  const addressInput = document.getElementById("order-address");
  if (addressInput) {
    addressInput.addEventListener("blur", validateRushOrderEligibility);
  }
}

async function loadOrderPageData() {
  try {
    // Load cart data
    const response = await fetch(`/api/carts/${sessionId}`);
    if (!response.ok) throw new Error("Failed to load cart");

    const cartData = await response.json();
    cart = cartData.items || [];

    if (cart.length === 0) {
      alert("Your cart is empty. Redirecting to products page.");
      window.location.href = "../pages/customer/customer-dashboard.html";
      return;
    }

    // Check for rush delivery eligibility
    checkRushDeliveryEligibility();

    // Calculate initial delivery fee
    calculateDeliveryFee();

    console.log("Order page loaded with cart:", cart);
  } catch (error) {
    console.error("Error loading order page:", error);
    alert("Error loading order data: " + error.message);
  }
}

function checkRushDeliveryEligibility() {
  // Check if any products support rush delivery
  const rushEligibleProducts = cart.filter((item) => item.rushDelivery);
  const rushOrderSection = document.querySelector(".rush-order-section");

  if (rushEligibleProducts.length === 0) {
    // Disable rush order option if no products support it
    const rushCheckbox = document.getElementById("rush-order");
    if (rushCheckbox) {
      rushCheckbox.disabled = true;
      rushCheckbox.parentElement.style.opacity = "0.5";
    }
    if (rushOrderSection) {
      rushOrderSection.style.display = "none";
    }
  } else {
    // Show rush order option
    if (rushOrderSection) {
      rushOrderSection.style.display = "block";
    }
  }
}

function validateRushOrderEligibility() {
  const address = document.getElementById("order-address").value;
  const province = document.getElementById("order-province").value;
  const rushCheckbox = document.getElementById("rush-order");

  // Check if address is in Hanoi inner city districts
  const hanoiDistricts = [
    "Ba Đình",
    "Hoàn Kiếm",
    "Tây Hồ",
    "Long Biên",
    "Cầu Giấy",
    "Đống Đa",
    "Hai Bà Trưng",
    "Hoàng Mai",
    "Thanh Xuân",
    "Nam Từ Liêm",
    "Bắc Từ Liêm",
    "Hà Đông",
  ];

  const isHanoiInnerCity =
    province.toLowerCase().includes("hanoi") ||
    province.toLowerCase().includes("hà nội") ||
    hanoiDistricts.some((district) =>
      address.toLowerCase().includes(district.toLowerCase())
    );

  if (rushCheckbox && rushCheckbox.checked && !isHanoiInnerCity) {
    alert(
      "Rush delivery is only available for addresses within Hanoi inner city districts."
    );
    rushCheckbox.checked = false;
    toggleRushOrderDetails();
  }

  return isHanoiInnerCity;
}

function toggleRushOrderDetails() {
  const rushOrderDetails = document.getElementById("rush-order-details");
  const rushCheckbox = document.getElementById("rush-order");
  isRushOrderSelected = rushCheckbox ? rushCheckbox.checked : false;

  if (rushOrderDetails) {
    rushOrderDetails.classList.toggle("hidden", !isRushOrderSelected);
  }

  // Validate address for rush order
  if (isRushOrderSelected) {
    const isEligible = validateRushOrderEligibility();
    if (!isEligible) {
      return; // Exit if not eligible
    }
  }

  calculateDeliveryFee();
}

function calculateDeliveryFee() {
  const province = document.getElementById("order-province")?.value || "";
  const totalWeight = cart.reduce((sum, item) => {
    // Assuming weight is stored in product data, default to 0.5kg if not available
    const weight = item.weight || 0.5;
    return Math.max(sum, weight * item.quantity);
  }, 0);

  let deliveryFee = 0;
  let rushDeliveryFee = 0;

  // Check if location qualifies for different shipping rates
  const isHanoiOrHCM =
    province.toLowerCase().includes("hanoi") ||
    province.toLowerCase().includes("hà nội") ||
    province.toLowerCase().includes("ho chi minh") ||
    province.toLowerCase().includes("hồ chí minh");

  if (isHanoiOrHCM) {
    // Hanoi/HCM: 22,000 VND for first 3kg
    deliveryFee = 22000;
    if (totalWeight > 3) {
      const extraWeight = Math.ceil((totalWeight - 3) * 2); // Convert to 0.5kg units
      deliveryFee += extraWeight * 2500;
    }
  } else {
    // Other provinces: 30,000 VND for first 0.5kg
    deliveryFee = 30000;
    if (totalWeight > 0.5) {
      const extraWeight = Math.ceil((totalWeight - 0.5) * 2); // Convert to 0.5kg units
      deliveryFee += extraWeight * 2500;
    }
  }

  // Calculate subtotal (excluding VAT)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Check for free shipping eligibility (orders > 100,000 VND, max 25,000 VND discount)
  if (subtotal > 100000) {
    const discount = Math.min(deliveryFee, 25000);
    deliveryFee = Math.max(0, deliveryFee - discount);
  }

  // Rush delivery fee calculation
  if (isRushOrderSelected) {
    const rushEligibleItems = cart.filter((item) => item.rushDelivery);
    rushDeliveryFee = rushEligibleItems.reduce(
      (sum, item) => sum + item.quantity * 10000,
      0
    );
  }

  // Update UI
  updateOrderSummary(subtotal, deliveryFee, rushDeliveryFee);
}

function updateOrderSummary(subtotal, deliveryFee, rushDeliveryFee) {
  const subtotalWithVAT = subtotal * 1.1; // Add 10% VAT
  const totalDeliveryFee = deliveryFee + rushDeliveryFee;
  const grandTotal = subtotalWithVAT + totalDeliveryFee;

  // Update delivery fee display
  const deliveryFeeElement = document.getElementById("delivery-fee");
  if (deliveryFeeElement) {
    if (rushDeliveryFee > 0) {
      deliveryFeeElement.innerHTML = `
                Regular: ${formatCurrency(deliveryFee)}<br>
                Rush: ${formatCurrency(rushDeliveryFee)}<br>
                Total: ${formatCurrency(totalDeliveryFee)}
            `;
    } else {
      deliveryFeeElement.textContent = formatCurrency(deliveryFee);
    }
  }

  // Update total
  const totalElement = document.getElementById("order-total");
  if (totalElement) {
    totalElement.textContent = formatCurrency(grandTotal);
  }

  // Store calculated values for order submission
  window.orderCalculation = {
    subtotal,
    subtotalWithVAT,
    deliveryFee,
    rushDeliveryFee,
    totalDeliveryFee,
    grandTotal,
  };
}

async function placeOrder(event) {
  event.preventDefault();

  // Validate form
  const formData = {
    customerName: document.getElementById("order-name").value.trim(),
    email: document.getElementById("order-email").value.trim(),
    phone: document.getElementById("order-phone").value.trim(),
    provinceCity: document.getElementById("order-province").value.trim(),
    deliveryAddress: document.getElementById("order-address").value.trim(),
    deliveryMethod: isRushOrderSelected ? "rush" : "standard",
  };

  // Validate required fields
  if (
    !formData.customerName ||
    !formData.email ||
    !formData.phone ||
    !formData.provinceCity ||
    !formData.deliveryAddress
  ) {
    showError("Please fill in all required fields.");
    return;
  }

  // Validate email
  if (!isValidEmail(formData.email)) {
    showError("Please enter a valid email address.");
    return;
  }

  // Validate phone
  if (!isValidPhone(formData.phone)) {
    showError("Please enter a valid phone number.");
    return;
  }

  // Check cart one more time
  if (cart.length === 0) {
    showError("Your cart is empty.");
    return;
  }

  // Final stock check
  try {
    const stockResponse = await fetch(`/api/carts/${sessionId}`);
    const cartData = await stockResponse.json();

    if (
      cartData.status === "WARNING" ||
      Object.keys(cartData.deficiencies || {}).length > 0
    ) {
      showError(
        "Some items in your cart are out of stock. Please update your cart."
      );
      return;
    }
  } catch (error) {
    console.error("Error checking stock:", error);
    showError("Error validating stock. Please try again.");
    return;
  }

  // Prepare order data
  const orderData = {
    ...formData,
    deliveryFee: window.orderCalculation.totalDeliveryFee,
    totalAmount: window.orderCalculation.grandTotal,
    items: cart.map((item) => ({
      barcode: item.barcode,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  // Add rush order details if applicable
  if (isRushOrderSelected) {
    orderData.rushOrderDetails = {
      deliveryTime: document.getElementById("delivery-time").value,
      deliveryInstructions:
        document.getElementById("delivery-instructions").value || "",
    };
  }

  try {
    showLoading(true);

    // Create order and get payment URL
    const response = await fetch("/api/orders/from-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
      // Add sessionId as query parameter
      ...{ url: `/api/orders/from-cart?sessionId=${sessionId}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create order");
    }

    const result = await response.json();

    if (result.success && result.paymentUrl) {
      // Store order info for reference
      localStorage.setItem("pendingOrderId", result.orderId);
      localStorage.setItem("orderEmail", formData.email);

      // Redirect to VNPay
      window.location.href = result.paymentUrl;
    } else {
      throw new Error(result.error || "Failed to create payment URL");
    }
  } catch (error) {
    console.error("Error placing order:", error);
    showError("Error placing order: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

function showError(message) {
  const errorElement = document.getElementById("order-error");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    alert(message);
  }
}

function showLoading(show) {
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = show;
    submitButton.textContent = show ? "Processing..." : "Place Order";
  }
}

function formatCurrency(amount) {
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0) + " VND"
  );
}

// Handle payment return from VNPay
function handlePaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const vnpResponseCode = urlParams.get("vnp_ResponseCode");
  const vnpTransactionStatus = urlParams.get("vnp_TransactionStatus");
  const orderId = urlParams.get("vnp_TxnRef");

  if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
    // Payment successful
    alert("Payment successful! Your order has been placed.");
    // Clear cart and redirect
    localStorage.removeItem("cart");
    localStorage.removeItem("pendingOrderId");
    window.location.href = "/pages/customer/orders.html";
  } else {
    // Payment failed
    alert("Payment failed. Please try again.");
    window.location.href = "/pages/customer/cart.html";
  }
}

// Check if this is a payment return page
if (window.location.search.includes("vnp_ResponseCode")) {
  handlePaymentReturn();
}
