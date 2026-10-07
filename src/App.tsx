import { useEffect, useState, useMemo } from "react";

import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  getPaginationRowModel,
  type PaginationState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table"

type Product = {
  id: string;
  code: string;
  name: string;
  price: number;
  active: boolean;
};

const initialProducts: Product[] = [
  {
    id: "p1",
    code: "ASS-BASE",
    name: "Assistenza Base",
    price: 120,
    active: true,
  },
  {
    id: "p2",
    code: "ASS-PLUS",
    name: "Assistenza Plus",
    price: 240,
    active: true,
  },
  {
    id: "p3",
    code: "ASS-OLD",
    name: "Assistenza Legacy",
    price: 90,
    active: false,
  },
  {
    id: "p4",
    code: "ASS-PLATINUM",
    name: "Assistenza alto livello",
    price: 320,
    active: true,
  },
];

const priceFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

function ProductDetail({ products }: { products: Product[] }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const query = searchParams.toString();

  const backToList = {
    pathname: "/products",
    search: query ? `?${query}` : "",
  };

  const product = products.find((product) => product.id === id);

  if (!product) {
    return (
      <main>
        <h1>Prodotto non trovato!</h1>
        <Link to={backToList}>Torna ai prodotti</Link>
      </main>
    );
  }

  return (
    <main>
      <Link to={backToList}>Torna ai prodotti</Link>

      <h1>{product.name}</h1>
      <p>Codice: {product.code}</p>
      <p>Prezzo: {priceFormatter.format(product.price)}</p>
      <p>Stato: {product.active ? "Attivo" : "Disattivato"}</p>
    </main>
  )
}

const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "code",
    header: "Codice",
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "nome",
  },
  {
    accessorKey: "price",
    header: "Prezzo",
    cell: ({ row }) => priceFormatter.format(row.original.price),
  },
  {
    accessorKey: "active",
    header: "Stato",
    cell: ({ row }) => row.original.active ? "Attivo" : "Disattivato",
  },
]

export default function App() {

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const onlyActive = searchParams.get("active") === "true";
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 2,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  function handleToggleActive(productId: string) {
    setProducts((previousProducts) => previousProducts.map(
      (product) => product.id === productId ?
        { ...product, active: !product.active }
        : product
    )
    )
  }

  function handleOpen(productId: string) {
    console.log("Prodotto da aprire:", productId);

    const query = searchParams.toString();

    navigate({
      pathname: `/products/${productId}`,
      search: query ? `?${query}` : "",
    })
  }

  const activeCount = products.filter(
    (product) => product.active === true
  ).length

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product
        .name
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesActive = !onlyActive || product.active;

      return matchesSearch && matchesActive;
    });
  }, [products, normalizedSearch, onlyActive]);

  const table = useReactTable({
    data: filteredProducts,
    columns: productColumns,

    state: {
      sorting,
      pagination,
      columnVisibility,
      rowSelection,
    },

    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,

    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: (product) => product.id,

    enableMultiSort: false,
    sortDescFirst: false,
    autoResetPageIndex: true,
  });

  useEffect(() => {
    document.title = `Prodotti : ${filteredProducts.length} risultati`;
  }, [filteredProducts.length]);

  function handleSearchChange(value: string) {
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      if (value) {
        nextParams.set("q", value);
      } else {
        nextParams.delete("q");
      }

      return nextParams;

    }, { replace: true });
  }

  function handleOnlyActiveChange(checked: boolean) {
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      if (checked) {
        nextParams.set("active", "true")
      } else {
        nextParams.delete("active")
      }
      return nextParams;
    }, { replace: true })
  }

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  const listPage = (
    <main>
      <h1>Gestione prodotti</h1>
      <p>{products.length} prodotti</p>
      <p>{activeCount} prodotti attivi</p>
      <p>   </p>
      <label>
        cerca per nome
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </label>
      <p>   </p>
      <label>
        <input
          type="checkbox"
          checked={onlyActive}
          onChange={(event) => handleOnlyActiveChange(event.target.checked)}
        />
        solo prodotti attivi
      </label>

      <p>  {filteredProducts.length} risultati su {products.length} prodotti</p>

      <fieldset>
        <legend>Colonne visibili</legend>

        {table.getAllLeafColumns().map((column) => (
          <label key={column.id} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={column.getIsVisible()}
              disabled={!column.getCanHide()}
              onChange={column.getToggleVisibilityHandler()}
            />

            {typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : column.id}
          </label>
        ))}
      </fieldset>

      <p>{selectedCount} prodotti selezionati</p>

      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={() => setRowSelection({})}
      >
        Deseleziona tutti
      </button>

      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              <th scope="col">
                <label>
                  <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    disabled={table.getRowModel().rows.length === 0}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                  />
                  Seleziona pagina
                </label>
              </th>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sortDirection === "asc"
                        ? "ascending"
                        : sortDirection === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        {sortDirection === "asc" && " ↑"}
                        {sortDirection === "desc" && " ↓"}
                      </button>
                    )}
                  </th>
                );
              })}

              <th scope="col">Azioni</th>
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Seleziona ${row.original.name}`}
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                />
              </td>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </td>
              ))}

              <td>
                <button
                  type="button"
                  onClick={() => handleToggleActive(row.original.id)}
                >
                  {row.original.active ? "Disattiva" : "Attiva"}
                </button>

                <button
                  type="button"
                  disabled={!row.original.active}
                  onClick={() => handleOpen(row.original.id)}
                >
                  Apri
                </button>
              </td>
            </tr>
          ))}

          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={table.getVisibleLeafColumns().length + 2}>
                Nessun prodotto trovato
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Precedente
        </button>

        <span>
          {" "}
          Pagina{" "}
          {table.getPageCount() === 0 ? 0 : pagination.pageIndex + 1}
          {" di "}
          {table.getPageCount()}
          {" "}
        </span>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Successiva
        </button>

        <label>
          {" "}Righe per pagina{" "}
          <select
            value={pagination.pageSize}
            onChange={(event) =>
              table.setPageSize(Number(event.target.value))
            }
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={10}>10</option>
          </select>
        </label>
      </div>

    </main>
  )

  return (
    <Routes>
      <Route path="/" element={
        <Navigate to="/products" replace />
      } />

      <Route path="/products" element={listPage} />

      <Route
        path="/products/:id"
        element={<ProductDetail products={products} />}
      />

      <Route
        path="*"
        element={
          <main>
            <h1>Pagina non trovata</h1>
            <Link to="/products">Vai ai prodotti</Link>
          </main>
        } />
    </Routes>

  );
}