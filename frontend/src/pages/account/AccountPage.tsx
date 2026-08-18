import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { User, Lock, Package, MapPin, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "@/utils/media";
import toast from "react-hot-toast";

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "addresses">("profile");
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () =>
      import("@/api/orders").then((m) =>
        m.ordersApi.getAddresses().then((r) => r.data)
      ),
    enabled: activeTab === "addresses",
  });

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(profileForm);
      updateUser(data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.new_password2) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(passwordForm);
      toast.success("Password changed!");
      setPasswordForm({ old_password: "", new_password: "", new_password2: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.old_password || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/auth/profile/", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.avatar?.[0] || "Upload failed");
        return;
      }

      const data = await res.json();
      updateUser(data);
      toast.success("Avatar updated! 🎉");
    } catch {
      toast.error("Failed to update avatar");
    }
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "addresses", label: "Addresses", icon: MapPin },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Account</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* Avatar */}
          <div className="bg-white rounded-lg shadow p-5 text-center mb-4">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={mediaUrl(user.avatar)}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-orange-500">
                    {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1 cursor-pointer hover:bg-orange-600">
                <Camera size={12} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <p className="font-semibold text-gray-800">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-b last:border-0 ${
                  activeTab === tab.key
                    ? "bg-orange-50 text-orange-500 border-l-2 border-l-orange-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
            <Link
              to="/orders"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Package size={16} />
              My Orders
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      value={profileForm.first_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, first_name: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      value={profileForm.last_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, last_name: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    value={user?.email}
                    disabled
                    className="w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="+254 700 000000"
                  />
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-md font-medium disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Change Password
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, old_password: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new_password2}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password2: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-md font-medium disabled:opacity-60"
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Saved Addresses
              </h2>
              {!addresses || addresses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MapPin size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>No addresses saved yet.</p>
                  <p className="text-sm mt-1">Add an address during checkout.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`border rounded-lg p-4 ${
                        addr.is_default ? "border-orange-400 bg-orange-50" : ""
                      }`}
                    >
                      <p className="font-medium text-gray-800">
                        {addr.full_name}
                        {addr.is_default && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
                      <p className="text-sm text-gray-500">
                        {addr.address_line1}, {addr.city}, {addr.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}