const testing = true; //testing
const debug = false; //testing

function showPage(name) {
    document.querySelectorAll('main > section').forEach(s => s.hidden = true);
    document.getElementById('page-' + name).hidden = false;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-btn--active'));
    document.getElementById('nav-' + name).classList.add('nav-btn--active');
}

/* {{reactivity-js}} */

/* {{products-js}} */

/* {{categories-js}} */

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadProducts();
});