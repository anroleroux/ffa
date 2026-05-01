package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	_ "github.com/lib/pq"
)

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	CategoryID  int     `json:"category_id"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	Description string  `json:"description"`
}

var db *sql.DB

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://ffa:ffa@localhost:5432/ffa?sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err = db.Ping(); err != nil {
		log.Fatal("db:", err)
	}

	mux := http.NewServeMux()

	mux.Handle("/", http.FileServer(http.Dir("ui/dist")))

	mux.HandleFunc("GET /api/categories", listCategories)
	mux.HandleFunc("POST /api/categories", createCategory)
	mux.HandleFunc("PUT /api/categories/{id}", updateCategory)
	mux.HandleFunc("DELETE /api/categories/{id}", deleteCategory)

	mux.HandleFunc("GET /api/products", listProducts)
	mux.HandleFunc("POST /api/products", createProduct)
	mux.HandleFunc("PATCH /api/products/{id}", patchProduct)
	mux.HandleFunc("DELETE /api/products/{id}", deleteProduct)

	addr := ":8080"
	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

// ── Categories ────────────────────────────────────────────────────────────────

func listCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := db.QueryContext(r.Context(),
		`select id, name, description from categories order by name`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	out := make([]Category, 0)
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		out = append(out, c)
	}
	writeJSON(w, out)
}

func createCategory(w http.ResponseWriter, r *http.Request) {
	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := db.QueryRowContext(r.Context(),
		`insert into categories (name, description) values ($1, $2)
		 returning id, name, description`,
		c.Name, c.Description,
	).Scan(&c.ID, &c.Name, &c.Description)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, c)
}

func updateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err = db.QueryRowContext(r.Context(),
		`update categories set name=$1, description=$2 where id=$3
		 returning id, name, description`,
		c.Name, c.Description, id,
	).Scan(&c.ID, &c.Name, &c.Description)
	if err == sql.ErrNoRows {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, c)
}

func deleteCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	res, err := db.ExecContext(r.Context(), `delete from categories where id=$1`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Products ──────────────────────────────────────────────────────────────────

func listProducts(w http.ResponseWriter, r *http.Request) {
	rows, err := db.QueryContext(r.Context(),
		`select id, name, category_id, price, stock, description
		 from products order by name`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	out := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.CategoryID, &p.Price, &p.Stock, &p.Description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		out = append(out, p)
	}
	writeJSON(w, out)
}

func createProduct(w http.ResponseWriter, r *http.Request) {
	var p Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := db.QueryRowContext(r.Context(),
		`insert into products (name, category_id, price, stock, description)
		 values ($1, $2, $3, $4, $5)
		 returning id, name, category_id, price, stock, description`,
		p.Name, p.CategoryID, p.Price, p.Stock, p.Description,
	).Scan(&p.ID, &p.Name, &p.CategoryID, &p.Price, &p.Stock, &p.Description)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, p)
}

// patchProduct accepts a partial JSON body and updates only the supplied fields.
// Field names are validated against an allowlist before being used in the query.
func patchProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var patch map[string]any
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	allowed := map[string]bool{
		"name": true, "category_id": true,
		"price": true, "stock": true, "description": true,
	}
	type kv struct {
		col string
		val any
	}
	var fields []kv
	for k, v := range patch {
		if allowed[k] {
			fields = append(fields, kv{k, v})
		}
	}
	if len(fields) == 0 {
		http.Error(w, "no valid fields", http.StatusBadRequest)
		return
	}

	clauses := make([]string, len(fields))
	args := make([]any, len(fields))
	for i, f := range fields {
		clauses[i] = fmt.Sprintf("%s=$%d", f.col, i+1)
		args[i] = f.val
	}
	args = append(args, id)

	var p Product
	err = db.QueryRowContext(r.Context(),
		fmt.Sprintf(
			`update products set %s where id=$%d
			 returning id, name, category_id, price, stock, description`,
			strings.Join(clauses, ", "), len(args),
		),
		args...,
	).Scan(&p.ID, &p.Name, &p.CategoryID, &p.Price, &p.Stock, &p.Description)
	if err == sql.ErrNoRows {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, p)
}

func deleteProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	res, err := db.ExecContext(r.Context(), `delete from products where id=$1`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
