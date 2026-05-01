function productsTemplate(state) {
    const productTemplate = (p) => {
        const mr = 'products', api = '/api/products';
        return `
        <div class="product-card product-card--detail">
            <div class="product-card__header">
                <span class="product-card__category">${categoryName(p.category_id)}</span>
                <button class="back-btn" type="button" onclick="products.selected=null;products.editing_field=null">&#8592; Back</button>
            </div>
            <div class="product-card__fields">
                ${editableField(mr, api, 'Name',        'name',        p.name,                      'text')}
                ${editableField(mr, api, 'Category',    'category_id', categoryName(p.category_id), 'select', categories.list.map(c => ({value: c.id, label: c.name})))}
                ${editableField(mr, api, 'Price',       'price',       '$' + p.price.toFixed(2),    'number')}
                ${editableField(mr, api, 'Stock',       'stock',       String(p.stock),             'number')}
                ${editableField(mr, api, 'Description', 'description', p.description,              'text')}
            </div>
            <div class="product-card__actions">
                <button class="delete-btn" type="button" onclick="deleteProduct(products.selected)">Delete</button>
            </div>
        </div>
        `;
    };

    const addFormTemplate = () => `
        <form class="product-card product-card--detail" onsubmit="saveProduct(event)">
            <div class="product-card__header">
                <span class="product-card__category">New product</span>
                <button class="back-btn" type="button" onclick="products.adding=false">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" required>
                </div>
                <div class="add-form__field">
                    <label>Category</label>
                    <select name="category_id" required>
                        <option value="">Select a category</option>
                        ${categories.list.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                    </select>
                </div>
                <div class="add-form__field add-form__field--row">
                    <div class="add-form__field">
                        <label>Price</label>
                        <input name="price" type="number" step="0.01" min="0" required>
                    </div>
                    <div class="add-form__field">
                        <label>Stock</label>
                        <input name="stock" type="number" min="0" required>
                    </div>
                </div>
                <div class="add-form__field">
                    <label>Description</label>
                    <textarea name="description"></textarea>
                </div>
            </div>
            <div class="product-card__actions">
                <button class="start-btn" type="submit">Save</button>
            </div>
        </form>
    `;

    const rowTemplate = (p, pid) => `
        <div class="item-row" onclick="selectProduct(${pid})">
            <div class="item-row__main">
                <span class="item-row__name">${p.name}</span>
                <span class="item-row__category">${categoryName(p.category_id)}</span>
            </div>
            <div class="item-row__meta">
                <span class="item-row__price">$${p.price.toFixed(2)}</span>
                <span class="item-row__stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock > 0 ? 'In stock' : 'Out of stock'}</span>
            </div>
        </div>
    `;

    if (state.selected) return productTemplate(state.selected);
    if (state.adding)   return addFormTemplate();
    return `
        <div class="items-toolbar">
            <button class="start-btn" type="button" onclick="products.adding=true">+ Add product</button>
        </div>
        ${state.list.map((sp, spid) => rowTemplate(sp, spid)).join("")}
    `;
}

var products = mount(
    document.getElementById("products-list"),
    {list: [], selected: null, adding: false, editing_field: null},
    productsTemplate
);

function selectProduct(pid) {
    products.selected = products.list[pid];
}

async function deleteProduct(p) {
    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch(`/api/products/${p.id}`, { method: "DELETE", headers });
        if (!response.ok) throw new Error("Failed to delete product");
        const idx = products.list.findIndex(item => item.id === p.id);
        if (idx !== -1) products.list.splice(idx, 1);
    } catch (err) {
        alert("Could not delete product.");
        return;
    }
    } else { //testing
        const idx = products.list.findIndex(item => item.id === p.id); //testing
        if (idx !== -1) products.list.splice(idx, 1); //testing
    } //testing
    products.editing_field = null;
    products.selected = null;
}

async function saveProduct(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
        name:        fd.get("name"),
        category_id: parseInt(fd.get("category_id"), 10),
        price:       parseFloat(fd.get("price")),
        stock:       parseInt(fd.get("stock"), 10),
        description: fd.get("description") || "",
    };

    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = { "Content-Type": "application/json" };
        if (userId) headers["X-User-Id"] = userId;
        const response = await fetch("/api/products", {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to save product");
        const saved = await response.json();
        products.list.push(saved);
        products.adding = false;
    } catch (err) {
        alert("Could not save product.");
    }
    } else { //testing
        products.list.push({...data, id: Date.now()}); //testing
        products.adding = false; //testing
    } //testing
}

async function loadProducts() {
    const list = document.getElementById("products-list");
    list.innerHTML = "<li>Loading products...</li>";

    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch("/api/products", { headers });
        if (!response.ok) {
        throw new Error("Failed to fetch products");
        }
        const searchProducts = await response.json();

        if (!searchProducts.length) {
        list.innerHTML = "<li>No products found.</li>";
        return;
        }

        list.innerHTML = "";
        products.list = [];
        products.selected = null;
        searchProducts.forEach((p) => {
        products.list.push(p);
        });

    } catch (error) {
        list.innerHTML = "<li>Could not load products.</li>";
    }
    } else { //testing
        products.list.push( //testing
            {id:1,  name:"Whole Wheat Flour",      category_id:1, price:3.49,  stock:120, description:"Stone-ground whole wheat flour, ideal for bread and pastry."}, //testing
            {id:2,  name:"Organic Cane Sugar",     category_id:1, price:5.99,  stock:85,  description:"Unrefined organic cane sugar with a light molasses flavour."}, //testing
            {id:3,  name:"Extra Virgin Olive Oil", category_id:2, price:12.99, stock:40,  description:"Cold-pressed from hand-picked olives, suitable for cooking and dressings."}, //testing
            {id:4,  name:"Free-Range Eggs",        category_id:3, price:6.49,  stock:200, description:"Dozen free-range eggs from pasture-raised hens."}, //testing
            {id:5,  name:"Raw Wildflower Honey",   category_id:4, price:9.75,  stock:55,  description:"Unfiltered honey harvested from mixed wildflower meadows."}, //testing
            {id:6,  name:"Basmati Rice",           category_id:5, price:4.25,  stock:300, description:"Aged long-grain basmati rice with a delicate aroma."}, //testing
            {id:7,  name:"Coconut Milk",           category_id:6, price:2.89,  stock:0,   description:"Full-fat unsweetened coconut milk in a BPA-free can."}, //testing
            {id:8,  name:"Black Peppercorns",      category_id:7, price:3.15,  stock:70,  description:"Whole Tellicherry black peppercorns, freshly packaged."}, //testing
            {id:9,  name:"Greek Yogurt",           category_id:3, price:4.99,  stock:90,  description:"Strained full-fat Greek yogurt, no additives or preservatives."}, //testing
            {id:10, name:"Dark Chocolate 70%",     category_id:8, price:3.79,  stock:0,   description:"Single-origin 70% dark chocolate bar, ethically sourced."} //testing
        ); //testing
    } //testing
}
