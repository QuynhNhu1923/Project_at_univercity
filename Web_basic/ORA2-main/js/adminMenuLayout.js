const adminMenuLayout = adminPage.querySelector("#admin-menu-layout");
const previewLayout = adminMenuLayout.querySelector(".preview-layout");

const renderPreviewLayout = () => {
  const numberItems = 128;
  for (i = 0; i < numberItems; i++) {
    previewLayout.innerHTML += '<div class="layout-item"></div>';
  }
};

const renderAdminMenuLayout = (contentId, childrenId) => {
  previewLayout.innerHTML = "";
  hideAllAdminContents();
  adminMenuLayout.classList.remove("hidden");
  // Lấy content
  const content = contentContainer.querySelector(`#${contentId}`);
  const currentChild = content.querySelector(`#${childrenId}`);
  const childTitle = currentChild.querySelector(".section-header").textContent;
  const layouts = currentChild.querySelectorAll(".layout");
  // Hiển thị title trang
  const titleSpan = adminMenuLayout.querySelector("#admin-title");
  titleSpan.textContent = `${content.getAttribute("title")} / ${childTitle}`;
  const previewTitle = adminMenuLayout.querySelector(".section-header");
  previewTitle.textContent = `Preiview ${childTitle}`;
  // Hiển thị nội dung trang
  const itemList = adminMenuLayout.querySelector(".admin-item-list");
  itemList.innerHTML = "";

  if (layouts.length === 0) {
    itemList.innerHTML += ` 
    <div class="admin-item" style="justify-content: center">
        <div class="admin-item-actions" style="justify-content: center">
          <button class="admin-item-btn" onclick="addFirstLayoutItem('${contentId}', '${childrenId}')"><i class="fa-solid fa-plus"></i></button>
        </div>
    </div>`;
  } else {
    layouts.forEach((item) => {
      const title = item.getAttribute("title");
      const layoutId = item.id;
      let styles = window.getComputedStyle(item);
      let gridColumn = styles.getPropertyValue("grid-column");
      let gridRow = styles.getPropertyValue("grid-row");
      let colValues = gridColumn.split(" / ").map(Number);
      let rowValues = gridRow.split(" / ").map(Number);
      let startCol = colValues[0];
      let endCol = colValues[1];
      if (endCol === -1) {
        endCol = 17;
      }
      let startRow = rowValues[0];
      let endRow = rowValues[1];
      itemList.innerHTML += ` 
          <div class="admin-item preview">
                <div class="preview-top">
                  <input class="admin-item-input" ${
                    !title && `placeholder="Nhập tiêu đề"`
                  } type="text" value="${title}" />
                  <div class="admin-item-actions">
                      <button class="admin-item-btn" onclick="showAdminLayoutContent('${contentId}', '${childrenId}', '${layoutId}')"><i class="fa-solid fa-eye"></i></button>
                      <button class="admin-item-btn" onclick="editLayoutItem(this, '${contentId}', '${childrenId}', '${layoutId}')"><i class="fa-solid fa-pencil"></i></button>
                      <button class="admin-item-btn" onclick="deleteLayoutItem('${contentId}', '${childrenId}', '${layoutId}')"><i class="fa-solid fa-xmark"></i></button>
                      <button class="admin-item-btn" onclick="addLayoutItem('${contentId}', '${childrenId}', '${layoutId}')"><i class="fa-solid fa-plus"></i></button>
                  </div>
                </div>
                <div class="preview-bottom">
                    <div class="position-input">
                        <label for="sc-${layoutId}">Cột bắt đầu: </label>
                        <input type="number" name="start-column" id="sc-${layoutId}" class="start-column" value="${startCol}" />
                    </div>
                    <div class="position-input">
                        <label for="ec-${layoutId}">Cột kết thúc: </label>
                        <input type="number" name="start-column" id="ec-${layoutId}" class="end-column" value="${endCol}" />
                    </div>
                    <div class="position-input">
                        <label for="sr-${layoutId}">Dòng bắt đầu: </label>
                        <input type="number" name="start-column" id="sr-${layoutId}" class="start-row" value="${startRow}" />
                    </div>
                    <div class="position-input">
                        <label for="er-${layoutId}">Dòng kết thúc: </label>
                        <input type="number" name="start-column" id="er-${layoutId}" class="end-row" value="${endRow}" />
                    </div>
                </div>
          </div>`;
      const previewItem = item.cloneNode(false);
      previewItem.innerHTML = "";
      previewItem.classList.add("preview-item");
      previewItem.textContent = previewItem.getAttribute("title");
      previewLayout.appendChild(previewItem);
    });
  }
  renderPreviewLayout();
};

const editLayoutItem = (element, contentId, childrenId, layoutId) => {
  const layout = contentContainer.querySelector(`#${layoutId}`);
  const item = element.closest(".admin-item");
  const startCol = item.querySelector(".start-column").value;
  const endCol = item.querySelector(".end-column").value;
  const startRow = item.querySelector(".start-row").value;
  const endRow = item.querySelector(".end-row").value;
  // Edit
  const input = item.querySelector(".admin-item-input");
  layout.setAttribute("title", input.value);
  let styles = `grid-column: ${startCol} / ${endCol}; grid-row: ${startRow} / ${endRow}`;
  if (!startRow || !endRow) {
    styles = `grid-column: ${startCol} / ${endCol}`;
  }
  layout.setAttribute("style", styles);
  renderAdminMenuLayout(contentId, childrenId);
};

const deleteLayoutItem = (contentId, childrenId, layoutId) => {
  const layout = contentContainer.querySelector(`#${layoutId}`);
  const title = layout.getAttribute("title");
  const confirm = window.confirm(
    `Bạn có chắc muốn xóa '${title.trim()}' không?`
  );
  if (confirm) {
    layout.remove();
    renderAdminMenuLayout(contentId, childrenId);
  }
};

const addLayoutItem = (contentId, childrenId, layoutId) => {
  const currentChild = contentContainer.querySelector(`#${childrenId}`);
  const count = parseInt(currentChild.getAttribute("count")) + 1;
  currentChild.setAttribute("count", count);

  const layout = contentContainer.querySelector(`#${layoutId}`);
  const newLayout = document.createElement("div");
  newLayout.id = `${childrenId}-content-${count}`;
  newLayout.className = "layout";
  newLayout.setAttribute("title", "");
  newLayout.setAttribute("style", "grid-column: 1 / -1");
  layout.insertAdjacentElement("afterend", newLayout);
  renderAdminMenuLayout(contentId, childrenId);
};

const addFirstLayoutItem = (contentId, childrenId) => {
  const currentChild = contentContainer.querySelector(`#${childrenId}`);
  const count = parseInt(currentChild.getAttribute("count")) + 1;
  currentChild.setAttribute("count", count);
  const body = currentChild.querySelector(".section-body");
  body.innerHTML += `<div id="${childrenId}-content-${count}" class="layout" title="" style="grid-column: 1 / -1"></div>`;
  renderAdminMenuLayout(contentId, childrenId);
};

const showAdminLayoutContent = (contentId, childrenId, layoutId) => {
  renderAdminLayoutContent(contentId, childrenId, layoutId);
};
