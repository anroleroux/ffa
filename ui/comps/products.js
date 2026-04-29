function searchTemplate(state) {
    const productTemplate = (p) => `
        <div class="product-card">
            <h2>${p.name}</h2>
            <p>${p.description}</p>
            <div>
                <button class="start-btn" type="button">Manage</button>
            </div>
        </div>
    `;

    const searchTemplate = (p,pid) => `
        <div onclick="selectProduct(${pid})">
            <p>${p.name}</p>
        </div>
    `;

    return `${state.selected?productTemplate(state.selected):state.list.map((sp,spid) => searchTemplate(sp,spid)).join("")}`;
}

const products = mount(
    document.getElementById("products-list"),
    {list:[],selected:null},
    searchTemplate
);

function selectProduct(pid) {
    products.selected = products.list[pid];
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
            {name:"ProductA"}, //testing
            {name:"ProductB"} //testing
        ); //testing
    } //testing
}