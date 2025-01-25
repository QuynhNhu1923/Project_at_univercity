const adminMenuLeft = adminPage.querySelector("#admin-menu-left");

const renderAdminMenuLeft = (contentId) => {
  const button = adminMenuLeft.querySelector("#reload-profile-btn");
  if (contentId === "profile") {
    button.classList.remove("hidden");
  } else {
    button.classList.add("hidden");
  }
  renderSidebar(contentId);
  hideAllAdminContents();
  adminMenuLeft.classList.remove("hidden");
  // Lấy content
  const content = contentContainer.querySelector(`#${contentId}`);
  const items = content.querySelectorAll(".content");
  // Hiển thị title trang
  const titleSpan = adminMenuLeft.querySelector("#admin-title");
  titleSpan.textContent = content.getAttribute("title");
  // Hiển thị nội dung trang
  const itemList = adminMenuLeft.querySelector(".admin-item-list");
  itemList.innerHTML = "";

  if (items.length === 0) {
    itemList.innerHTML += ` 
    <div class="admin-item" style="justify-content: center">
        <div class="admin-item-actions" style="justify-content: center">
          <button class="admin-item-btn" onclick="addFirstSidebarItem('${contentId}')"><i class="fa-solid fa-plus"></i></button>
        </div>
    </div>`;
  } else {
    items.forEach((item) => {
      const title = item.querySelector(".section-header").textContent.trim();
      const childrenId = item.id;
      itemList.innerHTML += ` 
          <div class="admin-item">
              <input class="admin-item-input" ${
                !title && `placeholder="Nhập tiêu đề"`
              } type="text" value="${title}" />
              <div class="admin-item-actions">
                  <button class="admin-item-btn" onclick="showAdminMenuLayout('${contentId}', '${childrenId}')"><i class="fa-solid fa-eye"></i></button>
                  <button class="admin-item-btn" onclick="editSidebarItem(this, '${contentId}', '${childrenId}')"><i class="fa-solid fa-pencil"></i></button>
                  <button class="admin-item-btn" onclick="deleteSidebarItem('${contentId}', '${childrenId}')"><i class="fa-solid fa-xmark"></i></button>
                  <button class="admin-item-btn" onclick="addSidebarItem('${contentId}', '${childrenId}')"><i class="fa-solid fa-plus"></i></button>
              </div>
          </div>`;
    });
  }
};

const editSidebarItem = (element, contentId, childrenId) => {
  const currentChild = contentContainer.querySelector(`#${childrenId}`);
  const title = currentChild.querySelector(".section-header");
  const item = element.closest(".admin-item");
  const input = item.querySelector(".admin-item-input");
  title.textContent = input.value;
  renderAdminMenuLeft(contentId);
};

const deleteSidebarItem = (contentId, childrenId) => {
  const currentChild = contentContainer.querySelector(`#${childrenId}`);
  const title = currentChild.querySelector(".section-header");
  const confirm = window.confirm(
    `Bạn có chắc muốn xóa '${title.textContent.trim()}' không?`
  );
  if (confirm) {
    currentChild.remove();
    renderAdminMenuLeft(contentId);
  }
};

const addSidebarItem = (contentId, childrenId) => {
  const content = contentContainer.querySelector(`#${contentId}`);
  const count = parseInt(content.getAttribute("count")) + 1;
  content.setAttribute("count", count);
  const currentChild = content.querySelector(`#${childrenId}`);

  const newChild = document.createElement("div");
  newChild.id = `${contentId}-${count}`;
  newChild.className = "content";
  newChild.setAttribute("count", "0");
  newChild.innerHTML = `<div class="section-header"></div><div class="section-body"></div>`;
  currentChild.insertAdjacentElement("afterend", newChild);
  currentChild.insertAdjacentHTML(
    "afterend",
    `<!-- Content-${contentId}-${count} -->`
  );
  renderAdminMenuLeft(contentId);
};

const addFirstSidebarItem = (contentId) => {
  const content = contentContainer.querySelector(`#${contentId}`);
  const count = parseInt(content.getAttribute("count")) + 1;
  content.setAttribute("count", count);
  const container = content.querySelector(".container");
  container.innerHTML = `
    <div id="${contentId}-1" class="content" count="0">
      <div class="section-header"></div>
      <div class="section-body"></div>
    </div> 
  `;
  renderAdminMenuLeft(contentId);
};

const showAdminMenuLayout = (contentId, childrenId) => {
  activeSidebar(childrenId);
  renderAdminMenuLayout(contentId, childrenId);
};

const resetProfile = () => {
  const resetProfile = document.querySelector("#profile-reset");
  const profile = contentContainer.querySelector("#profile");
  // Tạo bản sao
  profile.innerHTML = resetProfile.innerHTML;
  renderAdminMenuLeft("profile");
};
