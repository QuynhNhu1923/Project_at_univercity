// quản lý cho other role
/* Biến toàn cục để quản lý trạng thái */
let currentPages = {
    products: 0,
    orders: 0,
    productManager: 0,
    pendingOrders: 0
};
let sessionId = localStorage.getItem('sessionId') || Math.random().toString(36).substring(2);
let cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
let selectedProduct = null;

/* Lấy số trang hiện tại */
function currentPage(key) {
    return currentPages[key] || 0;
}

/* Cập nhật số trang */
function updateCurrentPage(key, page) {
    currentPages[key] = page;
}

/* Tìm kiếm sản phẩm */
function searchProducts({page = 0, sort = 'priceAsc', attribute = 'barcode', keyword = ''}) {
    updateCurrentPage('products', page);
    const url = `/api/products?page=${page}&size=20`;
    console.log("Searching products: URL=", url, "Params:", { page, sort, attribute, keyword });

    fetch(url, {
        method: 'GET',
        headers: {
            //'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                console.error("API Error:", response.status, response.statusText);
                throw new Error(`Network error: ${response.status} - ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            try {
                const data = text ? JSON.parse(text) : {};
                console.log("Raw API Response:", text);
                console.log("Parsed API Response:", data);

                let content = [];
                let totalPages = 0;
                if (data.content) {
                    content = data.content;
                } else if (data._embedded && data._embedded.products) {
                    content = data._embedded.products;
                } else if (Array.isArray(data)) {
                    content = data;
                }
                if (data.totalPages) {
                    totalPages = data.totalPages;
                } else if (data.page && data.page.totalPages) {
                    totalPages = data.page.totalPages;
                }

                const grid = document.getElementById('product-grid');
                if (!grid) {
                    console.error("Product grid not found!");
                    throw new Error('Product grid element not found!');
                }

                grid.innerHTML = '';
                if (content.length > 0) {
                    content.forEach(product => {
                        const item = document.createElement('div');
                        item.className = 'product-item';
                        item.innerHTML = `
                            <div>Name: ${product.title || product.name || 'N/A'}</div>
                            <div>Type: ${product.category || 'N/A'}</div>
                            <div>Price: $${(product.price || 0).toFixed(2)}</div>
                            <div>Stock: ${product.quantity || product.stock || '0'}</div>
                            <div>Rush Delivery: ${product.rushDelivery ? 'Yes' : 'No'}</div>
                            <button onclick="loadProductDetails('${product.barcode || product.id || ''}')">View</button>
                    
                        `;
                        grid.appendChild(item);
                    });
                    updatePagination(totalPages, page);
                } else {
                    grid.innerHTML = '<div>No products found matching your search</div>';
                }
            } catch (jsonError) {
                console.error("JSON Parse Error:", jsonError, "Raw Response:", text);
                const grid = document.getElementById('product-grid');
                if (grid) grid.innerHTML = `<div>Error parsing data: ${jsonError.message}</div>`;
                throw jsonError;
            }
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            const grid = document.getElementById('product-grid');
            if (grid) grid.innerHTML = `<div>Error loading products: ${error.message}</div>`;
        });
}

/* Xem chi tiết sản phẩm */
async function viewProductDetails(barcode) {
    loadProductDetails(barcode);
}

/* Thêm sản phẩm mới */
async function addProduct(event) {
    event.preventDefault();
    const productData = {
        category: document.getElementById('product-type').value,
        title: document.getElementById('product-name-input').value,
        price: parseFloat(document.getElementById('product-price-input').value),
        quantity: parseInt(document.getElementById('product-stock-input').value),
        releaseDate: document.getElementById('product-release-date').value || null,
        author: document.getElementById('product-author').value || '',
        description: document.getElementById('product-description-input').value,
        rushDelivery: document.getElementById('rush-supported').checked
    };
    const errorElement = document.getElementById('product-error');
    errorElement.classList.add('hidden');
    if (!validateProduct(productData)) {
        errorElement.textContent = 'Invalid product data (e.g., incorrect date format).';
        errorElement.classList.remove('hidden');
        return;
    }
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to add product.');
        alert('Product added successfully.');
        document.getElementById('product-form').reset();
        loadProductManagerList();
    } catch (error) {
        errorElement.textContent = 'Error adding product: ' + error.message;
        errorElement.classList.remove('hidden');
    }
}

/* Cập nhật sản phẩm */
async function updateProduct() {
    if (!selectedProduct) {
        alert('Please select a product to update.');
        return;
    }
    const productData = {
        barcode: selectedProduct.barcode,
        category: document.getElementById('product-type').value,
        title: document.getElementById('product-name-input').value,
        price: parseFloat(document.getElementById('product-price-input').value),
        quantity: parseInt(document.getElementById('product-stock-input').value),
        releaseDate: document.getElementById('product-release-date').value || null,
        author: document.getElementById('product-author').value || '',
        description: document.getElementById('product-description-input').value,
        rushDelivery: document.getElementById('rush-supported').checked
    };
    const errorElement = document.getElementById('product-error');
    errorElement.classList.add('hidden');
    if (!validateProduct(productData)) {
        errorElement.textContent = 'Invalid product data (e.g., incorrect date format).';
        errorElement.classList.remove('hidden');
        return;
    }
    try {
        const limitResponse = await fetch('/api/products/limits', {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        const limits = await limitResponse.json();
        if (limits.updateCount >= 30) {
            throw new Error('Daily update limit (30 products) reached.');
        }
        const priceLimitResponse = await fetch(`/api/products/price-limits?barcode=${selectedProduct.barcode}`, {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        const priceLimits = await priceLimitResponse.json();
        if (priceLimits.updateCount >= 2) {
            throw new Error('Daily price update limit (2 times) reached.');
        }
        if (productData.price < priceLimits.minPrice || productData.price > priceLimits.maxPrice) {
            throw new Error('Price must be between 30% and 150% of actual value.');
        }
        const response = await fetch('/api/products', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to update product.');
        alert('Product updated successfully.');
        selectedProduct = null;
        document.getElementById('product-form').reset();
        loadProductManagerList();
    } catch (error) {
        errorElement.textContent = 'Error updating product: ' + error.message;
        errorElement.classList.remove('hidden');
    }
}

/* Xóa các sản phẩm được chọn */
async function deleteSelectedProducts() {
    const checkboxes = document.querySelectorAll('#product-manager-grid input[type="checkbox"]:checked');
    if (checkboxes.length > 10) {
        alert('Cannot delete more than 10 products at a time.');
        return;
    }
    const errorElement = document.getElementById('product-error');
    errorElement.classList.add('hidden');
    try {
        const limitResponse = await fetch('/api/products/limits', {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        const limits = await limitResponse.json();
        if (limits.deleteCount + checkboxes.length > 30) {
            throw new Error('Daily delete limit (30 products) reached.');
        }
        for (const checkbox of checkboxes) {
            const barcode = checkbox.value;
            const response = await fetch(`/api/products/${barcode}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            if (!response.ok) throw new Error(`Failed to delete product ${barcode}.`);
        }
        alert('Selected products deleted.');
        loadProductManagerList();
    } catch (error) {
        errorElement.textContent = 'Error deleting products: ' + error.message;
        errorElement.classList.remove('hidden');
    }
}

/* Tải danh sách sản phẩm cho Quản Lý Sản Phẩm */
async function loadProductManagerList() {
    try {
        const response = await fetch(`/api/products?page=${currentPage('productManager')}&size=20&sort=priceAsc`, {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        if (!response.ok) throw new Error('Failed to fetch products.');
        const data = await response.json();
        const productGrid = document.getElementById('product-manager-grid');
        if (!productGrid) throw new Error('Product manager grid not found!');
        productGrid.innerHTML = '';
        if (data.content?.length > 0) {
            data.content.forEach(product => {
                const item = document.createElement('div');
                item.className = 'product-item';
                item.innerHTML = `
                    <div><input type="checkbox" value="${product.barcode}"></div>
                    <div data-label="Name:">${product.title || 'N/A'}</div>
                    <div data-label="Type:">${product.category || 'N/A'}</div>
                    <div data-label="Price:">${product.price ? `$${product.price.toFixed(2)}` : '$0.00'}</div>
                    <div data-label="Stock:">${product.quantity || '0'}</div>
                    <div data-label="Rush Delivery:">${product.rushDelivery ? 'Yes' : 'No'}</div>
                `;
                item.onclick = () => selectProductForUpdate(product);
                productGrid.appendChild(item);
            });
            updatePagination(data.totalPages, currentPage('productManager'));
        } else {
            productGrid.innerHTML = '<div>No products found</div>';
        }
    } catch (error) {
        console.error('Error in loadProductManagerList:', error);
        alert('Error loading products: ' + error.message);
    }
}

/* Chọn sản phẩm để cập nhật */
function selectProductForUpdate(product) {
    selectedProduct = product;
    document.getElementById('product-type').value = product.category;
    document.getElementById('product-name-input').value = product.title;
    document.getElementById('product-price-input').value = product.price;
    document.getElementById('product-stock-input').value = product.quantity;
    document.getElementById('product-release-date').value = product.releaseDate || '';
    document.getElementById('product-author').value = product.author || '';
    document.getElementById('product-description-input').value = product.description;
    document.getElementById('rush-supported').checked = product.rushDelivery;
}

/* Validate dữ liệu sản phẩm */
function validateProduct(product) {
    if (!product.title || !product.category || !product.price || !product.quantity || !product.description) {
        return false;
    }
    if (product.releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(product.releaseDate)) {
        return false;
    }
    if (product.price <= 0 || product.quantity < 0) {
        return false;
    }
    return true;
}

/* Điều hướng trang trước/sau */
function prevProductPage() {
    if (currentPage('products') > 0) {
        updateCurrentPage('products', currentPage('products') - 1);
        searchProducts({
            page: currentPage('products'),
            sort: document.getElementById('sort-products').value,
            attribute: document.getElementById('search-attribute').value,
            keyword: document.getElementById('search-products').value
        });
    }
}

function nextProductPage() {
    updateCurrentPage('products', currentPage('products') + 1);
    searchProducts({
        page: currentPage('products'),
        sort: document.getElementById('sort-products').value,
        attribute: document.getElementById('search-attribute').value,
        keyword: document.getElementById('search-products').value
    });
}

function prevProductManagerPage() {
    if (currentPage('productManager') > 0) {
        updateCurrentPage('productManager', currentPage('productManager') - 1);
        loadProductManagerList();
    }
}

function nextProductManagerPage() {
    updateCurrentPage('productManager', currentPage('productManager') + 1);
    loadProductManagerList();
}