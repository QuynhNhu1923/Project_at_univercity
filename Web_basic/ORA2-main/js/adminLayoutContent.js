const adminLayoutContent = adminPage.querySelector("#admin-layout-content");
const previewContent = adminLayoutContent.querySelector(".preview-layout");
let currentContentId = "";
let currentChildrenId = "";
let currentLayoutId = "";

const renderPreviewContent = () => {
  const numberItems = 128;
  for (i = 0; i < numberItems; i++) {
    previewContent.innerHTML += '<div class="layout-item"></div>';
  }
};

const renderAdminLayoutContent = (contentId, childrenId, layoutId) => {
  currentContentId = contentId;
  currentChildrenId = childrenId;
  currentLayoutId = layoutId;
  hideAllAdminContents();
  adminLayoutContent.classList.remove("hidden");
  // Lấy content
  const content = contentContainer.querySelector(`#${contentId}`);
  const contentTitle = content.getAttribute("title");
  const currentChild = content.querySelector(`#${childrenId}`);
  const childTitle = currentChild.querySelector(".section-header").textContent;
  const layout = currentChild.querySelector(`#${layoutId}`);
  const layoutTitle = layout.getAttribute("title");
  const layoutContent = layout.innerHTML;
  // Hiển thị title trang
  const titleSpan = adminLayoutContent.querySelector("#admin-title");
  titleSpan.textContent = `${contentTitle} / ${childTitle} / ${layoutTitle}`;
  const previewTitle = adminLayoutContent.querySelector(".section-header");
  previewTitle.textContent = `Preiview ${layoutTitle}`;
  // Hiển thị edit và preview
  window.ckeditor.setData(layoutContent);
  previewContent.innerHTML = "";
  const layoutCopy = layout.cloneNode(true);
  previewContent.appendChild(layoutCopy);
};

const updateAdmimnLayoutContent = (contentId, childrenId, layoutId) => {
  // Lấy content
  const content = contentContainer.querySelector(`#${contentId}`);
  const contentTitle = content.getAttribute("title");
  const currentChild = content.querySelector(`#${childrenId}`);
  const childTitle = currentChild.querySelector(".section-header").textContent;
  const layout = currentChild.querySelector(`#${layoutId}`);
  const layoutTitle = layout.getAttribute("title");
  const layoutContent = layout.innerHTML;
  // Hiển thị title trang
  const titleSpan = adminLayoutContent.querySelector("#admin-title");
  titleSpan.textContent = `${contentTitle} / ${childTitle} / ${layoutTitle}`;
  const previewTitle = adminLayoutContent.querySelector(".section-header");
  previewTitle.textContent = `Preiview ${layoutTitle}`;
  // Hiển thị edit và preview
  previewContent.innerHTML = "";
  const layoutCopy = layout.cloneNode(true);
  previewContent.appendChild(layoutCopy);
};

const checkData = (data) => {
  if (data.startsWith(`<figure class="table">`)) {
    let returnData = data.slice(22);
    returnData = returnData.slice(0, -9);
    return returnData;
  }
  return data;
};

const updateLayoutContent = () => {
  const layout = contentContainer.querySelector(`#${currentLayoutId}`);
  let data = window.ckeditor.getData();
  data = checkData(data);
  layout.innerHTML = data;
  updateAdmimnLayoutContent(
    currentContentId,
    currentChildrenId,
    currentLayoutId
  );
};
