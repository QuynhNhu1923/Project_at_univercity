/* Tìm kiếm sản phẩm */
async function searchProducts() {
    const query = document.getElementById('search-products').value;
    const attribute = document.getElementById('search-attribute').value;
    const sort = document.getElementById('sort-products').value;
    try {
        const url = query
            ? `http://localhost:8080/api/products/search?query=${encodeURIComponent(query)}&attribute=${attribute}&sort=${sort}&page=${currentPage('products')}&size=20`
            : `http://localhost:8080/api/products/random?page=${currentPage('products')}&size=20&sort=${sort}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products.');
        const data = await response.json();
        const productList = document.querySelector('#product-list tbody');
        productList.innerHTML = '';
        data.content.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.type}</td>
                <td>${product.price} VND</td>
                <td>${product.stock}</td>
                <td class="${product.rushSupported ? 'rush-supported' : 'rush-unsupported'}">
                    ${product.rushSupported ? 'Supported' : 'Not Supported'}
                </td>
                <td><button onclick="viewProductDetails('${product.barcode}')">View</button></td>
            `;
            productList.appendChild(row);
        });
    } catch (error) {
        alert('Error searching products: ' + error.message);
    }
}

/* Xem chi tiết sản phẩm */
async function viewProductDetails(barcode) {
    try {
        const response = await fetch(`http://localhost:8080/api/products?barcode=${barcode}`);
        if (!response.ok) throw new Error('Failed to fetch product.');
        const product = await response.json();
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        navigateTo('customer/product-detail.html');
    } catch (error) {
        alert('Error fetching product: ' + error.message);
    }
}

/* Thêm sản phẩm mới */
async function addProduct(event) {
    event.preventDefault();
    const productData = {
        type: document.getElementById('product-type').value,
        name: document.getElementById('product-name-input').value,
        price: parseFloat(document.getElementById('product-price-input').value),
        stock: parseInt(document.getElementById('product-stock-input').value),
        releaseDate: document.getElementById('product-release-date').value || null,
        author: document.getElementById('product-author').value || '',
        description: document.getElementById('product-description-input').value,
        rushSupported: document.getElementById('rush-supported').checked
    };
    const errorElement = document.getElementById('product-error');
    errorElement.classList.add('hidden');
    if (!validateProduct(productData)) {
        errorElement.textContent = 'Invalid product data (e.g., incorrect date format).';
        errorElement.classList.remove('hidden');
        return;
    }
    try {
        const response = await fetch('http://localhost:8080/api/products/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        type: document.getElementById('product-type').value,
        name: document.getElementById('product-name-input').value,
        price: parseFloat(document.getElementById('product-price-input').value),
        stock: parseInt(document.getElementById('product-stock-input').value),
        releaseDate: document.getElementById('product-release-date').value || null,
        author: document.getElementById('product-author').value || '',
        description: document.getElementById('product-description-input').value,
        rushSupported: document.getElementById('rush-supported').checked
    };
    const errorElement = document.getElementById('product-error');
    errorElement.classList.add('hidden');
    if (!validateProduct(productData)) {
        errorElement.textContent = 'Invalid product data (e.g., incorrect date format).';
        errorElement.classList.remove('hidden');
        return;
    }
    try {
        const limitResponse = await fetch('http://localhost:8080/api/products/limits');
        const limits = await limitResponse.json();
        if (limits.updateCount >= 30) {
            throw new Error('Daily update limit (30 products) reached.');
        }
        const priceLimitResponse = await fetch(`http://localhost:8080/api/products/price-limits?barcode=${selectedProduct.barcode}`);
        const priceLimits = await priceLimitResponse.json();
        if (priceLimits.updateCount >= 2) {
            throw new Error('Daily price update limit (2 times) reached.');
        }
        if (productData.price < priceLimits.minPrice || productData.price > priceLimits.maxPrice) {
            throw new Error('Price must be between 30% and 150% of actual value.');
        }
        const response = await fetch('http://localhost:8080/api/products/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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
    const checkboxes = document.querySelectorAll('#product-manager-list input[type="checkbox"]:checked');
    if (checkboxes.length > 10) {
        alert('Cannot delete more than 10 products at a time.');
        return;
    }
    const errorElement = document.getElementById('product-error');
    errorElement.classList.add('hidden');
    try {
        const limitResponse = await fetch('http://localhost:8080/api/products/limits');
        const limits = await limitResponse.json();
        if (limits.deleteCount + checkboxes.length > 30) {
            throw new Error('Daily delete limit (30 products) reached.');
        }
        for (const checkbox of checkboxes) {
            const barcode = checkbox.value;
            const response = await fetch(`http://localhost:8080/api/products/delete/${barcode}`, {
                method: 'DELETE'
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
        const response = await fetch(`http://localhost:8080/api/products?page=${currentPage('productManager')}&size=20&sort=priceAsc`);
        if (!response.ok) throw new Error('Failed to fetch products.');
        const data = await response.json();
        const productList = document.querySelector('#product-manager-list tbody');
        productList.innerHTML = '';
        data.content.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" value="${product.barcode}"></td>
                <td>${product.name}</td>
                <td>${product.type}</td>
                <td>${product.price} VND</td>
                <td>${product.stock}</td>
                <td>${product.rushSupported ? 'Yes' : 'No'}</td>
            `;
            row.onclick = () => selectProductForUpdate(product);
            productList.appendChild(row);
        });
    } catch (error) {
        alert('Error loading products: ' + error.message);
    }
}

/* Chọn sản phẩm để cập nhật */
function selectProductForUpdate(product) {
    selectedProduct = product;
    document.getElementById('product-type').value = product.type;
    document.getElementById('product-name-input').value = product.name;
    document.getElementById('product-price-input').value = product.price;
    document.getElementById('product-stock-input').value = product.stock;
    document.getElementById('product-release-date').value = product.releaseDate || '';
    document.getElementById('product-author').value = product.author || '';
    document.getElementById('product-description-input').value = product.description;
    document.getElementById('rush-supported').checked = product.rushSupported;
}

/* Validate dữ liệu sản phẩm */
function validateProduct(product) {
    if (!product.name || !product.type || !product.price || !product.stock || !product.description) {
        return false;
    }
    if (product.releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(product.releaseDate)) {
        return false;
    }
    if (product.price <= 0 || product.stock < 0) {
        return false;
    }
    return true;
}

/* Điều hướng trang trước/sau */
function prevProductPage() {
    if (currentPage('products') > 0) {
        updateCurrentPage('products', currentPage('products') - 1);
        searchProducts();
    }
}
function nextProductPage() {
    updateCurrentPage('products', currentPage('products') + 1);
    searchProducts();
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