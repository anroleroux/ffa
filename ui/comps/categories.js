function categoriesTemplate(state) {
    const addFormTemplate = () => `
        <form class="product-card product-card--detail" onsubmit="saveCategory(event)">
            <div class="product-card__header">
                <span class="product-card__category">New category</span>
                <button class="back-btn" type="button" onclick="categories.adding=false">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" required>
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

    const editFormTemplate = (c) => `
        <form class="product-card product-card--detail" onsubmit="updateCategory(event)">
            <div class="product-card__header">
                <span class="product-card__category">Edit category</span>
                <button class="back-btn" type="button" onclick="categories.editing=null">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" value="${c.name}" required>
                </div>
                <div class="add-form__field">
                    <label>Description</label>
                    <textarea name="description">${c.description || ''}</textarea>
                </div>
            </div>
            <div class="product-card__actions">
                <button class="start-btn" type="submit">Update</button>
            </div>
        </form>
    `;

    const rowTemplate = (c) => `
        <div class="item-row">
            <div class="item-row__main">
                <span class="item-row__name">${c.name}</span>
                <span class="item-row__category">${c.description || ''}</span>
            </div>
            <div class="row-actions">
                <button class="edit-btn" type="button" onclick="editCategory(${c.id})">Edit</button>
                <button class="delete-btn" type="button" onclick="deleteCategory(${c.id})">Delete</button>
            </div>
        </div>
    `;

    if (state.adding)  return addFormTemplate();
    if (state.editing) return editFormTemplate(state.editing);
    return `
        <div class="items-toolbar">
            <button class="start-btn" type="button" onclick="categories.adding=true">+ Add category</button>
        </div>
        ${state.list.map((c) => rowTemplate(c)).join("")}
    `;
}

var categories = mount(
    document.getElementById("categories-list"),
    {list: [], adding: false, editing: null},
    categoriesTemplate
);

function editCategory(id) {
    categories.editing = categories.list.find(c => c.id === id);
}

function categoryName(id) {
    const c = categories.list.find(c => c.id === id);
    return c ? c.name : '—';
}

async function deleteCategory(id) {
    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch(`/api/categories/${id}`, { method: "DELETE", headers });
        if (!response.ok) throw new Error("Failed to delete category");
        const idx = categories.list.findIndex(c => c.id === id);
        if (idx !== -1) categories.list.splice(idx, 1);
    } catch (err) {
        alert("Could not delete category.");
        return;
    }
    } else { //testing
        const idx = categories.list.findIndex(c => c.id === id); //testing
        if (idx !== -1) categories.list.splice(idx, 1); //testing
    } //testing
}

async function saveCategory(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
        name:        fd.get("name"),
        description: fd.get("description") || "",
    };

    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = { "Content-Type": "application/json" };
        if (userId) headers["X-User-Id"] = userId;
        const response = await fetch("/api/categories", {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to save category");
        const saved = await response.json();
        categories.list.push(saved);
        categories.adding = false;
    } catch (err) {
        alert("Could not save category.");
    }
    } else { //testing
        categories.list.push({...data, id: Date.now()}); //testing
        categories.adding = false; //testing
    } //testing
}

async function updateCategory(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updated = {
        id:          categories.editing.id,
        name:        fd.get("name"),
        description: fd.get("description") || "",
    };

    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = { "Content-Type": "application/json" };
        if (userId) headers["X-User-Id"] = userId;
        const response = await fetch(`/api/categories/${updated.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updated),
        });
        if (!response.ok) throw new Error("Failed to update category");
        const saved = await response.json();
        const idx = categories.list.findIndex(c => c.id === saved.id);
        if (idx !== -1) categories.list[idx] = saved;
    } catch (err) {
        alert("Could not update category.");
        return;
    }
    } else { //testing
        const idx = categories.list.findIndex(c => c.id === updated.id); //testing
        if (idx !== -1) categories.list[idx] = updated; //testing
    } //testing
    categories.editing = null;
}

async function loadCategories() {
    if (!testing) {  //testing
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch("/api/categories", { headers });
        if (!response.ok) throw new Error("Failed to fetch categories");
        const list = await response.json();
        categories.list = [];
        list.forEach(c => categories.list.push(c));
    } catch (error) {
        document.getElementById("categories-list").innerHTML = "<p>Could not load categories.</p>";
    }
    } else { //testing
        categories.list.push( //testing
            {id:1, name:"Baking",      description:"Flours, sugars, and baking essentials."}, //testing
            {id:2, name:"Oils",        description:"Cooking and dressing oils."}, //testing
            {id:3, name:"Dairy",       description:"Eggs, yogurt, and dairy products."}, //testing
            {id:4, name:"Sweeteners",  description:"Natural and refined sweeteners."}, //testing
            {id:5, name:"Grains",      description:"Rice, pasta, and whole grains."}, //testing
            {id:6, name:"Pantry",      description:"Tinned and shelf-stable goods."}, //testing
            {id:7, name:"Spices",      description:"Herbs, spices, and seasonings."}, //testing
            {id:8, name:"Snacks",      description:"Chocolates, nuts, and snack foods."} //testing
        ); //testing
    } //testing
}
