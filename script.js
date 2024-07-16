document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split("/").pop();

    switch (currentPage) {
        case "index.html":
            loadFeaturedProducts();
            loadLatestBlogPosts();
            break;
        case "products.html":
            loadProducts();
            setupFilterForm();
            setupEditProductForm();
            break;
        case "products-detail.html":
            loadProductDetail();
            setupReviewForm();
            break;
        case "blog.html":
            loadBlogPosts();
            break;
        case "add-product.html":
            setupAddProductForm();
            break;
    }
});

async function fetchData(endpoint) {
    const response = await fetch(`http://localhost:3000/${endpoint}`);
    return await response.json();
}

async function postData(endpoint, data) {
    const response = await fetch(`http://localhost:3000/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return await response.json();
}

async function updateData(endpoint, id, data) {
    const response = await fetch(`http://localhost:3000/${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return await response.json();
}

async function deleteData(endpoint, id) {
    const response = await fetch(`http://localhost:3000/${endpoint}/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'col-md-4 product-card';
    card.innerHTML = `
        <div class="card">
            <img src="${product.image}" class="card-img-top" alt="${product.name}">
            <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">Ksh ${product.price.toFixed(2)}</p>
                <a href="products-detail.html?id=${product.id}" class="btn btn-primary">View Details</a>
                <button class="btn btn-secondary edit-product" data-id="${product.id}">Edit</button>
                <button class="btn btn-danger delete-product" data-id="${product.id}">Delete</button>
            </div>
        </div>
    `;
    return card;
}

async function loadFeaturedProducts() {
    const featuredProducts = await fetchData('products?_limit=3');
    const featuredProductsContainer = document.getElementById('featuredProducts');
    featuredProducts.forEach(product => {
        featuredProductsContainer.appendChild(createProductCard(product));
    });
}

async function loadLatestBlogPosts() {
    const latestPosts = await fetchData('blogPosts?_sort=date&_order=desc&_limit=3');
    const latestBlogPostsContainer = document.getElementById('latestBlogPosts');
    latestPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>By ${post.author} on ${new Date(post.date).toLocaleDateString()}</p>
            <p>${post.content.substring(0, 100)}...</p>
        `;
        latestBlogPostsContainer.appendChild(postElement);
    });
}

async function loadProducts() {
    const products = await fetchData('products');
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    products.forEach(product => {
        const productCard = createProductCard(product);
        productList.appendChild(productCard);
        
        // Add event listener for delete button
        const deleteButton = productCard.querySelector('.delete-product');
        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this product?')) {
                await deleteData('products', product.id);
                productCard.remove();
            }
        });

        // Add event listener for edit button
        const editButton = productCard.querySelector('.edit-product');
        editButton.addEventListener('click', () => loadProductForEdit(product.id));
    });
}

function setupFilterForm() {
    const filterForm = document.getElementById('filterForm');
    const priceRange = document.getElementById('priceRange');
    const priceRangeValue = document.getElementById('priceRangeValue');

    priceRange.addEventListener('input', () => {
        priceRangeValue.textContent = `Ksh ${priceRange.value}`;
    });

    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const skinType = document.getElementById('skinType').value;
        const category = document.getElementById('category').value;
        const maxPrice = priceRange.value;

        let url = 'products?';
        if (skinType) url += `skinType=${skinType}&`;
        if (category) url += `category=${category}&`;
        url += `price_lte=${maxPrice}`;

        const filteredProducts = await fetchData(url);
        const productList = document.getElementById('productList');
        productList.innerHTML = '';
        filteredProducts.forEach(product => {
            productList.appendChild(createProductCard(product));
        });
    });
}


async function loadProductDetails(productId) {
    const product = await fetchData(`products/${productId}`);
    const productDetailContainer = document.getElementById('productDetail');
    
    productDetailContainer.innerHTML = `
        <h1>${product.name}</h1>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <p><strong>Price:</strong> Ksh ${product.price.toFixed(2)}</p>
        <p><strong>Brand:</strong> ${product.brand}</p>
        <p><strong>Skin Type:</strong> ${product.skinType}</p>
        <p><strong>Category:</strong> ${product.category}</p>
        <p><strong>Description:</strong> ${product.description}</p>
        <p><strong>Ingredients:</strong> ${product.ingredients}</p>
        <p><strong>Usage:</strong> ${product.usage}</p>
    `;

    // Load reviews for this product
    loadReviews(productId);
}

async function loadReviews(productId) {
    const reviews = await fetchData(`reviews?productId=${productId}`);
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';
    
    if (reviews.length === 0) {
        reviewList.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
    } else {
        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.innerHTML = `
                <h4>${review.username}</h4>
                <p>Rating: ${review.rating}/5</p>
                <p>${review.comment}</p>
            `;
            reviewList.appendChild(reviewElement);
        });
    }
}




function setupReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const username = document.getElementById('username').value;
        const rating = document.getElementById('rating').value;
        const comment = document.getElementById('comment').value;

        const newReview = {
            productId: parseInt(productId),
            username,
            rating: parseInt(rating),
            comment
        };

        await postData('reviews', newReview);
        loadReviews(productId);
        reviewForm.reset();
    });
}

async function loadBlogPosts() {
    const posts = await fetchData('blogPosts');
    const blogPosts = document.getElementById('blogPosts');
    posts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.innerHTML = `
            <h2>${post.title}</h2>
            <p>By ${post.author} on ${new Date(post.date).toLocaleDateString()}</p>
            <p>${post.content}</p>
            <hr>
        `;
        blogPosts.appendChild(postElement);
    });
}

function setupAddProductForm() {
    const addProductForm = document.getElementById('addProductForm');
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            skinType: document.getElementById('productSkinType').value,
            category: document.getElementById('productCategory').value,
            brand: document.getElementById('productBrand').value,
            description: document.getElementById('productDescription').value,
            ingredients: document.getElementById('productIngredients').value,
            usage: document.getElementById('productUsage').value,
            image: document.getElementById('productImage').value
        };

        await postData('products', newProduct);
        alert('Product added successfully!');
        addProductForm.reset();
    });
}

async function loadProductForEdit(productId) {
    const product = await fetchData(`products/${productId}`);
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductSkinType').value = product.skinType;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductBrand').value = product.brand;
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductIngredients').value = product.ingredients;
    document.getElementById('editProductUsage').value = product.usage;
    document.getElementById('editProductImage').value = product.image;

    // Show the modal
    const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    editProductModal.show();
}

function setupEditProductForm() {
    const saveEditProductButton = document.getElementById('saveEditProduct');
    saveEditProductButton.addEventListener('click', async () => {
        const productId = document.getElementById('editProductId').value;
        const updatedProduct = {
            name: document.getElementById('editProductName').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            skinType: document.getElementById('editProductSkinType').value,
            category: document.getElementById('editProductCategory').value,
            brand: document.getElementById('editProductBrand').value,
            description: document.getElementById('editProductDescription').value,
            ingredients: document.getElementById('editProductIngredients').value,
            usage: document.getElementById('editProductUsage').value,
            image: document.getElementById('editProductImage').value
        };

        await updateData('products', productId, updatedProduct);
        alert('Product updated successfully!');
        
        // Close the modal
        const editProductModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        editProductModal.hide();

        // Reload the products
        loadProducts();
    });
}

