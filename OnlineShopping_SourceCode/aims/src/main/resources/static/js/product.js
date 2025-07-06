// Enhanced product.js with add product functionality
(function() {
  let productCurrentPages = { productManager: 0 };
  let sessionId = localStorage.getItem('sessionId') || Math.random().toString(36).substring(2);
  let selectedProduct = null;
  let initialProduct = null;

  function currentPage(key) { return productCurrentPages[key] || 0; }
  function updateCurrentPage(key, page) { productCurrentPages[key] = page; }
  function formatCurrency(value) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0); }
  function navigateTo(url) { window.location.href = url; }

  function getAuthToken() {
    return localStorage.getItem('token');
  }

  // Enhanced add product function
  async function addProduct(productData) {
    console.log('Adding product with data:', productData);

    try {
      // Validate required fields
      if (!validateProductData(productData)) {
        throw new Error('Invalid product data');
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Product added successfully:', result);
        showNotification('success', `Product added successfully! Barcode: ${result.barcode}`);
        return { success: true, barcode: result.barcode };
      } else {
        console.error('Failed to add product:', result);
        showNotification('error', result.error || 'Failed to add product');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showNotification('error', 'Network error: ' + error.message);
      return { success: false, error: error.message };
    }
  }

  // Validate product data before submission
  function validateProductData(productData) {
    const required = ['title', 'category', 'value', 'price', 'quantity', 'weight', 'condition'];

    for (const field of required) {
      if (!productData[field] || (typeof productData[field] === 'string' && productData[field].trim() === '')) {
        console.error(`Required field missing: ${field}`);
        return false;
      }
    }

    // Validate category
    if (!['Book', 'CD', 'LP', 'DVD'].includes(productData.category)) {
      console.error('Invalid category:', productData.category);
      return false;
    }

    // Validate price range (30% to 150% of value)
    if (productData.price < productData.value * 0.3 || productData.price > productData.value * 1.5) {
      console.error('Price outside allowed range');
      return false;
    }

    // Validate numeric fields
    if (productData.value <= 0 || productData.price <= 0 || productData.weight <= 0 || productData.quantity < 0) {
      console.error('Invalid numeric values');
      return false;
    }

    // Validate category-specific fields
    if (!validateCategorySpecificData(productData.category, productData.specificDetails)) {
      return false;
    }

    return true;
  }

  function validateCategorySpecificData(category, specificDetails) {
    if (!specificDetails) return true;

    switch (category) {
      case 'Book':
        if (!specificDetails.authors || !specificDetails.publisher || !specificDetails.coverType) {
          console.error('Missing required book fields');
          return false;
        }
        break;
      case 'CD':
      case 'LP':
        if (!specificDetails.artists || !specificDetails.recordLabel || !specificDetails.tracklist) {
          console.error('Missing required CD/LP fields');
          return false;
        }
        break;
      case 'DVD':
        if (!specificDetails.discType || !specificDetails.director || !specificDetails.runtime ||
            !specificDetails.studio || !specificDetails.language) {
          console.error('Missing required DVD fields');
          return false;
        }
        break;
    }
    return true;
  }

  // Show notification messages
  function showNotification(type, message) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            'bg-red-100 border border-red-400 text-red-700'
    }`;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Navigate to add product page
  function navigateToAddProduct() {
    navigateTo('/pages/productmanager/add-product.html');
  }

  function searchProducts() {
    const field = document.getElementById('search-field')?.value || 'barcode';
    const keyword = document.getElementById('search-input')?.value?.trim() || '';
    updateCurrentPage('productManager', 0);
    fetch(`/api/products/search?field=${field}&keyword=${encodeURIComponent(keyword)}&page=${currentPage('productManager')}&size=20&sort=priceAsc`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken() || ''}` }
    })
        .then(response => { if (!response.ok) throw new Error('Failed to search products.'); return response.json(); })
        .then(data => { console.log('Search response:', data); updateProductTable(data); })
        .catch(error => { console.error('Error in searchProducts:', error); updateProductTable({ content: [], totalPages: 0, totalElements: 0, size: 20, number: 0 }); });
  }

  async function loadProductManagerList() {
    try {
      console.log('Loading products, page:', currentPage('productManager'));
      const response = await fetch(`/api/products?page=${currentPage('productManager')}&size=20&sort=priceAsc`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken() || ''}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('API response (raw):', data);
      updateProductTable(data);
    } catch (error) {
      console.error('Error in loadProductManagerList:', error);
      updateProductTable({ content: [], totalPages: 0, totalElements: 0, size: 20, number: 0 });
    }
  }

  function updateProductTable(data) {
    console.log('Updating table with data:', data);
    const productTable = document.getElementById('product-manager-table');
    if (!productTable) {
      console.error('Product manager table not found!');
      return;
    }
    let tbody = productTable.getElementsByTagName('tbody')[0];
    if (!tbody) {
      console.error('Table body not found!');
      tbody = document.createElement('tbody');
      productTable.appendChild(tbody);
      console.log('New tbody created and appended:', tbody);
    } else if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      tbody.innerHTML = '';
      console.log('Existing tbody cleared:', tbody);
    }

    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      data.content.forEach(product => {
        console.log('Processing product:', product);
        const row = document.createElement('tr');
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = product.barcode;
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        const cells = [
          document.createElement('td'), document.createElement('td'),
          document.createElement('td'), document.createElement('td'),
          document.createElement('td'), document.createElement('td'),
          document.createElement('td')
        ];
        cells[0].textContent = product.barcode || 'N/A';
        cells[1].textContent = product.title || 'N/A';
        cells[2].textContent = product.category || 'N/A';
        cells[3].textContent = formatCurrency(product.price) || '0.00';
        cells[4].textContent = product.rush_delivery ? 'Yes' : 'No';
        cells[5].textContent = product.quantity || 0;

        const actionsCell = cells[6];
        const viewEditButton = document.createElement('button');
        viewEditButton.textContent = 'View/Edit';
        viewEditButton.className = 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm';
        viewEditButton.addEventListener('click', () => {
          console.log('View/Edit clicked for barcode:', product.barcode);
          loadProductDetailsWithEditOption(product.barcode);
        }, { once: true });
        actionsCell.appendChild(viewEditButton);

        cells.forEach(cell => row.appendChild(cell));
        tbody.appendChild(row);
        console.log('Row added to tbody:', row.outerHTML);
      });
      updatePagination(data.totalPages, currentPage('productManager'));
    } else {
      tbody.innerHTML = '<tr><td colspan="8">No products found</td></tr>';
      console.log('No products in response:', data);
    }
  }

  async function loadProductDetailsWithEditOption(barcode) {
    if (!barcode || !barcode.trim()) {
      console.error('Invalid barcode:', barcode);
      alert('Invalid product barcode');
      return;
    }
    console.log('Loading product details for barcode:', barcode);
    try {
      const response = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API response for details:', data);
      let product = null;
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        product = data.content[0];
      } else if (data.barcode) {
        product = data;
      }
      if (product) {
        selectedProduct = product;
        sessionStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
        navigateTo('/pages/productmanager/manager-product-detail.html');
      } else {
        console.warn('Product not found or invalid response for barcode:', barcode, 'Response:', data);
        alert('Product not found');
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      alert(`Error loading product details: ${error.message}`);
    }
  }

  async function updateProduct(product) {
    if (!product || !product.barcode) {
      alert('No product selected for update');
      return;
    }
    try {
      const response = await fetch(`/api/products/${product.barcode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`
        },
        body: JSON.stringify(product)
      });
      if (response.ok) {
        const result = await response.json();
        alert('Product updated successfully');
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        navigateTo('/pages/productmanager/product-management.html');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(`Error updating product: ${error.message}`);
    }
  }

  async function deleteProduct(barcode) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${barcode}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken() || ''}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showNotification('success', 'Product deleted successfully');
        loadProductManagerList();
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('error', 'Error deleting product: ' + error.message);
    }
  }

  async function deleteSelectedProducts() {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    const barcodes = Array.from(checkboxes).map(cb => cb.value);
    if (barcodes.length === 0) {
      alert('Please select at least one product to delete.');
      return;
    }
    if (barcodes.length > 10) {
      alert('Cannot delete more than 10 products at once.');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${barcodes.length} product(s)?`)) return;
    try {
      const response = await fetch('/api/products/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken() || ''}` },
        body: JSON.stringify(barcodes)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showNotification('success', `${result.deletedCount} products deleted successfully`);
        loadProductManagerList();
      } else {
        throw new Error(result.error || 'Failed to delete selected products');
      }
    } catch (error) {
      console.error('Error deleting selected products:', error);
      showNotification('error', 'Error deleting selected products: ' + error.message);
    }
  }

  function selectProductForUpdate(product) { selectedProduct = product; }
  function validateProduct(product) { return validateProductData(product); }

  function updatePagination(totalPages, currentPage) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (!prevButton || !nextButton) {
      console.error('Pagination buttons not found!');
      return;
    }

    prevButton.disabled = currentPage <= 0;
    nextButton.disabled = currentPage >= totalPages - 1;

    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    }

    prevButton.onclick = () => {
      if (currentPage('productManager') > 0) {
        updateCurrentPage('productManager', currentPage('productManager') - 1);
        loadProductManagerList();
      }
    };
    nextButton.onclick = () => {
      updateCurrentPage('productManager', currentPage('productManager') + 1);
      loadProductManagerList();
    };
  }

  // Manager product detail page functions
  function hideAllSpecificDetails() {
    const bookDetails = document.getElementById('book-details');
    const cdDetails = document.getElementById('cd-details');
    const lpDetails = document.getElementById('lp-details');
    const dvdDetails = document.getElementById('dvd-details');

    if (bookDetails) bookDetails.classList.add('hidden');
    if (cdDetails) cdDetails.classList.add('hidden');
    if (lpDetails) lpDetails.classList.add('hidden');
    if (dvdDetails) dvdDetails.classList.add('hidden');
  }

  function validateForm() {
    const form = document.getElementById('edit-form');
    if (!form) return true;

    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
      const errorElement = document.getElementById(`${input.id}-error`);
      if (!input.value.trim()) {
        input.classList.add('error');
        if (errorElement) {
          errorElement.textContent = `Please enter ${input.previousElementSibling.textContent}`;
          errorElement.classList.remove('hidden');
        }
        isValid = false;
      } else {
        input.classList.remove('error');
        if (errorElement) {
          errorElement.classList.add('hidden');
        }
      }
    });
    return isValid;
  }

  function hasChanges() {
    if (!initialProduct) return false;
    const form = document.getElementById('edit-form');
    if (!form) return false;

    const inputs = form.querySelectorAll('input, textarea, select');
    return Array.from(inputs).some(input => {
      const fieldName = input.id.replace('edit-', '');
      if (input.type === 'checkbox') {
        return input.checked !== (initialProduct[fieldName] || false);
      }
      return input.value !== (initialProduct[fieldName] || '');
    });
  }

  async function saveProduct(event) {
    if (event) event.preventDefault();

    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }
    if (!hasChanges()) {
      alert('No changes to save');
      return;
    }
    if (!confirm('Are you sure you want to save changes?')) {
      return;
    }

    const updatedProduct = collectFormData();
    await updateProduct(updatedProduct);
  }

  function collectFormData() {
    const form = document.getElementById('edit-form');
    if (!form) return null;

    return {
      barcode: document.getElementById('edit-barcode')?.value,
      title: document.getElementById('edit-title')?.value,
      category: document.getElementById('edit-category')?.value,
      value: parseFloat(document.getElementById('edit-value')?.value) || 0,
      price: parseFloat(document.getElementById('edit-price')?.value) || 0,
      quantity: parseInt(document.getElementById('edit-quantity')?.value) || 0,
      warehouseEntryDate: document.getElementById('edit-warehouse-entry-date')?.value,
      dimensions: document.getElementById('edit-dimensions')?.value || '',
      weight: parseFloat(document.getElementById('edit-weight')?.value) || 0,
      description: document.getElementById('edit-description')?.value || '',
      condition: document.getElementById('edit-condition')?.value || '',
      rushDelivery: document.getElementById('edit-rush-delivery')?.checked || false,
      specificDetails: collectSpecificDetails()
    };
  }

  function collectSpecificDetails() {
    if (!initialProduct) return {};

    switch (initialProduct.category) {
      case 'Book':
        return {
          authors: document.getElementById('edit-authors')?.value || '',
          coverType: document.getElementById('edit-cover-type')?.value || '',
          publisher: document.getElementById('edit-publisher')?.value || '',
          publicationDate: document.getElementById('edit-publication-date')?.value || '',
          numPages: parseInt(document.getElementById('edit-num-pages')?.value) || 0,
          language: document.getElementById('edit-language')?.value || '',
          genre: document.getElementById('edit-genre')?.value || ''
        };
      case 'CD':
        return {
          artists: document.getElementById('edit-artists')?.value || '',
          recordLabel: document.getElementById('edit-record-label')?.value || '',
          tracklist: document.getElementById('edit-tracklist')?.value || '',
          genre: document.getElementById('edit-genre-cd')?.value || '',
          releaseDate: document.getElementById('edit-release-date-cd')?.value || ''
        };
      case 'LP':
        return {
          artists: document.getElementById('edit-artists-lp')?.value || '',
          recordLabel: document.getElementById('edit-record-label-lp')?.value || '',
          tracklist: document.getElementById('edit-tracklist-lp')?.value || '',
          genre: document.getElementById('edit-genre-lp')?.value || '',
          releaseDate: document.getElementById('edit-release-date-lp')?.value || ''
        };
      case 'DVD':
        return {
          discType: document.getElementById('edit-disc-type')?.value || '',
          director: document.getElementById('edit-director')?.value || '',
          runtime: parseInt(document.getElementById('edit-runtime')?.value) || 0,
          studio: document.getElementById('edit-studio')?.value || '',
          language: document.getElementById('edit-language-dvd')?.value || '',
          subtitles: document.getElementById('edit-subtitles')?.value || '',
          releaseDate: document.getElementById('edit-release-date-dvd')?.value || '',
          genre: document.getElementById('edit-genre-dvd')?.value || ''
        };
      default:
        return {};
    }
  }

  function cancelChanges() {
    if (hasChanges() && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    // Reset form to initial values
    populateFormWithProduct(initialProduct);
  }

  function populateFormWithProduct(product) {
    if (!product) return;

    // Populate common fields
    const fields = ['barcode', 'title', 'category', 'value', 'price', 'quantity',
      'warehouseEntryDate', 'dimensions', 'weight', 'description', 'condition'];

    fields.forEach(field => {
      const element = document.getElementById(`edit-${field}`);
      if (element) {
        if (field === 'warehouseEntryDate' && product[field]) {
          element.value = new Date(product[field]).toISOString().split('T')[0];
        } else {
          element.value = product[field] || '';
        }
      }
    });

    const rushDeliveryElement = document.getElementById('edit-rush-delivery');
    if (rushDeliveryElement) {
      rushDeliveryElement.checked = product.rushDelivery || false;
    }

    // Show/hide specific details based on category
    hideAllSpecificDetails();
    const specificDetails = document.getElementById('specific-details');
    if (specificDetails) specificDetails.classList.add('hidden');

    // Populate category-specific fields
    populateCategorySpecificFields(product);
  }

  function populateCategorySpecificFields(product) {
    const specificDetails = document.getElementById('specific-details');

    switch (product.category) {
      case 'Book':
        const bookDetails = document.getElementById('book-details');
        if (bookDetails && specificDetails) {
          bookDetails.classList.remove('hidden');
          specificDetails.classList.remove('hidden');

          const bookFields = ['authors', 'coverType', 'publisher', 'publicationDate', 'numPages', 'language', 'genre'];
          bookFields.forEach(field => {
            const element = document.getElementById(`edit-${field}`);
            if (element) {
              if (field === 'publicationDate' && product[field]) {
                element.value = new Date(product[field]).toISOString().split('T')[0];
              } else {
                element.value = product[field] || '';
              }
            }
          });
        }
        break;

      case 'CD':
        const cdDetails = document.getElementById('cd-details');
        if (cdDetails && specificDetails) {
          cdDetails.classList.remove('hidden');
          specificDetails.classList.remove('hidden');

          const cdFields = [
            {id: 'edit-artists', value: product.artists},
            {id: 'edit-record-label', value: product.recordLabel},
            {id: 'edit-tracklist', value: product.tracklist},
            {id: 'edit-genre-cd', value: product.genre},
            {id: 'edit-release-date-cd', value: product.releaseDate ? new Date(product.releaseDate).toISOString().split('T')[0] : ''}
          ];

          cdFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) element.value = field.value || '';
          });
        }
        break;

      case 'LP':
        const lpDetails = document.getElementById('lp-details');
        if (lpDetails && specificDetails) {
          lpDetails.classList.remove('hidden');
          specificDetails.classList.remove('hidden');

          const lpFields = [
            {id: 'edit-artists-lp', value: product.artists},
            {id: 'edit-record-label-lp', value: product.recordLabel},
            {id: 'edit-tracklist-lp', value: product.tracklist},
            {id: 'edit-genre-lp', value: product.genre},
            {id: 'edit-release-date-lp', value: product.releaseDate ? new Date(product.releaseDate).toISOString().split('T')[0] : ''}
          ];

          lpFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) element.value = field.value || '';
          });
        }
        break;

      case 'DVD':
        const dvdDetails = document.getElementById('dvd-details');
        if (dvdDetails && specificDetails) {
          dvdDetails.classList.remove('hidden');
          specificDetails.classList.remove('hidden');

          const dvdFields = [
            {id: 'edit-disc-type', value: product.discType},
            {id: 'edit-director', value: product.director},
            {id: 'edit-runtime', value: product.runtime},
            {id: 'edit-studio', value: product.studio},
            {id: 'edit-language-dvd', value: product.language},
            {id: 'edit-subtitles', value: product.subtitles},
            {id: 'edit-release-date-dvd', value: product.releaseDate ? new Date(product.releaseDate).toISOString().split('T')[0] : ''},
            {id: 'edit-genre-dvd', value: product.genre}
          ];

          dvdFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) element.value = field.value || '';
          });
        }
        break;
    }
  }

  function goBack() {
    if (hasChanges() && !confirm('You have unsaved changes. Are you sure you want to go back?')) {
      return;
    }
    navigateTo('/pages/productmanager/product-management.html');
  }

  function initializeProductDetailPage() {
    if (window.location.pathname !== '/pages/productmanager/manager-product-detail.html') return;

    const product = JSON.parse(sessionStorage.getItem('selectedProduct') || '{}');
    initialProduct = { ...product };

    if (!product || Object.keys(product).length === 0) {
      console.warn('No product data found in sessionStorage');
      alert('No product data found');
      navigateTo('/pages/productmanager/product-management.html');
      return;
    }

    populateFormWithProduct(product);

    // Attach event listeners
    const form = document.getElementById('edit-form');
    const cancelButton = document.getElementById('cancel-btn');
    const backButton = document.getElementById('back-btn');

    if (form) form.addEventListener('submit', saveProduct);
    if (cancelButton) cancelButton.addEventListener('click', cancelChanges);
    if (backButton) backButton.addEventListener('click', goBack);
  }

  // Authentication check
  window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage, redirecting to login.');
      navigateTo('/pages/productmanager/login.html');
    }
  });

  // Main event listeners
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing event listeners...');

    // Add product button
    const addButton = document.getElementById('add-product-btn');
    if (addButton) {
      addButton.addEventListener('click', navigateToAddProduct);
    }

    // Delete selected button
    const deleteButton = document.getElementById('delete-selected-btn');
    if (deleteButton) {
      deleteButton.addEventListener('click', deleteSelectedProducts);
    }

    // Search button
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
      searchButton.addEventListener('click', searchProducts);
    }

    // Pagination buttons
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (currentPage('productManager') > 0) {
          updateCurrentPage('productManager', currentPage('productManager') - 1);
          loadProductManagerList();
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        updateCurrentPage('productManager', currentPage('productManager') + 1);
        loadProductManagerList();
      });
    }

    // Initialize appropriate page
    if (window.location.pathname === '/pages/productmanager/product-management.html') {
      console.log('Calling loadProductManagerList...');
      loadProductManagerList();
    }

    if (window.location.pathname === '/pages/productmanager/manager-product-detail.html') {
      console.log('Initializing product detail page...');
      initializeProductDetailPage();
    }
  });

  // Export functions for global access
  window.productManager = {
    addProduct,
    validateProductData,
    navigateToAddProduct,
    loadProductManagerList,
    deleteSelectedProducts,
    searchProducts,
    showNotification
  };

})();