// Navbar
const navbar = document.getElementById("navbar");
let currentNavbarItem = navbar.querySelector(".navbar-item");
let navbarItems = navbar.querySelectorAll(".navbar-item");
navbarItems = Array.from(navbarItems);
// Sidebar
const sidebar = document.getElementById("mySidebar");
const overlay = document.getElementById("myOverlay");
let sidebarItems = sidebar.querySelectorAll(".sidebar-item");
sidebarItems = Array.from(sidebarItems);
// Content
const contentContainer = document.getElementById("content-container");
let count = contentContainer.querySelectorAll(".w3-container").length;
// let contents = document.querySelectorAll("#content-container .w3-container");

// Mở sidebar
const w3_open = () => {
  if (sidebar.style.display === "block") {
    sidebar.style.display = "none";
    overlay.style.display = "none";
  } else {
    sidebar.style.display = "block";
    overlay.style.display = "block";
  }
};

// Đóng sidebar
const w3_close = () => {
  sidebar.style.display = "none";
  overlay.style.display = "none";
};

const renderNavbar = () => {
  const itemList = navbar.querySelector(".item-list");
  itemList.innerHTML = "";
  const contents = contentContainer.querySelectorAll(".w3-container");
  contents.forEach((item, index) => {
    itemList.innerHTML += `
        <a
          href="javascript:void(0)"
          onclick="changePage('${item.id}')"
          id="${item.id}"
          class="w3-bar-item w3-button navbar-item"
        >
          ${
            index === 0 ? `<i class="fas fa-home">` : item.getAttribute("title")
          }</i>
        </a>`;
  });
};

const renderSidebar = (contentId) => {
  const content = contentContainer.querySelector(`#${contentId}`);
  const allItems = content.querySelectorAll(".content");
  const itemList = sidebar.querySelector(".item-list");
  itemList.innerHTML = "";
  itemList.innerHTML += `<h4 class="w3-bar-item"><b>${content.getAttribute(
    "title"
  )}</b></h4>`;
  if (allItems.length > 0) {
    allItems.forEach((item) => {
      const title = item.querySelector(".section-header").textContent;
      itemList.innerHTML += `<a class="w3-bar-item w3-button w3-hover-black sidebar-item" href="#${
        item.id
      }">${title !== "" ? title : "Chưa có tiêu đề"}</a>`;
    });
  }
};

const renderContent = (contentId) => {
  const contents = contentContainer.querySelectorAll(".w3-container");
  contents.forEach((item) => {
    item.classList.add("hidden");
  });
  const content = contentContainer.querySelector(`#${contentId}`);
  content.classList.remove("hidden");
};

const renderPage = (contentId) => {
  renderNavbar();
  if (contentId !== "admin-page") {
    renderSidebar(contentId);
  } else {
    const itemList = sidebar.querySelector(".item-list");
    itemList.innerHTML = "";
  }
  renderContent(contentId);
};

const changePage = (contentId) => {
  renderPage(contentId);
  const navbarItem = navbar.querySelector(`#${contentId}`);
  navbarItem.classList.add("active");
  window.scrollTo(0, 0);
  if (contentId === "admin-page") {
    renderAdminMenuTop();
  }
};

const activeSidebar = (activeId) => {
  const itemList = sidebar.querySelector(".item-list");
  const items = itemList.querySelectorAll("a");
  if (items.length > 0) {
    items.forEach((item) => {
      const href = item.getAttribute("href");
      if (href === `#${activeId}`) {
        item.classList.add("active");
      }
    });
  }
};

changePage("course-info");
