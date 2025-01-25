const adminPage = contentContainer.querySelector("#admin-page");
const adminContents = adminPage.querySelectorAll(".container");
const adminMenuTop = adminPage.querySelector("#admin-menu-top");

const hideAllAdminContents = () => {
  adminContents.forEach((item) => {
    item.classList.add("hidden");
  });
};

const renderAdminMenuTop = () => {
  hideAllAdminContents();
  adminMenuTop.classList.remove("hidden");
  const contents = contentContainer.querySelectorAll(".w3-container");
  const itemList = adminMenuTop.querySelector(".admin-item-list");
  itemList.innerHTML = "";

  contents.forEach((item, index) => {
    const contentId = item.id;
    const title = item.getAttribute("title");
    if (index === 0) {
      itemList.innerHTML += ` 
        <div class="admin-item">
            <div class="admin-item-input">Trang chủ</div>
            <div class="admin-item-actions">
                <button class="admin-item-btn" onclick="showAdminMenuLeft('${contentId}')"><i class="fa-solid fa-eye"></i></button>
                <button class="admin-item-btn" onclick="addNavbarItem('${contentId}')"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>`;
    } else if (index !== contents.length - 1) {
      itemList.innerHTML += ` 
        <div class="admin-item">
            <input class="admin-item-input" ${
              !title && `placeholder="Nhập tiêu đề"`
            } type="text" value="${title}" />
            <div class="admin-item-actions">
                <button class="admin-item-btn" onclick="showAdminMenuLeft('${contentId}')"><i class="fa-solid fa-eye"></i></button>
                <button class="admin-item-btn" onclick="editNavbarItem(this, '${contentId}')"><i class="fa-solid fa-pencil"></i></button>
                <button class="admin-item-btn" onclick="deleteNavbarItem('${contentId}')"><i class="fa-solid fa-xmark"></i></button>
                <button class="admin-item-btn" onclick="addNavbarItem('${contentId}')"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>`;
    }
  });
};

const editNavbarItem = (element, contentId) => {
  const content = contentContainer.querySelector(`#${contentId}`);
  const item = element.closest(".admin-item");
  const input = item.querySelector(".admin-item-input");
  content.setAttribute("title", input.value);
  renderNavbar();
  renderAdminMenuTop();
};

const deleteNavbarItem = (contentId) => {
  const content = contentContainer.querySelector(`#${contentId}`);
  const confirm = window.confirm(
    `Bạn có chắc muốn xóa '${content.getAttribute("title")}' không?`
  );
  if (confirm) {
    content.remove();
    renderNavbar();
    renderAdminMenuTop();
  }
};

const addNavbarItem = (contentId) => {
  const content = contentContainer.querySelector(`#${contentId}`);
  count++;
  const newChild = document.createElement("div");
  newChild.id = `section-${count}`;
  newChild.className = "w3-container w3-padding-64 hidden";
  newChild.setAttribute("title", "");
  newChild.setAttribute("count", "0");
  newChild.innerHTML = `<div class="container"></div>`;

  content.insertAdjacentElement("afterend", newChild);
  content.insertAdjacentHTML("afterend", `<!-- Section ${count} -->`);
  renderNavbar();
  renderAdminMenuTop();
};

const showAdminMenuLeft = (contentId) => {
  renderAdminMenuLeft(contentId);
};

renderAdminMenuTop();
