import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Search, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { cartApi } from "@/api/cart";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalItems, setCart } = useCartStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load cart on login
  useEffect(() => {
    if (isAuthenticated) {
      cartApi
        .getCart()
        .then(({ data }) => setCart(data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${search}`);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <nav className="bg-orange-500 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold shrink-0">
            Jumia<span className="text-yellow-300">Clone</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 text-gray-800 rounded-l-md outline-none"
            />
            <button
              type="submit"
              className="bg-yellow-400 px-4 rounded-r-md hover:bg-yellow-500"
            >
              <Search size={20} className="text-gray-800" />
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Cart */}
            <Link to="/cart" className="relative">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* Toggle Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 hover:text-yellow-200 transition-colors"
                >
                  <User size={24} />
                  <span className="hidden md:block text-sm font-medium">
                    {user?.first_name || "Account"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-10 bg-white text-gray-800 rounded-md shadow-xl w-48 z-50 border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-orange-50 border-b">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-b transition-colors"
                    >
                      <User size={14} />
                      My Account
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-b transition-colors"
                    >
                      <ShoppingCart size={14} />
                      My Orders
                    </Link>
                    {user?.is_staff && (
                      <Link
                        to="/admin-dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-orange-50 text-sm border-b text-orange-600 font-medium"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 text-sm transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-orange-500 px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-orange-50 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
