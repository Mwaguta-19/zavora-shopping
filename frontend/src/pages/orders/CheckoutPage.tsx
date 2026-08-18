import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { cartApi } from "@/api/cart";
import { ordersApi } from "@/api/orders";
import { useCartStore } from "@/store/cartStore";
import AddressForm from "@/components/ui/AddressForm";
import { Plus, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PaymentForm({ orderNumber, onSuccess }: { orderNumber: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${orderNumber}` },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setProcessing(false);
    } else {
      toast.success("Payment successful!");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold disabled:opacity-60"
      >
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { setCart } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [step, setStep] = useState<"address" | "payment">("address");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCart().then((r) => r.data),
  });

  const { data: addresses, refetch: refetchAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => ordersApi.getAddresses().then((r) => r.data),
  });

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select an address");
      return;
    }
    setPlacing(true);
    try {
      const { data: order } = await ordersApi.checkout({ address_id: selectedAddress });
      setOrderNumber(order.order_number);

      const { data: intent } = await ordersApi.createPaymentIntent(order.order_number);
      setClientSecret((intent as any).client_secret);

      setCart({ id: 0, items: [], total_items: 0, subtotal: "0" });
      setStep("payment");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <button onClick={() => navigate("/products")} className="text-orange-500 hover:underline">
          Continue shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <span className={step === "address" ? "text-orange-500 font-semibold" : "text-gray-400"}>
          1. Shipping Address
        </span>
        <span className="text-gray-300">→</span>
        <span className={step === "payment" ? "text-orange-500 font-semibold" : "text-gray-400"}>
          2. Payment
        </span>
      </div>

      {step === "address" && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={18} /> Select Delivery Address
          </h2>

          {addresses && addresses.length > 0 && (
            <div className="space-y-2 mb-4">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`block border rounded-lg p-3 cursor-pointer ${
                    selectedAddress === addr.id ? "border-orange-500 bg-orange-50" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mr-2"
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                  />
                  <span className="font-medium">{addr.full_name}</span> — {addr.phone}
                  <p className="text-sm text-gray-500 ml-5">
                    {addr.address_line1}, {addr.city}, {addr.country}
                  </p>
                </label>
              ))}
            </div>
          )}

          {!showAddressForm ? (
            <button
              onClick={() => setShowAddressForm(true)}
              className="flex items-center gap-2 text-orange-500 text-sm font-medium hover:underline"
            >
              <Plus size={16} /> Add New Address
            </button>
          ) : (
            <div className="border-t pt-4 mt-4">
              <AddressForm
                onSuccess={() => {
                  setShowAddressForm(false);
                  refetchAddresses();
                }}
              />
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={!selectedAddress || placing}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold disabled:opacity-60"
          >
            {placing ? "Placing Order..." : `Continue to Payment — $${cart.subtotal}`}
          </button>
        </div>
      )}

      {step === "payment" && clientSecret && orderNumber && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Payment Details</h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              orderNumber={orderNumber}
              onSuccess={() => navigate(`/orders/${orderNumber}`)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}