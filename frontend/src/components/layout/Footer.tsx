import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold mb-4">Zavora Shopping Online</h3>
          <p className="text-sm">Africa's leading e-commerce platform clone.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/products" className="hover:text-white">
                All Products
              </Link>
            </li>
            <li>
              <Link
                to="/products?is_featured=true"
                className="hover:text-white"
              >
                Featured
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/account" className="hover:text-white">
                My Account
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-white">
                My Orders
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Help</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-white">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                Returns
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 text-center py-4 text-sm">
        © 2026 Jaynova Systems - Mwaguta org. All rights reserved.
      </div>
    </footer>
  );
}
