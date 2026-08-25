import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import api from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { User, Lock, Package, MapPin, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "@/utils/media";
import toast from "react-hot-toast";

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "addresses"
  >("profile");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
        m.ordersApi.getAddresses().then((r) => r.data),
      ),
    enabled: activeTab === "addresses",
  });

  // ---------------------------------------------------------
  // PROFILE UPDATE
  // ---------------------------------------------------------

  const handleProfileSave = async () => {
    setSaving(true);

    try {
      const { data } = await authApi.updateProfile(profileForm);

      updateUser(data);

      toast.success("Profile updated!");
    } catch (err: any) {
      console.error("Profile update error:", err.response?.data || err);

      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // AVATAR UPLOAD
  // ---------------------------------------------------------

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Basic validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      e.target.value = "";
      return;
    }

    // Optional size limit: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();

    // IMPORTANT:
    // Do NOT JSON.stringify this.
    // Do NOT manually set Content-Type.
    formData.append("avatar", file);

    console.log("Uploading avatar:", {
      name: file.name,
      type: file.type,
      size: file.size,
      formDataHasAvatar: formData.has("avatar"),
    });

    setUploadingAvatar(true);

    try {
      /*
       * api already has:
       *
       * baseURL:
       *   https://jumiaclone-production.up.railway.app/api
       *
       * and the request interceptor automatically adds:
       *
       * Authorization: Bearer <access_token>
       *
       * We intentionally DO NOT set Content-Type here.
       * Axios/browser will generate:
       *
       * multipart/form-data;
       * boundary=----------------...
       */
      const { data } = await api.patch("/auth/profile/", formData);

      updateUser(data);

      toast.success("Avatar updated! 🎉");
    } catch (err: any) {
      console.error("Avatar upload error:", err.response?.data || err);

      const errorData = err.response?.data;

      toast.error(
        errorData?.avatar?.[0] ||
          errorData?.detail ||
          "Failed to update avatar",
      );
    } finally {
      setUploadingAvatar(false);

      // Allow selecting the same image again
      e.target.value = "";
    }
  };

  // ---------------------------------------------------------
  // PASSWORD CHANGE
  // ---------------------------------------------------------

  const handlePasswordChange = async () => {
    if (!passwordForm.old_password) {
      toast.error("Enter your current password.");
      return;
    }

    if (!passwordForm.new_password) {
      toast.error("Enter a new password.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password2) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      await authApi.changePassword(passwordForm);

      toast.success("Password changed!");

      setPasswordForm({
        old_password: "",
        new_password: "",
        new_password2: "",
      });
    } catch (err: any) {
      console.error("Password change error:", err.response?.data || err);

      toast.error(
        err.response?.data?.old_password ||
          err.response?.data?.new_password ||
          err.response?.data?.new_password2 ||
          err.response?.data?.detail ||
          "Failed to change password",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // TABS
  // ---------------------------------------------------------

  const tabs = [
    {
      key: "profile",
      label: "Profile",
      icon: User,
    },
    {
      key: "password",
      label: "Password",
      icon: Lock,
    },
    {
      key: "addresses",
      label: "Addresses",
      icon: MapPin,
    },
  ] as const;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Account</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <div className="md:col-span-1">
          {/* Avatar Card */}
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

              {/* Camera Button */}
              <label
                className={`absolute bottom-0 right-0 bg-orange-500 rounded-full p-1 cursor-pointer hover:bg-orange-600 ${
                  uploadingAvatar ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploadingAvatar ? (
                  <span className="block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={12} className="text-white" />
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <p className="font-semibold text-gray-800">
              {user?.first_name} {user?.last_name}
            </p>

            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>

          {/* Navigation */}
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

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="md:col-span-3">
          {/* ===================================================
              PROFILE TAB
          ==================================================== */}

          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Personal Information
              </h2>

              <div className="space-y-4">
                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>

                    <input
                      value={profileForm.first_name}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          first_name: e.target.value,
                        })
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
                        setProfileForm({
                          ...profileForm,
                          last_name: e.target.value,
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>

                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>

                  <input
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="+254 700 000000"
                  />
                </div>

                {/* Save */}
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

          {/* ===================================================
              PASSWORD TAB
          ==================================================== */}

          {activeTab === "password" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Change Password
              </h2>

              <div className="space-y-4 max-w-md">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>

                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        old_password: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    value={passwordForm.new_password2}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password2: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Change Password */}
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

          {/* ===================================================
              ADDRESSES TAB
          ==================================================== */}

          {activeTab === "addresses" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Saved Addresses
              </h2>

              {!addresses || addresses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MapPin size={40} className="mx-auto mb-3 text-gray-300" />

                  <p>No addresses saved yet.</p>

                  <p className="text-sm mt-1">
                    Add an address during checkout.
                  </p>
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
