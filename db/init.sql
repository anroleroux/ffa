create table categories (
    id          serial primary key,
    name        varchar(100) not null,
    description text         not null default ''
);

create table products (
    id          serial primary key,
    name        varchar(200)   not null,
    category_id integer        not null references categories(id),
    price       numeric(10, 2) not null,
    stock       integer        not null default 0,
    description text           not null default ''
);

insert into categories (id, name, description) values
    (1, 'Baking',     'Flours, sugars, and baking essentials.'),
    (2, 'Oils',       'Cooking and dressing oils.'),
    (3, 'Dairy',      'Eggs, yogurt, and dairy products.'),
    (4, 'Sweeteners', 'Natural and refined sweeteners.'),
    (5, 'Grains',     'Rice, pasta, and whole grains.'),
    (6, 'Pantry',     'Tinned and shelf-stable goods.'),
    (7, 'Spices',     'Herbs, spices, and seasonings.'),
    (8, 'Snacks',     'Chocolates, nuts, and snack foods.');

-- Advance the sequence past the seeded ids
select setval('categories_id_seq', (select max(id) from categories));

insert into products (id, name, category_id, price, stock, description) values
    (1,  'Whole Wheat Flour',      1, 3.49,  120, 'Stone-ground whole wheat flour, ideal for bread and pastry.'),
    (2,  'Organic Cane Sugar',     1, 5.99,   85, 'Unrefined organic cane sugar with a light molasses flavour.'),
    (3,  'Extra Virgin Olive Oil', 2, 12.99,  40, 'Cold-pressed from hand-picked olives, suitable for cooking and dressings.'),
    (4,  'Free-Range Eggs',        3, 6.49,  200, 'Dozen free-range eggs from pasture-raised hens.'),
    (5,  'Raw Wildflower Honey',   4, 9.75,   55, 'Unfiltered honey harvested from mixed wildflower meadows.'),
    (6,  'Basmati Rice',           5, 4.25,  300, 'Aged long-grain basmati rice with a delicate aroma.'),
    (7,  'Coconut Milk',           6, 2.89,    0, 'Full-fat unsweetened coconut milk in a BPA-free can.'),
    (8,  'Black Peppercorns',      7, 3.15,   70, 'Whole Tellicherry black peppercorns, freshly packaged.'),
    (9,  'Greek Yogurt',           3, 4.99,   90, 'Strained full-fat Greek yogurt, no additives or preservatives.'),
    (10, 'Dark Chocolate 70%',     8, 3.79,    0, 'Single-origin 70% dark chocolate bar, ethically sourced.');

select setval('products_id_seq', (select max(id) from products));
